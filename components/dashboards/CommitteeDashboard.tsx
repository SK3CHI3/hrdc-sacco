'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, ArrowRight, CheckCircle, Gavel, BarChart3, Scale
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CommitteeDashboardProps {
  stats: {
    highValuePending: number;
    totalDisbursedMonth: number;
    totalPortfolio: number;
    avgLoanSize: number;
    performingLoans: number;
    nonPerformingLoans: number;
  };
  committeeLoans: any[];
}

export function CommitteeDashboard({ stats, committeeLoans }: CommitteeDashboardProps) {
  const totalLoans = stats.performingLoans + stats.nonPerformingLoans;
  const portfolioHealthPct = totalLoans > 0
    ? ((stats.performingLoans / totalLoans) * 100).toFixed(0)
    : '100';

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Committee Inbox', value: stats.highValuePending, sub: 'Loans awaiting vote', icon: Gavel },
          { label: 'Disbursed (Month)', value: formatCurrency(stats.totalDisbursedMonth), sub: 'This calendar month', icon: FileText },
          { label: 'Portfolio Quality', value: `${portfolioHealthPct}%`, sub: 'Performing loans', icon: BarChart3 },
          { label: 'Avg Loan Size', value: formatCurrency(stats.avgLoanSize), sub: 'Across all active', icon: Scale },
        ].map((s) => (
          <Card key={s.label} className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Committee Inbox */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Gavel className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-xl font-display font-bold">Committee Inbox</CardTitle>
                <CardDescription>Loans requiring committee approval</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {committeeLoans.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-bold text-foreground">No Pending Approvals</p>
                <p className="text-sm text-muted-foreground">All committee reviews are complete</p>
              </div>
            ) : (
              <div className="space-y-3">
                {committeeLoans.map((loan) => (
                  <div key={loan.id} className="p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-foreground text-sm">{loan.loan_number}</p>
                      <Badge variant="outline" className="font-bold text-[10px]">COMMITTEE REVIEW</Badge>
                    </div>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(loan.amount)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {loan.members?.profiles?.full_name} · {loan.duration_months} months · {loan.interest_rate}% p.a.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Purpose: {loan.purpose}</p>
                  </div>
                ))}
                <Link href="/admin/loans">
                  <Button className="w-full font-bold border mt-2" variant="outline">
                    Review All Loans <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Summary */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div><CardTitle className="text-xl font-display font-bold">Portfolio Summary</CardTitle><CardDescription>Loan distribution overview</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-2xl font-bold text-foreground">{stats.performingLoans}</p>
                <p className="text-xs font-bold text-muted-foreground">Performing</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-2xl font-bold text-foreground">{stats.nonPerformingLoans}</p>
                <p className="text-xs font-bold text-muted-foreground">Non-Performing</p>
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground">Portfolio Health</span>
                <span className="text-xs font-bold text-foreground">{portfolioHealthPct}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${portfolioHealthPct}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Target: ≥95% performing loans</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalPortfolio)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
