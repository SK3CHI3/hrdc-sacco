'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Plus,
  ArrowLeft,
  Search
} from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function LoanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, member } = useUser();
  const [loan, setLoan] = useState<any>(null);
  const [guarantors, setGuarantors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    if (id) {
      fetchLoanDetails();
    }
  }, [id, supabase]);

  const fetchLoanDetails = async () => {
    try {
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select(`
          *,
          members:member_id (*)
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
            profiles:user_id (
              full_name
            )
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

  const handleSearchMember = async () => {
    if (!searchQuery) return;
    setSearching(true);
    setError('');

    try {
      // Search by member number or national id
      const { data, error: searchError } = await supabase
        .from('members')
        .select(`
          id,
          member_number,
          national_id,
          available_balance,
          profiles:user_id (
            full_name
          )
        `)
        .or(`member_number.ilike.%${searchQuery}%,national_id.ilike.%${searchQuery}%`)
        .neq('id', member?.id) // Cannot guarantee own loan
        .limit(5);

      if (searchError) throw searchError;
      setSearchResults(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleAddGuarantor = async (guarantorMemberId: string) => {
    if (!loan) return;
    setSubmitting(true);
    setError('');

    try {
      // Calculate amount to guarantee (for now split equally among required guarantors)
      const amountToGuarantee = loan.amount / loan.guarantors_required;

      const { error: insertError } = await supabase
        .from('loan_guarantors')
        .insert({
          loan_id: id,
          guarantor_member_id: guarantorMemberId,
          guaranteed_amount: amountToGuarantee,
          status: 'PENDING'
        });

      if (insertError) throw insertError;

      setSuccess('Guarantor request sent!');
      setSearchQuery('');
      setSearchResults([]);
      fetchLoanDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add guarantor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLoan = async () => {
    if (!loan) return;
    setSubmitting(true);
    setError('');

    try {
      const acceptedCount = guarantors.filter(g => g.status === 'ACCEPTED').length;
      
      if (loan.requires_guarantors && acceptedCount < loan.guarantors_required) {
        throw new Error(`At least ${loan.guarantors_required} guarantors must accept before submission.`);
      }

      const { error: updateError } = await supabase
        .from('loans')
        .update({ status: 'SUBMITTED' })
        .eq('id', id);

      if (updateError) throw updateError;

      setSuccess('Loan submitted for review!');
      fetchLoanDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit loan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-slate-600">Loan not found.</p>
          <Button onClick={() => router.push('/loans')} className="mt-4">
            Back to Loans
          </Button>
        </div>
      </div>
    );
  }

  const acceptedGuarantors = guarantors.filter(g => g.status === 'ACCEPTED').length;
  const isReadyToSubmit = !loan.requires_guarantors || acceptedGuarantors >= loan.guarantors_required;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push('/loans')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Loan {loan.loan_number}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={
                loan.status === 'APPROVED' ? 'bg-green-600' : 
                loan.status === 'REJECTED' ? 'bg-red-600' : 
                'bg-blue-600'
              }>
                {loan.status.replace(/_/g, ' ')}
              </Badge>
              <span className="text-slate-500 text-sm">Applied on {formatDate(loan.created_at)}</span>
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
          <Alert variant="success" className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-slate-500">Amount</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(loan.amount)}</p>
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
                    <p className="text-lg font-semibold text-slate-900">{formatCurrency(loan.monthly_repayment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Repayment</p>
                    <p className="text-lg font-semibold text-slate-900">{formatCurrency(loan.total_repayment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Purpose</p>
                    <p className="text-sm text-slate-900 font-medium">{loan.purpose}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loan.requires_guarantors && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-slate-600" />
                    Guarantors ({acceptedGuarantors}/{loan.guarantors_required})
                  </CardTitle>
                  <CardDescription>
                    This loan requires {loan.guarantors_required} guarantors.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {guarantors.length > 0 ? (
                    <div className="space-y-4">
                      {guarantors.map((g) => (
                        <div key={g.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-full">
                              <Users className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{g.guarantor.profiles.full_name}</p>
                              <p className="text-xs text-slate-500">{g.guarantor.member_number}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Guarantee</p>
                              <p className="text-sm font-bold">{formatCurrency(g.guaranteed_amount)}</p>
                            </div>
                            <Badge className={
                              g.status === 'ACCEPTED' ? 'bg-green-600' :
                              g.status === 'REJECTED' ? 'bg-red-600' :
                              'bg-amber-600'
                            }>
                              {g.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No guarantors added yet.</p>
                  )}

                  {loan.status === 'DRAFT' && guarantors.length < loan.guarantors_required && (
                    <div className="pt-6 border-t">
                      <Label htmlFor="search">Add New Guarantor</Label>
                      <div className="flex gap-2 mt-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="search"
                            placeholder="Search by member number or ID..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchMember()}
                          />
                        </div>
                        <Button onClick={handleSearchMember} disabled={searching}>
                          {searching ? '...' : 'Search'}
                        </Button>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="mt-4 border rounded-lg divide-y bg-white shadow-sm">
                          {searchResults.map((res) => (
                            <div key={res.id} className="p-3 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-900">{res.profiles.full_name}</p>
                                <p className="text-xs text-slate-500">{res.member_number}</p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleAddGuarantor(res.id)}
                                disabled={submitting}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Loan Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  {loan.status === 'DRAFT' && (
                    <>
                      <Clock className="h-10 w-10 text-amber-500 mb-4" />
                      <p className="font-bold text-slate-900">Application Draft</p>
                      <p className="text-sm text-slate-600 mt-2">
                        {loan.requires_guarantors 
                          ? 'Finish adding guarantors to submit for review.' 
                          : 'Review your details and submit for review.'}
                      </p>
                    </>
                  )}
                  {loan.status === 'SUBMITTED' && (
                    <>
                      <Clock className="h-10 w-10 text-blue-500 mb-4" />
                      <p className="font-bold text-slate-900">Awaiting Review</p>
                      <p className="text-sm text-slate-600 mt-2">
                        Your application is being processed by the credit team.
                      </p>
                    </>
                  )}
                </div>

                {loan.status === 'DRAFT' && (
                  <Button 
                    className="w-full h-12 text-lg font-bold shadow-lg shadow-slate-200" 
                    onClick={handleSubmitLoan}
                    disabled={!isReadyToSubmit || submitting}
                  >
                    Submit for Review
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-bold text-slate-900">Application Created</p>
                      <p className="text-xs text-slate-500">{formatDate(loan.created_at)}</p>
                    </div>
                  </div>
                  {guarantors.map((g, index) => (
                    <div key={g.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${g.status === 'ACCEPTED' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                        {index < guarantors.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-1"></div>}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-bold text-slate-900">
                          Guarantor {g.status === 'ACCEPTED' ? 'Accepted' : 'Requested'}
                        </p>
                        <p className="text-xs text-slate-500">{g.guarantor.profiles.full_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
