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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-900 font-bold">Loading dashboard...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user.full_name}
          </h1>
          <p className="text-slate-600 mt-1">
            {user.role === 'MEMBER' ? 'Manage your savings and loans' : 'System overview and management'}
          </p>
        </div>

        {user.role === 'MEMBER' && (member?.status === 'PENDING_APPROVAL' || !member) && (
          <>
            <Alert variant="warning" className="mb-6 border-amber-300 bg-amber-50">
              <Clock className="h-5 w-5 text-amber-700" />
              <AlertTitle className="text-lg font-bold text-amber-900">Membership Application Under Review</AlertTitle>
              <AlertDescription className="text-amber-800 mt-2">
                <p className="font-medium">Your application is being reviewed by our admin team.</p>
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
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-blue-900">My Shares</CardTitle>
                  <Wallet className="h-5 w-5 text-blue-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900">
                    {formatCurrency(member?.total_shares || 0)}
                  </div>
                  <p className="text-sm text-blue-800 font-medium mt-2">
                    Share Capital
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-green-900">Monthly Deposits</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900">
                    {formatCurrency(member?.total_deposits || 0)}
                  </div>
                  <p className="text-sm text-green-800 font-medium mt-2">
                    Total Contributions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-orange-900">My Loans</CardTitle>
                  <FileText className="h-5 w-5 text-orange-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-900">
                    {stats?.activeLoans || 0}
                  </div>
                  <p className="text-sm text-orange-800 font-medium mt-2">
                    Active Loan(s)
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-purple-900">Can Borrow</CardTitle>
                  <TrendingUp className="h-5 w-5 text-purple-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900">
                    {formatCurrency(member?.available_balance || 0)}
                  </div>
                  <p className="text-sm text-purple-800 font-medium mt-2">
                    Loan Limit
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6 border-2 border-slate-900 bg-slate-900">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-white">
                    <h3 className="text-xl font-bold mb-1">Make Your Monthly Payment</h3>
                    <p className="text-slate-300 font-medium">Keep your savings growing - contribute today!</p>
                  </div>
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold px-8">
                    <Wallet className="mr-2 h-5 w-5" />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">My Loan Status</CardTitle>
                  <CardDescription className="text-slate-700 font-medium">Track your loan applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentLoans.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-900 font-bold text-lg mb-2">No Loans Yet</p>
                      <p className="text-slate-700 mb-6">Ready to borrow? Apply for your first loan today!</p>
                      <Link href="/loans/apply">
                        <Button size="lg" className="bg-slate-900 hover:bg-slate-800 font-bold">
                          <FileText className="mr-2 h-5 w-5" />
                          Apply for Loan
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentLoans.map((loan) => (
                        <div key={loan.id} className="p-4 border-2 border-slate-200 rounded-lg bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-slate-900 text-lg">{loan.loan_number}</p>
                            <Badge className={getMemberStatusColor(loan.status) + " font-bold"}>
                              {loan.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-slate-900 font-bold text-xl">{formatCurrency(loan.amount)}</p>
                          <p className="text-sm text-slate-700 font-medium mt-1">
                            {loan.status === 'DISBURSED' ? 'Active - Make payments on time' : 
                             loan.status === 'DRAFT' ? 'Draft - Complete your application' :
                             loan.status === 'AWAITING_GUARANTOR_APPROVAL' ? 'Waiting for guarantors' :
                             'Under review by admin'}
                          </p>
                        </div>
                      ))}
                      <Link href="/loans">
                        <Button variant="outline" className="w-full font-bold border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white">
                          View All My Loans
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">What Would You Like To Do?</CardTitle>
                  <CardDescription className="text-slate-700 font-medium">Quick access to common tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/loans/apply">
                    <Button className="w-full justify-start h-14 text-base font-bold border-2" variant="outline">
                      <FileText className="mr-3 h-5 w-5" />
                      Apply for a Loan
                    </Button>
                  </Link>
                  <Button className="w-full justify-start h-14 text-base font-bold border-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => alert('Payment integration coming soon! Contact admin for manual payment.')}>
                    <Wallet className="mr-3 h-5 w-5" />
                    Make Monthly Payment
                  </Button>
                  <Link href="/guarantor">
                    <Button className="w-full justify-start h-14 text-base font-bold border-2" variant="outline">
                      <Users className="mr-3 h-5 w-5" />
                      Guarantor Requests {guarantorRequests.length > 0 && `(${guarantorRequests.length})`}
                    </Button>
                  </Link>
                  <Link href="/withdrawals">
                    <Button className="w-full justify-start h-14 text-base font-bold border-2" variant="outline">
                      <Wallet className="mr-3 h-5 w-5" />
                      Withdraw Funds
                    </Button>
                  </Link>
                  <Link href="/referrals">
                    <Button className="w-full justify-start h-14 text-base font-bold border-2" variant="outline">
                      <Users className="mr-3 h-5 w-5" />
                      Refer a Friend
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Pending Members</CardTitle>
                  <Users className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats?.pendingMembers || 0}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Awaiting approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Active Members</CardTitle>
                  <CheckCircle className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats?.activeMembers || 0}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Approved members
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Pending Loans</CardTitle>
                  <Clock className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats?.pendingLoans || 0}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Require review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Deposits</CardTitle>
                  <TrendingUp className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(stats?.totalDeposits || 0)}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    All time
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/members">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Members
                  </Button>
                </Link>
                <Link href="/admin/loans">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Review Loans
                  </Button>
                </Link>
                <Link href="/admin/deposits">
                  <Button className="w-full justify-start" variant="outline">
                    <Wallet className="mr-2 h-4 w-4" />
                    Record Deposits
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
