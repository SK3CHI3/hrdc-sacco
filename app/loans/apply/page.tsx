'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { formatCurrency, calculateLoanRepayment } from '@/lib/utils';

export default function ApplyLoanPage() {
  const { user, member } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [calculation, setCalculation] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    duration: '',
    purpose: '',
  });

  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('sacco_settings')
        .select('*');

      if (data) {
        const settingsObj: any = {};
        data.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        setSettings(settingsObj);
      }
    };
    fetchSettings();
  }, [supabase]);

  useEffect(() => {
    if (formData.amount && formData.duration && settings) {
      const amount = parseFloat(formData.amount);
      const months = parseInt(formData.duration);
      const rate = parseFloat(settings.default_interest_rate || '12');

      if (amount > 0 && months > 0) {
        const calc = calculateLoanRepayment(amount, rate, months);
        setCalculation(calc);
      }
    }
  }, [formData.amount, formData.duration, settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!member) {
        throw new Error('Member profile not found');
      }

      const amount = parseFloat(formData.amount);
      const months = parseInt(formData.duration);

      if (!settings) {
        throw new Error('SACCO settings not loaded');
      }

      const minAmount = parseFloat(settings.min_loan_amount || '10000');
      const maxAmount = parseFloat(settings.max_loan_amount || '5000000');
      const minDuration = parseInt(settings.min_loan_duration_months || '3');
      const maxDuration = parseInt(settings.max_loan_duration_months || '60');

      if (amount < minAmount || amount > maxAmount) {
        throw new Error(`Loan amount must be between ${formatCurrency(minAmount)} and ${formatCurrency(maxAmount)}`);
      }

      if (months < minDuration || months > maxDuration) {
        throw new Error(`Loan duration must be between ${minDuration} and ${maxDuration} months`);
      }

      const rate = parseFloat(settings.default_interest_rate || '12');
      const calc = calculateLoanRepayment(amount, rate, months);

      const requiresGuarantors = amount > member.available_balance;
      let guarantorsRequired = 0;

      if (requiresGuarantors) {
        const excessAmount = amount - member.available_balance;
        guarantorsRequired = Math.ceil(excessAmount / 100000);
      }

      const { data: loanNumberData } = await supabase.rpc('generate_loan_number');

      const { data: newLoan, error: loanError } = await supabase
        .from('loans')
        .insert({
          member_id: member.id,
          loan_number: loanNumberData,
          amount: amount,
          interest_rate: rate,
          duration_months: months,
          monthly_repayment: calc.monthlyPayment,
          total_repayment: calc.totalRepayment,
          purpose: formData.purpose,
          status: 'DRAFT',
          requires_guarantors: requiresGuarantors,
          guarantors_required: guarantorsRequired,
        })
        .select()
        .single();

      if (loanError) throw loanError;

      await supabase.from('notifications').insert({
        user_id: user!.id,
        title: 'Loan Application Created',
        message: `Your loan application ${loanNumberData} has been created. ${requiresGuarantors ? 'Please add guarantors to proceed.' : 'You can now submit it for review.'}`,
        type: 'LOAN',
        reference_id: newLoan.id,
      });

      setSuccess('Loan application created successfully!');
      setTimeout(() => {
        router.push(`/loans/${newLoan.id}`);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to create loan application');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !member) {
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

  if (member.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Not Active</AlertTitle>
            <AlertDescription>
              Your account must be approved before you can apply for loans.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Apply for Loan</h1>
          <p className="text-slate-600 mt-1">Complete the form below to apply for a loan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Loan Application</CardTitle>
                <CardDescription>Provide details about the loan you need</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert variant="success">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="amount">Loan Amount (KES) *</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="100000"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      min="10000"
                      step="1000"
                    />
                    <p className="text-xs text-slate-600">
                      Your available balance: {formatCurrency(member.available_balance)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Loan Duration (Months) *</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      placeholder="12"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      min="3"
                      max="60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Loan *</Label>
                    <textarea
                      id="purpose"
                      name="purpose"
                      className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Describe the purpose of this loan..."
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Application...' : 'Create Loan Application'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Loan Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {calculation ? (
                  <>
                    <div>
                      <p className="text-sm text-slate-600">Monthly Payment</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(calculation.monthlyPayment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Total Repayment</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatCurrency(calculation.totalRepayment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Total Interest</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatCurrency(calculation.totalInterest)}
                      </p>
                    </div>
                    {formData.amount && parseFloat(formData.amount) > member.available_balance && (
                      <Alert variant="warning">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          This loan requires guarantors since it exceeds your available balance.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-600">
                    Enter loan amount and duration to see calculations
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Member Status</span>
                  <Badge variant="success">{member.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Savings</span>
                  <span className="font-semibold">
                    {formatCurrency(member.total_shares + member.total_deposits)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Available Balance</span>
                  <span className="font-semibold">
                    {formatCurrency(member.available_balance)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
