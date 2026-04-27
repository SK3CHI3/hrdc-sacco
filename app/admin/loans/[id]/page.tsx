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
  FileText, Users, CheckCircle, XCircle, AlertCircle, Clock,
  ArrowLeft, Banknote, Shield, Gavel
} from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { formatCurrency, formatDate, getLoanStatusColor, formatLoanStatus } from '@/lib/utils';
import Link from 'next/link';

export default function AdminLoanReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: userLoading } = useUser();
  const [loan, setLoan] = useState<any>(null);
  const [guarantors, setGuarantors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      fetchLoanDetails();
    }
  }, [id, user, supabase]);

  const fetchLoanDetails = async () => {
    try {
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select(`
          *,
          members:member_id (
            *,
            profiles:user_id (*)
          )
        `)
        .eq('id', id)
        .single();

      if (loanError) throw loanError;
      setLoan(loanData);

      const { data: guarantorsData, error: guarantorsError } = await supabase
        .from('loan_guarantors')
        .select(`
          *,
          guarantor:guarantor_member_id (
            member_number,
            profiles:user_id (full_name)
          )
        `)
        .eq('loan_id', id);

      if (guarantorsError) throw guarantorsError;
      setGuarantors(guarantorsData || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loan details');
    } finally {
      setLoading(false);
    }
  };

  const updateLoanStatus = async (newStatus: string, actionMessage: string) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('loans')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateError) throw updateError;

      // Add audit log
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: `Loan ${newStatus}`,
        entity_type: 'LOAN',
        entity_id: id,
        details: { message: actionMessage }
      });

      setSuccess(`Loan successfully moved to ${formatLoanStatus(newStatus)}`);
      fetchLoanDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update loan status');
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

  if (!loan) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Loan Not Found</h2>
          <Button onClick={() => router.push('/admin/loans')} className="mt-6 font-bold">
            Back to Loans
          </Button>
        </div>
      </div>
    );
  }

  const applicant = loan.members;
  const isCreditOfficer = user?.role === 'CREDIT_OFFICER' || user?.role === 'SUPER_ADMIN';
  const isCommittee = user?.role === 'COMMITTEE_MEMBER' || user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/loans')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Loan Review: {loan.loan_number}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getLoanStatusColor(loan.status) + " font-bold"}>
                  {formatLoanStatus(loan.status)}
                </Badge>
                <span className="text-slate-500 text-sm">Applied on {formatDate(loan.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6 border-success bg-success/10 text-success">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Applicant Profile */}
            <Card className="border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-600" />
                  Applicant Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Name</p>
                    <p className="font-bold text-slate-900">{applicant.profiles.full_name}</p>
                    <p className="text-sm text-slate-600">{applicant.member_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Total Savings</p>
                    <p className="font-bold text-slate-900">{formatCurrency(applicant.total_shares + applicant.total_deposits)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Available Limit</p>
                    <p className="font-bold text-slate-900">{formatCurrency(applicant.available_balance)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Status</p>
                    <Badge variant="outline" className="font-bold mt-1">{applicant.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan Details */}
            <Card className="border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Loan Application Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-slate-500">Requested Amount</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Duration</p>
                    <p className="text-lg font-semibold text-slate-900">{loan.duration_months} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Interest Rate</p>
                    <p className="text-lg font-semibold text-slate-900">{loan.interest_rate}% p.a.</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Monthly Repayment</p>
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(loan.monthly_repayment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Repayment</p>
                    <p className="text-lg font-semibold text-slate-900">{formatCurrency(loan.total_repayment)}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-bold text-slate-700 mb-1">Purpose of Loan</p>
                  <p className="text-slate-900 font-medium">{loan.purpose}</p>
                </div>
              </CardContent>
            </Card>

            {/* Guarantors */}
            {loan.requires_guarantors && (
              <Card className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-slate-600" />
                    Guarantors
                  </CardTitle>
                  <CardDescription>
                    Requires {loan.guarantors_required} guarantors. {guarantors.filter(g => g.status === 'ACCEPTED').length} accepted.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {guarantors.map((g) => (
                      <div key={g.id} className="flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-900">{g.guarantor.profiles.full_name}</p>
                          <p className="text-xs font-medium text-slate-600">{g.guarantor.member_number}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-500">Guarantee</p>
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(g.guaranteed_amount)}</p>
                          </div>
                          <Badge className={
                            g.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                            g.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }>
                            {g.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Panel */}
          <div className="space-y-8">
            <Card className="border-2 border-slate-200 shadow-xl">
              <CardHeader className="bg-slate-900 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Review Actions
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Update the status of this application
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                
                {loan.status === 'SUBMITTED' && isCreditOfficer ? (
                  <>
                    <p className="text-sm font-medium text-slate-700">The applicant has submitted this loan for review.</p>
                    <Button 
                      className="w-full h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white" 
                      onClick={() => updateLoanStatus('UNDER_CREDIT_REVIEW', 'Credit Officer initiated review')}
                      disabled={actionLoading}
                    >
                      Start Credit Review
                    </Button>
                  </>
                ) : loan.status === 'UNDER_CREDIT_REVIEW' && isCreditOfficer ? (
                  <>
                    <p className="text-sm font-medium text-slate-700">Evaluate risk and decide on the next step.</p>
                    <Button 
                      className="w-full h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white" 
                      onClick={() => updateLoanStatus('APPROVED', 'Credit Officer approved')}
                      disabled={actionLoading}
                    >
                      Approve Loan
                    </Button>
                    <Button 
                      className="w-full h-12 font-bold border border-slate-300 text-slate-700 hover:bg-slate-50" 
                      onClick={() => updateLoanStatus('COMMITTEE_REVIEW', 'Sent to committee for secondary review')}
                      disabled={actionLoading}
                    >
                      Send to Committee
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full h-12 font-bold border border-slate-200 text-slate-700 hover:bg-slate-50" 
                      onClick={() => updateLoanStatus('REJECTED', 'Credit Officer rejected')}
                      disabled={actionLoading}
                    >
                      Reject Application
                    </Button>
                  </>
                ) : loan.status === 'COMMITTEE_REVIEW' && isCommittee ? (
                  <>
                    <p className="text-sm font-medium text-slate-700">High-value loan requiring committee approval.</p>
                    <Button 
                      className="w-full h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white" 
                      onClick={() => updateLoanStatus('APPROVED', 'Committee approved')}
                      disabled={actionLoading}
                    >
                      Committee Approve
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full h-12 font-bold border border-slate-200 text-slate-700 hover:bg-slate-50" 
                      onClick={() => updateLoanStatus('REJECTED', 'Committee rejected')}
                      disabled={actionLoading}
                    >
                      Committee Reject
                    </Button>
                  </>
                ) : loan.status === 'APPROVED' && isAdmin ? (
                  <>
                    <p className="text-sm font-medium text-slate-700">Loan is approved and ready for disbursement.</p>
                    <Button 
                      className="w-full h-12 font-bold bg-slate-900 hover:bg-slate-800" 
                      onClick={() => updateLoanStatus('DISBURSED', 'Funds disbursed by Admin')}
                      disabled={actionLoading}
                    >
                      <Banknote className="mr-2 h-5 w-5" />
                      Mark as Disbursed
                    </Button>
                  </>
                ) : loan.status === 'DISBURSED' ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-900">Loan Disbursed</p>
                    <p className="text-sm text-slate-600">This loan is active and in repayment.</p>
                  </div>
                ) : loan.status === 'REJECTED' ? (
                  <div className="text-center py-4">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-900">Loan Rejected</p>
                    <p className="text-sm text-slate-600">This application was declined.</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="font-bold text-slate-900">No Actions Available</p>
                    <p className="text-sm text-slate-600">
                      You do not have the required permissions to advance this loan from its current state, or it is awaiting member action.
                    </p>
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
