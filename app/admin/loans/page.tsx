'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Eye, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { formatCurrency, getLoanStatusColor, formatLoanStatus } from '@/lib/utils';
import { useUser } from '@/lib/hooks/useUser';

export default function AdminLoansPage() {
  const { user, loading: userLoading } = useUser();
  const [loans, setLoans] = useState<any[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
    if (!user || userLoading) return;

    const fetchLoans = async () => {
      try {
        const { data } = await supabase
          .from('loans')
          .select(`
            *,
            members:member_id (
              member_number,
              profiles:user_id (full_name, email)
            )
          `)
          .order('created_at', { ascending: false });

        setLoans(data || []);
        setFilteredLoans(data || []);
      } catch (error) {
        console.error('Error fetching loans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [user, userLoading, supabase]);

  useEffect(() => {
    let filtered = loans;

    if (searchTerm) {
      filtered = filtered.filter(loan => 
        loan.loan_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.members?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.members?.member_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    setFilteredLoans(filtered);
  }, [searchTerm, statusFilter, loans]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-900 font-bold">Loading loans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !['SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-900 mb-4">Access Denied</h2>
              <p className="text-red-800 font-medium">
                You don't have permission to access this page.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const statusCounts = {
    total: loans.length,
    pending: loans.filter(l => ['SUBMITTED', 'AWAITING_GUARANTOR_APPROVAL', 'UNDER_CREDIT_REVIEW', 'COMMITTEE_REVIEW'].includes(l.status)).length,
    approved: loans.filter(l => l.status === 'APPROVED').length,
    disbursed: loans.filter(l => l.status === 'DISBURSED').length,
    rejected: loans.filter(l => l.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">All Loans</h1>
            <p className="text-slate-700 font-medium mt-1">Manage and review all loan applications</p>
          </div>
          <Link href="/admin/members">
            <Button variant="outline" className="font-bold border-2">
              View Members
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-2 border-slate-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">{statusCounts.total}</p>
              <p className="text-sm font-bold text-slate-700">Total Loans</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-900">{statusCounts.pending}</p>
              <p className="text-sm font-bold text-amber-700">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-900">{statusCounts.approved}</p>
              <p className="text-sm font-bold text-blue-700">Approved</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-900">{statusCounts.disbursed}</p>
              <p className="text-sm font-bold text-green-700">Disbursed</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-900">{statusCounts.rejected}</p>
              <p className="text-sm font-bold text-red-700">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-2 border-slate-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-bold text-slate-900">Search Loans</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-slate-600" />
                  <Input
                    id="search"
                    placeholder="Search by loan number, member name, or member number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-medium"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Label htmlFor="status" className="text-sm font-bold text-slate-900">Status Filter</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border-2 border-slate-300 rounded-md font-medium focus:border-slate-500"
                >
                  <option value="all">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="AWAITING_GUARANTOR_APPROVAL">Awaiting Guarantors</option>
                  <option value="UNDER_CREDIT_REVIEW">Credit Review</option>
                  <option value="COMMITTEE_REVIEW">Committee Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DISBURSED">Disbursed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loans List */}
        {filteredLoans.length === 0 ? (
          <Card className="border-2 border-slate-200">
            <CardContent className="p-12 text-center">
              <FileText className="h-20 w-20 text-slate-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Loans Found</h2>
              <p className="text-slate-700 font-medium">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No loans match your search criteria.' 
                  : 'No loan applications have been submitted yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLoans.map((loan) => (
              <Card key={loan.id} className="border-2 border-slate-200 hover:border-slate-400 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">{loan.loan_number}</h3>
                        <Badge className={getLoanStatusColor(loan.status) + " font-bold"}>
                          {formatLoanStatus(loan.status)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-bold text-slate-700">Member</p>
                          <p className="font-bold text-slate-900">{loan.members?.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-slate-600">{loan.members?.member_number}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">Amount</p>
                          <p className="text-xl font-bold text-slate-900">{formatCurrency(loan.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">Duration</p>
                          <p className="font-bold text-slate-900">{loan.duration_months} months</p>
                          <p className="text-sm text-slate-600">@ {loan.interest_rate}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">Monthly</p>
                          <p className="font-bold text-slate-900">{formatCurrency(loan.monthly_repayment)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        Applied: {new Date(loan.created_at).toLocaleDateString('en-KE')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" className="font-bold border-2">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      {loan.status === 'SUBMITTED' && (
                        <Button className="bg-blue-600 hover:bg-blue-700 font-bold">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Review
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
