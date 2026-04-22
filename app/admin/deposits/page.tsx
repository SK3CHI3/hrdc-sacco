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
import { Search, Plus, Wallet, TrendingUp, CheckCircle, Clock, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useUser } from '@/lib/hooks/useUser';

export default function AdminDepositsPage() {
  const { user, loading: userLoading } = useUser();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    deposit_type: 'MONTHLY_CONTRIBUTION',
    description: ''
  });
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
      
      if (!['SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER'].includes(user?.role || '')) {
        router.push('/dashboard');
        return;
      }
    };
    checkAuth();
  }, [router, supabase, user, userLoading]);

  useEffect(() => {
    if (!user || userLoading) return;

    const fetchDeposits = async () => {
      try {
        const { data } = await supabase
          .from('deposits')
          .select(`
            *,
            members:member_id (
              member_number,
              profiles:user_id (full_name, email)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        setDeposits(data || []);
        setFilteredDeposits(data || []);
      } catch (error) {
        console.error('Error fetching deposits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeposits();
  }, [user, userLoading, supabase]);

  useEffect(() => {
    let filtered = deposits;

    if (searchTerm) {
      filtered = filtered.filter(deposit => 
        deposit.members?.member_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.members?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(deposit => deposit.payment_status === statusFilter);
    }

    setFilteredDeposits(filtered);
  }, [searchTerm, statusFilter, deposits]);

  const handleAddDeposit = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('deposits')
        .insert({
          ...formData,
          amount: parseFloat(formData.amount),
          payment_status: 'COMPLETED',
          payment_method: 'CASH',
          transaction_reference: `ADMIN-${Date.now()}`,
          created_by: user.id,
        });

      if (error) throw error;

      // Update member's total deposits
      await supabase.rpc('update_member_deposits', { 
        member_id: formData.member_id,
        deposit_amount: parseFloat(formData.amount)
      });

      setShowAddForm(false);
      setFormData({ member_id: '', amount: '', deposit_type: 'MONTHLY_CONTRIBUTION', description: '' });
      
      // Refresh deposits
      const { data } = await supabase
        .from('deposits')
        .select(`
          *,
          members:member_id (
            member_number,
            profiles:user_id (full_name, email)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      setDeposits(data || []);
      setFilteredDeposits(data || []);
    } catch (error) {
      console.error('Error adding deposit:', error);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-900 font-bold">Loading deposits...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !['SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER'].includes(user.role)) {
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
    total: deposits.length,
    completed: deposits.filter(d => d.payment_status === 'COMPLETED').length,
    pending: deposits.filter(d => d.payment_status === 'PENDING').length,
    failed: deposits.filter(d => d.payment_status === 'FAILED').length,
  };

  const totalAmount = deposits
    .filter(d => d.payment_status === 'COMPLETED')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Deposits Management</h1>
            <p className="text-slate-700 font-medium mt-1">Record and track all member deposits</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-slate-900 hover:bg-slate-800 font-bold"
            >
              <Plus className="mr-2 h-5 w-5" />
              Record Deposit
            </Button>
            <Link href="/admin/members">
              <Button variant="outline" className="font-bold border-2">
                View Members
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-slate-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">{statusCounts.total}</p>
              <p className="text-sm font-bold text-slate-700">Total Deposits</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-900">{statusCounts.completed}</p>
              <p className="text-sm font-bold text-green-700">Completed</p>
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
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalAmount)}</p>
              <p className="text-sm font-bold text-blue-700">Total Value</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Deposit Form */}
        {showAddForm && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-900">Record New Deposit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-bold text-slate-900">Member Number</Label>
                  <Input
                    placeholder="Enter member number"
                    value={formData.member_id}
                    onChange={(e) => setFormData({...formData, member_id: e.target.value})}
                    className="font-medium"
                  />
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-900">Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="font-medium"
                  />
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-900">Deposit Type</Label>
                  <select
                    value={formData.deposit_type}
                    onChange={(e) => setFormData({...formData, deposit_type: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border-2 border-slate-300 rounded-md font-medium"
                  >
                    <option value="MONTHLY_CONTRIBUTION">Monthly Contribution</option>
                    <option value="SHARE_CAPITAL">Share Capital</option>
                    <option value="LOAN_REPAYMENT">Loan Repayment</option>
                    <option value="SAVINGS">Savings</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-900">Description</Label>
                  <Input
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleAddDeposit}
                  className="bg-green-600 hover:bg-green-700 font-bold"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Record Deposit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="font-bold border-2"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6 border-2 border-slate-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-bold text-slate-900">Search Deposits</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-slate-600" />
                  <Input
                    id="search"
                    placeholder="Search by member name, number, or reference..."
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
                  className="w-full mt-1 px-3 py-2 border-2 border-slate-300 rounded-md font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposits List */}
        {filteredDeposits.length === 0 ? (
          <Card className="border-2 border-slate-200">
            <CardContent className="p-12 text-center">
              <Wallet className="h-20 w-20 text-slate-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Deposits Found</h2>
              <p className="text-slate-700 font-medium">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No deposits match your search criteria.' 
                  : 'No deposits have been recorded yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDeposits.map((deposit) => (
              <Card key={deposit.id} className="border-2 border-slate-200 hover:border-slate-400 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">{deposit.transaction_reference}</h3>
                        <Badge className={
                          deposit.payment_status === 'COMPLETED' ? 'bg-green-100 text-green-800 font-bold' :
                          deposit.payment_status === 'PENDING' ? 'bg-amber-100 text-amber-800 font-bold' :
                          'bg-red-100 text-red-800 font-bold'
                        }>
                          {deposit.payment_status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-bold text-slate-700">Member</p>
                          <p className="font-bold text-slate-900">{deposit.members?.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-slate-600">{deposit.members?.member_number}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">Amount</p>
                          <p className="text-xl font-bold text-slate-900">{formatCurrency(deposit.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">Type</p>
                          <p className="font-bold text-slate-900">{deposit.deposit_type?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">Date</p>
                          <p className="font-bold text-slate-900">{formatDate(deposit.created_at)}</p>
                        </div>
                      </div>
                      {deposit.description && (
                        <p className="text-sm text-slate-600 mb-2">
                          <span className="font-semibold">Note:</span> {deposit.description}
                        </p>
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
