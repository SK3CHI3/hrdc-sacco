'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, ArrowRight, AlertTriangle, CheckCircle,
  Eye, BarChart3, Banknote, GitPullRequestArrow
} from 'lucide-react';
import { formatCurrency, getLoanStatusColor, formatLoanStatus } from '@/lib/utils';

interface CreditOfficerDashboardProps {
  stats: {
    newApplications: number;
    underReview: number;
    awaitingGuarantors: number;
    readyToDisburse: number;
    disbursedThisMonth: number;
    overdueLoans: number;
  };
  recentLoans: any[];
}

export function CreditOfficerDashboard({ stats, recentLoans }: CreditOfficerDashboardProps) {
  return (
    <>
      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'New Applications', value: stats.newApplications, icon: FileText },
          { label: 'Under My Review', value: stats.underReview, icon: Eye },
          { label: 'Awaiting Guarantors', value: stats.awaitingGuarantors, icon: GitPullRequestArrow },
          { label: 'Ready to Disburse', value: stats.readyToDisburse, icon: Banknote },
        ].map((s) => (
          <Card key={s.label} className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-foreground">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loan Pipeline Visual */}
      <Card className="mb-8 card-premium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div><CardTitle className="text-xl font-display font-bold">Loan Pipeline</CardTitle><CardDescription>Application flow overview</CardDescription></div>
            </div>
            <Link href="/admin/loans"><Button variant="outline" size="sm" className="font-bold text-xs">View All</Button></Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Submitted', count: stats.newApplications },
              { label: 'Credit Review', count: stats.underReview },
              { label: 'Guarantors', count: stats.awaitingGuarantors },
              { label: 'Approved', count: stats.readyToDisburse },
            ].map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-2">
                <div className="px-4 py-3 rounded-xl border border-border bg-muted/50 text-center min-w-[110px]">
                  <p className="text-2xl font-bold text-foreground">{stage.count}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{stage.label}</p>
                </div>
                {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground/40 hidden sm:block" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alerts + Quick Actions */}
        <div className="space-y-6">
          {stats.overdueLoans > 0 && (
            <Card className="card-premium border-l-4 border-l-error">
              <CardContent className="p-6 flex items-center gap-4">
                <AlertTriangle className="h-6 w-6 text-error flex-shrink-0" />
                <div>
                  <p className="font-bold text-foreground">{stats.overdueLoans} Overdue Loan(s)</p>
                  <p className="text-sm text-muted-foreground">Require follow-up and recovery action</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="card-premium">
            <CardHeader><CardTitle className="text-lg font-display font-bold">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { href: '/admin/loans', icon: Eye, label: 'Review Loan Applications' },
                { href: '/admin/deposits', icon: Banknote, label: 'Record Repayment' },
                { href: '/admin/members', icon: FileText, label: 'Check Member Eligibility' },
              ].map((a) => (
                <Link key={a.label} href={a.href}>
                  <Button className="w-full justify-between h-14 font-bold border hover:bg-muted/50 transition-colors" variant="outline">
                    <span className="flex items-center"><a.icon className="h-5 w-5 text-muted-foreground mr-3" />{a.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-xl font-display font-bold">Recent Applications</CardTitle>
            <CardDescription>Latest loan applications in the pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLoans.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-bold text-foreground">Pipeline Clear</p>
                <p className="text-sm text-muted-foreground">No pending loan applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLoans.slice(0, 5).map((loan) => (
                  <div key={loan.id} className="p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-foreground text-sm">{loan.loan_number}</p>
                      <Badge variant="outline" className="text-[10px] font-bold">{formatLoanStatus(loan.status)}</Badge>
                    </div>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(loan.amount)}</p>
                    <p className="text-xs text-muted-foreground">{loan.members?.profiles?.full_name} · {loan.members?.member_number}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
