'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, FileText, Wallet, TrendingUp, ArrowRight, Activity, BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SuperAdminDashboardProps {
  stats: {
    totalMembers: number;
    activeMembers: number;
    pendingMembers: number;
    totalAssets: number;
    totalLoansOutstanding: number;
    pendingLoans: number;
    totalDeposits: number;
    disbursedLoansCount: number;
    overdueAlerts: number;
  };
}

export function SuperAdminDashboard({ stats }: SuperAdminDashboardProps) {
  const loanToDepositRatio = stats.totalDeposits > 0
    ? ((stats.totalLoansOutstanding / stats.totalDeposits) * 100).toFixed(1)
    : '0';

  return (
    <>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Members', value: stats.totalMembers, sub: `${stats.activeMembers} active · ${stats.pendingMembers} pending`, icon: Users },
          { label: 'Total Assets', value: formatCurrency(stats.totalAssets), sub: 'Shares + Deposits', icon: Wallet },
          { label: 'Loans Outstanding', value: formatCurrency(stats.totalLoansOutstanding), sub: `${stats.disbursedLoansCount} active loans`, icon: FileText },
          { label: 'Loan/Deposit Ratio', value: `${loanToDepositRatio}%`, sub: 'SASRA target: ≤80%', icon: BarChart3 },
        ].map((stat) => (
          <Card key={stat.label} className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SACCO Health Overview */}
      <Card className="mb-8 card-premium">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-xl font-display font-bold">SACCO Health Overview</CardTitle>
              <CardDescription>Key financial metrics at a glance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Net Worth', value: formatCurrency(stats.totalAssets - stats.totalLoansOutstanding), sub: 'Assets − Loans' },
              { label: 'Avg. Savings/Member', value: formatCurrency(stats.activeMembers > 0 ? stats.totalAssets / stats.activeMembers : 0), sub: 'Per active member' },
              { label: 'Pending Actions', value: stats.pendingMembers + stats.pendingLoans, sub: `${stats.pendingMembers} members · ${stats.pendingLoans} loans` },
              { label: 'Compliance', value: parseFloat(loanToDepositRatio) <= 80 ? 'Healthy' : 'Review', sub: `Ratio: ${loanToDepositRatio}%` },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{item.label}</p>
                <p className="text-lg font-bold text-foreground">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Strategic Intelligence */}
      <Card className="mb-8 card-premium border-2 border-indigo-100 overflow-hidden relative group cursor-pointer hover:border-indigo-300 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity className="h-32 w-32 text-indigo-600" /></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                  Alexis AI Strategic Advisor
                </h3>
                <p className="text-sm text-slate-500 font-medium">Generate liquidity forecasts and risk assessments using neural analysis.</p>
              </div>
            </div>
            <Link href="/advisor">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-100">
                Consult Alexis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* System Management */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-xl font-display font-bold">System Management</CardTitle>
          <CardDescription>Full administrative access</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/admin/members', icon: Users, label: 'Manage Members', desc: `${stats.pendingMembers} pending` },
            { href: '/admin/loans', icon: FileText, label: 'All Loans', desc: `${stats.pendingLoans} in pipeline` },
            { href: '/admin/deposits', icon: Wallet, label: 'Deposits & Payments', desc: 'Record & verify' },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <Button className="w-full justify-between h-16 font-bold border hover:bg-muted/50 transition-colors p-4" variant="outline">
                <div className="flex items-center">
                  <action.icon className="h-5 w-5 text-muted-foreground mr-3" />
                  <div className="text-left"><p className="font-bold text-sm">{action.label}</p><p className="text-[10px] text-muted-foreground">{action.desc}</p></div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
