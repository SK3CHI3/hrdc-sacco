'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Wallet, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { formatCurrency } from '@/lib/utils';

export default function WithdrawalPage() {
  const { user, member } = useUser();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!member) throw new Error('Member profile not found');
      
      const withdrawalAmount = parseFloat(amount);
      
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (withdrawalAmount > member.available_balance) {
        throw new Error(`Insufficient funds. Your available balance is ${formatCurrency(member.available_balance)}`);
      }

      // In a real system, this would create a withdrawal request for admin approval
      // For now, we'll create a record in 'deposits' with transaction_type = 'WITHDRAWAL'
      
      const { error: withdrawError } = await supabase
        .from('deposits')
        .insert({
          member_id: member.id,
          amount: withdrawalAmount,
          transaction_type: 'WITHDRAWAL',
          payment_method: 'BANK_TRANSFER', // Default
          payment_status: 'PENDING',
          description: 'Withdrawal request'
        });

      if (withdrawError) throw withdrawError;

      await supabase.from('notifications').insert({
        user_id: user!.id,
        title: 'Withdrawal Requested',
        message: `Your request to withdraw ${formatCurrency(withdrawalAmount)} has been received and is awaiting processing.`,
        type: 'FINANCE'
      });

      setSuccess('Withdrawal request submitted successfully!');
      setAmount('');
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !member) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Withdraw Funds</h1>
            <p className="text-slate-600 mt-1">Request to withdraw from your available balance</p>
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

        <div className="grid grid-cols-1 gap-8">
          <Card className="border-2 border-slate-200">
            <CardHeader>
              <CardTitle>Withdrawal Request</CardTitle>
              <CardDescription>Enter the amount you wish to withdraw</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-100 p-6 rounded-xl mb-8 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Available Balance</p>
                  <p className="text-3xl font-bold text-slate-900">{formatCurrency(member.available_balance)}</p>
                </div>
                <Wallet className="h-10 w-10 text-slate-400" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Withdrawal Amount (KES)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={loading}
                    className="text-lg h-12"
                  />
                  <p className="text-xs text-slate-500 italic">
                    * Note: Withdrawals take 1-3 business days to process.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Withdrawals are processed to your registered phone number via M-Pesa or to your bank account on file. 
                    Ensure your details are up to date before submitting.
                  </p>
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                  {loading ? 'Processing...' : 'Submit Withdrawal Request'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No recent withdrawal requests found.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
