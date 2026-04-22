'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, getMemberStatusColor, formatMemberStatus } from '@/lib/utils';
import { useUser } from '@/lib/hooks/useUser';

export default function DashboardPage() {
  const { user, member, loading: userLoading } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [recentLoans, setRecentLoans] = useState<any[]>([]);
  const [guarantorRequests, setGuarantorRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
    };
    checkAuth();
  }, [router, supabase]);

  useEffect(() => {
    if (!user || userLoading) return;

    const fetchDashboardData = async () => {
      try {
        if (user.role === 'MEMBER') {
          // For members, show pending status or active dashboard
          if (!member) {
            // Member data not loaded yet or doesn't exist
            setLoading(false);
            return;
          }
          const { data: loans } = await supabase
            .from('loans')
            .select('*')
            .eq('member_id', member.id)
            .order('created_at', { ascending: false })
            .limit(5);

          setRecentLoans(loans || []);

          const { data: requests } = await supabase
            .from('loan_guarantors')
            .select(`
              *,
              loans:loan_id (
                loan_number,
                amount,
                members:member_id (
                  user_id,
                  profiles:user_id (full_name)
                )
              )
            `)
            .eq('guarantor_member_id', member.id)
            .eq('status', 'PENDING')
            .order('requested_at', { ascending: false });

          setGuarantorRequests(requests || []);

          setStats({
            totalSavings: member.total_shares + member.total_deposits,
            availableBalance: member.available_balance,
            activeLoans: loans?.filter(l => l.status === 'DISBURSED').length || 0,
            pendingLoans: loans?.filter(l => ['SUBMITTED', 'AWAITING_GUARANTOR_APPROVAL', 'UNDER_CREDIT_REVIEW', 'COMMITTEE_REVIEW'].includes(l.status)).length || 0,
          });
        } else if (['ADMIN', 'SUPER_ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER'].includes(user.role)) {
          const { count: pendingMembers } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDING_APPROVAL');

          const { count: activeMembers } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ACTIVE');

          const { count: pendingLoans } = await supabase
            .from('loans')
            .select('*', { count: 'exact', head: true })
            .in('status', ['SUBMITTED', 'AWAITING_GUARANTOR_APPROVAL', 'UNDER_CREDIT_REVIEW', 'COMMITTEE_REVIEW']);

          const { data: totalDeposits } = await supabase
            .from('deposits')
            .select('amount')
            .eq('payment_status', 'COMPLETED');

          const totalAmount = totalDeposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

          setStats({
            pendingMembers: pendingMembers || 0,
            activeMembers: activeMembers || 0,
            pendingLoans: pendingLoans || 0,
            totalDeposits: totalAmount,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, member, userLoading, supabase]);

  if (userLoading || (loading && user?.role === 'MEMBER')) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground font-display font-bold text-xl">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground">
            Welcome back, {user.full_name}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {user.role === 'MEMBER' ? 'Manage your savings and loans' : 'System overview and management'}
          </p>
        </div>

        {user.role === 'MEMBER' && (member?.status === 'PENDING_APPROVAL' || !member) && (
          <>
            <Alert variant="warning" className="mb-6 border-warning bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
              <AlertTitle className="text-lg font-display font-bold text-warning-foreground">Membership Application Under Review</AlertTitle>
              <AlertDescription className="text-warning-foreground/80 mt-2">
                <p className="font-medium text-base">Your application is being reviewed by our admin team.</p>
                <p className="mt-2">You will receive a notification once your membership is approved. This usually takes 1-2 business days.</p>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">What Happens Next?</CardTitle>
                  <CardDescription className="text-slate-700 font-medium">Your membership approval process</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-slate-800">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">Application Submitted</span>
                        <p className="text-sm text-slate-600">Your documents are under review</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">Admin Review</span>
                        <p className="text-sm text-slate-600">Verification of documents and details</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-slate-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">Approval & Activation</span>
                        <p className="text-sm text-slate-600">You'll get access to all features</p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Once Approved, You Can:</CardTitle>
                  <CardDescription className="text-slate-700 font-medium">Available features for active members</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-slate-800">
                    <li className="flex items-start">
                      <Wallet className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">Make Deposits</span>
                        <p className="text-sm text-slate-600">Build your savings and shares</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <FileText className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">Apply for Loans</span>
                        <p className="text-sm text-slate-600">Access affordable credit facilities</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Users className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">Refer Members</span>
                        <p className="text-sm text-slate-600">Earn loyalty points for referrals</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <TrendingUp className="h-5 w-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">Track Your Growth</span>
                        <p className="text-sm text-slate-600">View statements and reports</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-blue-900">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 font-medium mb-4">
                  If you have questions about your application or need to update your information, please contact us:
                </p>
                <div className="space-y-2 text-blue-900">
                  <p><span className="font-semibold">Email:</span> support@hrdcsacco.co.ke</p>
                  <p><span className="font-semibold">Phone:</span> +254 700 000 000</p>
                  <p><span className="font-semibold">Office Hours:</span> Monday - Friday, 8:00 AM - 5:00 PM</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {user.role === 'MEMBER' && member?.status === 'ACTIVE' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-blue-600 card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">My Shares</CardTitle>
                  <Wallet className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {formatCurrency(member?.total_shares || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mt-2">
                    Share Capital
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-600 card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Monthly Deposits</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {formatCurrency(member?.total_deposits || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mt-2">
                    Total Contributions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-600 card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">My Loans</CardTitle>
                  <FileText className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {stats?.activeLoans || 0}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mt-2">
                    Active Loan(s)
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600 card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Can Borrow</CardTitle>
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {formatCurrency(member?.available_balance || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mt-2">
                    Loan Limit
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6 border-none bg-primary shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="h-32 w-32" />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-primary-foreground text-center md:text-left">
                    <h3 className="text-2xl font-display font-bold mb-2">Make Your Monthly Payment</h3>
                    <p className="text-primary-foreground/80 font-medium text-lg">Keep your savings growing - contribute today!</p>
                  </div>
                  <Button size="lg" variant="success" className="font-bold px-10 h-14 text-lg shadow-lg hover:scale-105 transition-transform">
                    <Wallet className="mr-2 h-6 w-6" />
                    Pay Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {guarantorRequests.length > 0 && (
              <Alert variant="warning" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Guarantor Requests</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>You have {guarantorRequests.length} pending guarantor request(s)</span>
                  <Link href="/guarantor">
                    <Button variant="outline" size="sm">
                      Review <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="text-2xl font-display font-bold text-foreground">My Loan Status</CardTitle>
                  <CardDescription className="text-muted-foreground font-medium">Track your loan applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentLoans.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-display font-bold text-xl mb-2">No Loans Yet</p>
                      <p className="text-muted-foreground mb-8 text-lg">Ready to borrow? Apply for your first loan today!</p>
                      <Link href="/loans/apply">
                        <Button size="lg" className="font-bold px-8 shadow-md">
                          <FileText className="mr-2 h-5 w-5" />
                          Apply for Loan
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentLoans.map((loan) => (
                        <div key={loan.id} className="p-5 border border-border rounded-xl bg-card hover:border-primary/20 transition-colors group">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-bold text-foreground text-xl group-hover:text-primary transition-colors">{loan.loan_number}</p>
                            <Badge variant={loan.status === 'DISBURSED' ? 'success' : 'warning'} className="px-3 py-1 text-xs uppercase tracking-wider font-bold">
                              {loan.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <p className="text-foreground font-bold text-2xl">{formatCurrency(loan.amount)}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight">Principal Amount</p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground font-medium flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-primary/60" />
                              {loan.status === 'DISBURSED' ? 'Active - Make payments on time' : 
                               loan.status === 'DRAFT' ? 'Draft - Complete your application' :
                               loan.status === 'AWAITING_GUARANTOR_APPROVAL' ? 'Waiting for guarantors' :
                               'Under review by credit committee'}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Link href="/loans" className="block mt-6">
                        <Button variant="outline" className="w-full font-bold h-12 border-2 text-primary border-primary hover:bg-primary hover:text-white transition-all">
                          View All My Loans
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-premium bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="text-2xl font-display font-bold text-foreground">What Would You Like To Do?</CardTitle>
                  <CardDescription className="text-muted-foreground font-medium">Quick access to common tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/loans/apply" className="block">
                    <Button className="w-full justify-between h-16 text-lg font-bold border-2 hover:translate-x-1 transition-transform" variant="outline">
                      <span className="flex items-center">
                        <div className="bg-primary/10 p-2 rounded-lg mr-4">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        Apply for a Loan
                      </span>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </Link>
                  <Button 
                    className="w-full justify-between h-16 text-lg font-bold border-2 bg-success hover:bg-success/90 text-success-foreground shadow-lg hover:translate-x-1 transition-transform" 
                    onClick={() => alert('Payment integration coming soon! Contact admin for manual payment.')}
                  >
                    <span className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-lg mr-4">
                        <Wallet className="h-6 w-6" />
                      </div>
                      Make Monthly Payment
                    </span>
                    <ArrowRight className="h-5 w-5 opacity-50" />
                  </Button>
                  <Link href="/guarantor" className="block">
                    <Button className="w-full justify-between h-16 text-lg font-bold border-2 hover:translate-x-1 transition-transform" variant="outline">
                      <span className="flex items-center">
                        <div className="bg-purple-100 p-2 rounded-lg mr-4">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        Guarantor Requests {guarantorRequests.length > 0 && (
                          <Badge className="ml-2 bg-error text-white border-none">{guarantorRequests.length}</Badge>
                        )}
                      </span>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </Link>
                  <Link href="/withdrawals" className="block">
                    <Button className="w-full justify-between h-16 text-lg font-bold border-2 hover:translate-x-1 transition-transform" variant="outline">
                      <span className="flex items-center">
                        <div className="bg-orange-100 p-2 rounded-lg mr-4">
                          <Wallet className="h-6 w-6 text-orange-600" />
                        </div>
                        Withdraw Funds
                      </span>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </Link>
                  <Link href="/referrals" className="block">
                    <Button className="w-full justify-between h-16 text-lg font-bold border-2 hover:translate-x-1 transition-transform" variant="outline">
                      <span className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-4">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        Refer a Friend & Earn
                      </span>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {['ADMIN', 'SUPER_ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER'].includes(user.role) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="card-premium border-t-4 border-t-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Members</CardTitle>
                  <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold text-foreground">
                    {stats?.pendingMembers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    Awaiting Verification
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium border-t-4 border-t-success">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Members</CardTitle>
                  <CheckCircle className="h-5 w-5 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold text-foreground">
                    {stats?.activeMembers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    Fully Registered
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium border-t-4 border-t-warning">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Loans</CardTitle>
                  <Clock className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold text-foreground">
                    {stats?.pendingLoans || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    In Review Pipeline
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium border-t-4 border-t-blue-600">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Deposits</CardTitle>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold text-foreground">
                    {formatCurrency(stats?.totalDeposits || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    Accumulated Assets
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-bold text-foreground">Quick Admin Actions</CardTitle>
                <CardDescription className="text-muted-foreground font-medium">Core system management modules</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/admin/members">
                  <Button className="w-full justify-between h-16 text-lg font-bold border-2 hover:translate-y-[-2px] transition-all" variant="outline">
                    <span className="flex items-center">
                      <Users className="mr-3 h-5 w-5 text-primary" />
                      Manage Members
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/loans">
                  <Button className="w-full justify-between h-16 text-lg font-bold border-2 hover:translate-y-[-2px] transition-all" variant="outline">
                    <span className="flex items-center">
                      <FileText className="mr-3 h-5 w-5 text-primary" />
                      Review Loans
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/deposits">
                  <Button className="w-full justify-between h-16 text-lg font-bold border-2 hover:translate-y-[-2px] transition-all" variant="outline">
                    <span className="flex items-center">
                      <Wallet className="mr-3 h-5 w-5 text-primary" />
                      Record Deposits
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
