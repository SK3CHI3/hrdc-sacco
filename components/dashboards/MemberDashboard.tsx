'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Wallet, TrendingUp, Users, FileText, AlertCircle, CheckCircle,
  Clock, ArrowRight, PiggyBank, Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MemberDashboardProps {
  user: any;
  member: any;
  stats: any;
  recentLoans: any[];
  guarantorRequests: any[];
  recentTransactions: any[];
}

export function MemberPendingView({ user }: { user: any }) {
  return (
    <>
      <Alert variant="warning" className="mb-6 border-warning bg-warning/10">
        <Clock className="h-5 w-5 text-warning" />
        <AlertTitle className="text-lg font-display font-bold text-warning-foreground">Membership Application Under Review</AlertTitle>
        <AlertDescription className="text-warning-foreground/80 mt-2">
          <p className="font-medium text-base">Your application is being reviewed by our admin team.</p>
          <p className="mt-2">You will receive a notification once your membership is approved. This usually takes 1-2 business days.</p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-xl font-bold">What Happens Next?</CardTitle>
            <CardDescription>Your membership approval process</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {[
                { icon: CheckCircle, title: 'Application Submitted', desc: 'Your documents are under review', done: true },
                { icon: Clock, title: 'Admin Review', desc: 'Verification of documents and details', done: false },
                { icon: AlertCircle, title: 'Approval & Activation', desc: "You'll get access to all features", done: false },
              ].map((step) => (
                <li key={step.title} className="flex items-start">
                  <step.icon className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${step.done ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <div>
                    <span className="font-semibold text-foreground">{step.title}</span>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Once Approved, You Can:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                { icon: Wallet, title: 'Make Deposits', desc: 'Build your savings and shares' },
                { icon: FileText, title: 'Apply for Loans', desc: 'Access affordable credit facilities' },
                { icon: Users, title: 'Refer Members', desc: 'Earn loyalty points for referrals' },
                { icon: TrendingUp, title: 'Track Your Growth', desc: 'View statements and reports' },
              ].map((item) => (
                <li key={item.title} className="flex items-start">
                  <item.icon className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">{item.title}</span>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function MemberDashboard({ user, member, stats, recentLoans, guarantorRequests }: MemberDashboardProps) {
  return (
    <>
      {/* Stat Cards — uniform subtle styling */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'My Shares', value: formatCurrency(member?.total_shares || 0), sub: 'Share Capital', icon: PiggyBank },
          { label: 'My Deposits', value: formatCurrency(member?.total_deposits || 0), sub: 'Total Savings', icon: Wallet },
          { label: 'Active Loans', value: stats?.activeLoans || 0, sub: `${stats?.pendingLoans || 0} pending`, icon: FileText },
          { label: 'Can Borrow', value: formatCurrency(member?.available_balance || 0), sub: 'Available Limit', icon: TrendingUp },
        ].map((stat) => (
          <Card key={stat.label} className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground font-medium mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment CTA */}
      <Card className="mb-6 border-none bg-primary shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="h-32 w-32" /></div>
        <CardContent className="p-6 sm:p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-primary-foreground text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-display font-bold mb-1">Make Your Monthly Contribution</h3>
              <p className="text-primary-foreground/80 font-medium">Keep your savings growing — contribute today!</p>
            </div>
            <Button size="lg" variant="success" className="font-bold px-8 h-12 text-lg shadow-lg hover:scale-105 transition-transform" onClick={() => alert('M-PESA STK Push initiated! Please check your phone to complete the payment.')}>
              <Wallet className="mr-2 h-5 w-5" /> Pay Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guarantor Requests Alert */}
      {guarantorRequests.length > 0 && (
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Guarantor Requests</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You have {guarantorRequests.length} pending guarantor request(s)</span>
            <Link href="/guarantor"><Button variant="outline" size="sm">Review <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Advisor Promotion */}
      <Card className="mb-8 card-premium border-2 border-indigo-100 bg-white overflow-hidden relative group cursor-pointer hover:border-indigo-300 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Sparkles className="h-32 w-32 text-indigo-600" /></div>
        <CardContent className="p-6 sm:p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-inner">
                <Sparkles className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                  <Badge className="bg-indigo-600 text-white border-none text-[10px]">AI ADVISOR</Badge>
                  <h3 className="text-xl font-display font-bold text-slate-900">Alexis Intelligence</h3>
                </div>
                <p className="text-slate-500 font-medium">Get personalized financial insights and loan eligibility reports.</p>
              </div>
            </div>
            <Link href="/advisor">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 h-12 shadow-lg shadow-indigo-200">
                Talk to Alexis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loans */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-xl font-display font-bold">My Loans</CardTitle>
            <CardDescription>Track your loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLoans.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-bold text-foreground mb-2">No Loans Yet</p>
                <p className="text-muted-foreground mb-6 text-sm">Apply for your first loan today!</p>
                <Link href="/loans/apply"><Button className="font-bold"><FileText className="mr-2 h-4 w-4" />Apply for Loan</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLoans.slice(0, 3).map((loan) => (
                  <div key={loan.id} className="p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-foreground text-sm">{loan.loan_number}</p>
                      <Badge variant={loan.status === 'DISBURSED' ? 'success' : 'outline'} className="text-[10px] uppercase font-bold">{loan.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-foreground font-bold text-lg">{formatCurrency(loan.amount)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(loan.monthly_repayment)}/month · {loan.duration_months} months</p>
                  </div>
                ))}
                <Link href="/loans" className="block mt-4">
                  <Button variant="outline" className="w-full font-bold border-2">View All Loans <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-xl font-display font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { href: '/loans/apply', icon: FileText, label: 'Apply for a Loan' },
              { href: '/guarantor', icon: Users, label: 'Guarantor Requests', badge: guarantorRequests.length > 0 ? guarantorRequests.length : undefined },
              { href: '/withdrawals', icon: Wallet, label: 'Withdraw Funds' },
              { href: '/referrals', icon: Users, label: 'Refer a Friend & Earn' },
            ].map((action) => (
              <Link key={action.href} href={action.href} className="block">
                <Button className="w-full justify-between h-14 text-base font-bold border hover:bg-muted/50 transition-colors" variant="outline">
                  <span className="flex items-center">
                    <action.icon className="h-5 w-5 text-muted-foreground mr-3" />
                    {action.label}
                    {action.badge && <Badge className="ml-2 bg-primary text-primary-foreground border-none text-[10px]">{action.badge}</Badge>}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
