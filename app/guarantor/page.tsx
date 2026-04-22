'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Clock, User } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function GuarantorPage() {
  const { user, member } = useUser();
  const [requests, setRequests] = useState<any[]>([]);
  const [myGuarantees, setMyGuarantees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
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
    if (!member) return;
    fetchGuarantorData();
  }, [member]);

  const fetchGuarantorData = async () => {
    if (!member) return;

    try {
      const { data: pendingRequests, error: requestsError } = await supabase
        .from('loan_guarantors')
        .select(`
          *,
          loans:loan_id (
            loan_number,
            amount,
            duration_months,
            purpose,
            members:member_id (
              member_number,
              profiles:user_id (
                full_name,
                email,
                phone_number
              )
            )
          )
        `)
        .eq('guarantor_member_id', member.id)
        .eq('status', 'PENDING')
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(pendingRequests || []);

      const { data: myGuaranteesData, error: guaranteesError } = await supabase
        .from('loan_guarantors')
        .select(`
          *,
          loans:loan_id (
            loan_number,
            amount,
            status,
            members:member_id (
              member_number,
              profiles:user_id (
                full_name
              )
            )
          )
        `)
        .eq('guarantor_member_id', member.id)
        .in('status', ['ACCEPTED'])
        .order('responded_at', { ascending: false });

      if (guaranteesError) throw guaranteesError;
      setMyGuarantees(myGuaranteesData || []);

    } catch (error) {
      console.error('Error fetching guarantor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string, loanId: string, guaranteedAmount: number) => {
    setProcessingId(requestId);
    try {
      if (!member) throw new Error('Member not found');

      if (guaranteedAmount > member.available_balance) {
        throw new Error('Insufficient available balance to guarantee this amount');
      }

      const { error: updateError } = await supabase
        .from('loan_guarantors')
        .update({
          status: 'ACCEPTED',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;
      fetchGuarantorData();
    } catch (error: any) {
      alert(error.message || 'Failed to accept guarantor request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string, loanId: string) => {
    setProcessingId(requestId);
    try {
      const { error: updateError } = await supabase
        .from('loan_guarantors')
        .update({
          status: 'REJECTED',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;
      fetchGuarantorData();
    } catch (error: any) {
      alert(error.message || 'Failed to reject guarantor request');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !member) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Guarantor Requests</h1>
          <p className="text-slate-600 mt-1">Review and respond to loan guarantor requests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">{requests.length}</div>
              <p className="text-sm text-slate-600">Pending Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">{myGuarantees.length}</div>
              <p className="text-sm text-slate-600">Active Guarantees</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(member.available_balance)}
              </div>
              <p className="text-sm text-slate-600">Available to Guarantee</p>
            </CardContent>
          </Card>
        </div>

        {requests.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Loan guarantor requests awaiting your response</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border border-slate-200 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-slate-600" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {request.loans?.members?.profiles?.full_name}
                          </p>
                          <p className="text-sm text-slate-600">
                            Member: {request.loans?.members?.member_number}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-slate-600">Loan Number</p>
                          <p className="font-medium text-slate-900">{request.loans?.loan_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Loan Amount</p>
                          <p className="font-medium text-slate-900">
                            {formatCurrency(request.loans?.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Amount to Guarantee</p>
                          <p className="font-medium text-slate-900">
                            {formatCurrency(request.guaranteed_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Duration</p>
                          <p className="font-medium text-slate-900">
                            {request.loans?.duration_months} months
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-slate-600 mb-1">Purpose</p>
                        <p className="text-sm text-slate-900">{request.loans?.purpose}</p>
                      </div>

                      <p className="text-xs text-slate-500">
                        Requested on {formatDate(request.requested_at)}
                      </p>

                      {request.guaranteed_amount > member.available_balance && (
                        <Alert variant="warning" className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            This amount exceeds your available balance. You cannot accept this request.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <Button
                        onClick={() => handleAccept(request.id, request.loan_id, request.guaranteed_amount)}
                        disabled={processingId === request.id || request.guaranteed_amount > member.available_balance}
                        className="w-full"
                        variant="success"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleReject(request.id, request.loan_id)}
                        disabled={processingId === request.id}
                        className="w-full"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {requests.length === 0 && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertTitle>No Pending Requests</AlertTitle>
            <AlertDescription>
              You don't have any pending guarantor requests at the moment.
            </AlertDescription>
          </Alert>
        )}

        {myGuarantees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>My Active Guarantees</CardTitle>
              <CardDescription>Loans you are currently guaranteeing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Loan #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Borrower</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Guaranteed</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myGuarantees.map((guarantee) => (
                      <tr key={guarantee.id} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                          {guarantee.loans?.loan_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {guarantee.loans?.members?.profiles?.full_name}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {formatCurrency(guarantee.loans?.amount)}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                          {formatCurrency(guarantee.guaranteed_amount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge>{guarantee.loans?.status.replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {formatDate(guarantee.responded_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
