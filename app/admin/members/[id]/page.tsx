'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  User, ArrowLeft, Wallet, CreditCard, Shield, Activity, 
  Mail, Phone, Calendar, AlertCircle, Ban, CheckCircle
} from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { formatCurrency, formatDate, getMemberStatusColor, formatMemberStatus, getLoanStatusColor, formatLoanStatus } from '@/lib/utils';

export default function AdminMemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: userLoading } = useUser();
  const [member, setMember] = useState<any>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [guarantees, setGuarantees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      if (userLoading) return;
      if (!['SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER'].includes(user?.role || '')) {
        router.push('/dashboard');
        return;
      }
    };
    checkAuth();
  }, [router, supabase, user, userLoading]);

  useEffect(() => {
    if (id && user) {
      fetchMemberData();
    }
  }, [id, user, supabase]);

  const fetchMemberData = async () => {
    try {
      // 1. Fetch Member Details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('id', id)
        .single();

      if (memberError) throw memberError;
      setMember(memberData);

      // 2. Fetch Deposits
      const { data: depositsData } = await supabase
        .from('deposits')
        .select('*')
        .eq('member_id', id)
        .order('created_at', { ascending: false })
        .limit(5);
      setDeposits(depositsData || []);

      // 3. Fetch Loans
      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('member_id', id)
        .order('created_at', { ascending: false });
      setLoans(loansData || []);

      // 4. Fetch Guarantees
      const { data: guaranteeData } = await supabase
        .from('loan_guarantors')
        .select(`
          *,
          loans:loan_id (
            loan_number,
            amount,
            status,
            members:member_id (
              profiles:user_id (full_name)
            )
          )
        `)
        .eq('guarantor_member_id', id);
      setGuarantees(guaranteeData || []);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch member details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (newStatus: string) => {
    setActionLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('members')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateError) throw updateError;

      // Add audit log
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: `Member ${newStatus}`,
        entity_type: 'MEMBER',
        entity_id: id,
        details: { status: newStatus }
      });

      fetchMemberData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update member status');
    } finally {
      setActionLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Member Not Found</h2>
          <Button onClick={() => router.push('/admin/members')} className="mt-6 font-bold">
            Back to Members List
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/members')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{member.profiles.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 font-medium">{member.member_number}</span>
                <span>&bull;</span>
                <Badge className={getMemberStatusColor(member.status) + " font-bold"}>
                  {formatMemberStatus(member.status)}
                </Badge>
              </div>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              {member.status === 'ACTIVE' ? (
                <Button 
                  variant="outline" 
                  className="border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                  onClick={() => handleToggleStatus('SUSPENDED')}
                  disabled={actionLoading}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend Member
                </Button>
              ) : (
                <Button 
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
                  onClick={() => handleToggleStatus('ACTIVE')}
                  disabled={actionLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate Member
                </Button>
              )}
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: KYC & Stats */}
          <div className="space-y-8">
            <Card className="border-2 border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-slate-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-500">Email Address</p>
                    <p className="font-medium text-slate-900">{member.profiles.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-500">Phone Number</p>
                    <p className="font-medium text-slate-900">{member.profiles.phone_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-500">National ID</p>
                    <p className="font-medium text-slate-900">{member.national_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-500">Date Joined</p>
                    <p className="font-medium text-slate-900">{formatDate(member.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 shadow-sm bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-slate-300" />
                  Financial Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                  <span className="text-slate-400 font-medium">Total Savings</span>
                  <span className="text-xl font-bold">{formatCurrency(member.total_shares + member.total_deposits)}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                  <span className="text-slate-400 font-medium">Available Balance</span>
                  <span className="text-xl font-bold text-green-400">{formatCurrency(member.available_balance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Share Capital</span>
                  <span className="text-lg font-bold">{formatCurrency(member.total_shares)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Activity */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Loans */}
            <Card className="border-2 border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-slate-600" />
                  Loan History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loans.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">No loan history available.</p>
                ) : (
                  <div className="space-y-4">
                    {loans.map(loan => (
                      <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-900">{loan.loan_number}</p>
                          <p className="text-sm text-slate-600">{formatCurrency(loan.amount)} over {loan.duration_months} months</p>
                        </div>
                        <div className="mt-2 sm:mt-0 text-right">
                          <Badge className={getLoanStatusColor(loan.status) + " font-bold mb-1"}>
                            {formatLoanStatus(loan.status)}
                          </Badge>
                          <p className="text-xs font-bold text-slate-500">{formatDate(loan.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guarantor History */}
            <Card className="border-2 border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-slate-600" />
                  Guaranteed Loans
                </CardTitle>
                <CardDescription>Loans where this member acts as a guarantor</CardDescription>
              </CardHeader>
              <CardContent>
                {guarantees.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">Not guaranteeing any loans.</p>
                ) : (
                  <div className="space-y-4">
                    {guarantees.map(g => (
                      <div key={g.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-900">For: {g.loans?.members?.profiles?.full_name}</p>
                          <p className="text-xs font-medium text-slate-600">Loan #{g.loans?.loan_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500">Exposure</p>
                          <p className="text-sm font-bold text-red-600">{formatCurrency(g.guaranteed_amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Deposits */}
            <Card className="border-2 border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-slate-600" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deposits.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">No transaction history available.</p>
                ) : (
                  <div className="space-y-3">
                    {deposits.map(deposit => (
                      <div key={deposit.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-bold text-slate-900">{deposit.deposit_type.replace('_', ' ')}</p>
                          <p className="text-xs text-slate-500">{deposit.transaction_reference} &bull; {formatDate(deposit.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${deposit.transaction_type === 'WITHDRAWAL' ? 'text-slate-900' : 'text-green-600'}`}>
                            {deposit.transaction_type === 'WITHDRAWAL' ? '-' : '+'}{formatCurrency(deposit.amount)}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            deposit.payment_status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            deposit.payment_status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {deposit.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
