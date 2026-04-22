'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, ArrowRight } from 'lucide-react';
import { formatCurrency, getLoanStatusColor, formatLoanStatus } from '@/lib/utils';
import { useUser } from '@/lib/hooks/useUser';

export default function LoansPage() {
  const { user, member, loading: userLoading } = useUser();
  const [loans, setLoans] = useState<any[]>([]);
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
    if (!user || !member || userLoading) return;

    const fetchLoans = async () => {
      try {
        const { data } = await supabase
          .from('loans')
          .select('*')
          .eq('member_id', member.id)
          .order('created_at', { ascending: false });

        setLoans(data || []);
      } catch (error) {
        console.error('Error fetching loans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [user, member, userLoading, supabase]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-900 font-bold">Loading your loans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || member?.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-2 border-amber-300 bg-amber-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Account Not Active</h2>
              <p className="text-amber-800 font-medium">
                Your membership must be approved before you can access loans.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Loans</h1>
            <p className="text-slate-700 font-medium mt-1">View and manage your loan applications</p>
          </div>
          <Link href="/loans/apply">
            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 font-bold">
              <Plus className="mr-2 h-5 w-5" />
              Apply for New Loan
            </Button>
          </Link>
        </div>

        {loans.length === 0 ? (
          <Card className="border-2 border-slate-200">
            <CardContent className="p-12 text-center">
              <FileText className="h-20 w-20 text-slate-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Loans Yet</h2>
              <p className="text-slate-700 font-medium mb-8 max-w-md mx-auto">
                You haven't applied for any loans yet. Start your loan application today!
              </p>
              <Link href="/loans/apply">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 font-bold">
                  <Plus className="mr-2 h-5 w-5" />
                  Apply for Your First Loan
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <Card key={loan.id} className="border-2 border-slate-200 hover:border-slate-400 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">{loan.loan_number}</h3>
                        <Badge className={getLoanStatusColor(loan.status) + " font-bold"}>
                          {formatLoanStatus(loan.status)}
                        </Badge>
                      </div>
                      <p className="text-3xl font-bold text-slate-900 mb-2">
                        {formatCurrency(loan.amount)}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 font-medium">Interest Rate</p>
                          <p className="text-slate-900 font-bold">{loan.interest_rate}% per year</p>
                        </div>
                        <div>
                          <p className="text-slate-600 font-medium">Duration</p>
                          <p className="text-slate-900 font-bold">{loan.duration_months} months</p>
                        </div>
                        <div>
                          <p className="text-slate-600 font-medium">Monthly Payment</p>
                          <p className="text-slate-900 font-bold">{formatCurrency(loan.monthly_repayment)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 font-medium">Guarantors</p>
                          <p className="text-slate-900 font-bold">
                            {loan.guarantors_approved} of {loan.guarantors_required}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 font-medium mt-3">
                        {loan.status === 'DISBURSED' ? '✅ Active - Make payments on time' : 
                         loan.status === 'DRAFT' ? '📝 Draft - Complete your application' :
                         loan.status === 'AWAITING_GUARANTOR_APPROVAL' ? '⏳ Waiting for guarantors to accept' :
                         loan.status === 'UNDER_CREDIT_REVIEW' ? '🔍 Being reviewed by credit officer' :
                         loan.status === 'COMMITTEE_REVIEW' ? '👥 Under committee review' :
                         loan.status === 'APPROVED' ? '✅ Approved - Awaiting disbursement' :
                         loan.status === 'REJECTED' ? '❌ Application rejected' :
                         '📋 Under review'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="outline" className="font-bold border-2 w-full">
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      {loan.status === 'DISBURSED' && (
                        <Button className="bg-green-600 hover:bg-green-700 font-bold">
                          Make Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
