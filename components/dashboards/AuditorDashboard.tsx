'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Shield, Eye, BarChart3, FileSearch, Users, Wallet,
  FileText, Lock, Activity, Sparkles, ArrowRight
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface AuditorDashboardProps {
  stats: {
    totalMembers: number;
    totalAssets: number;
    totalLoansOutstanding: number;
    totalTransactions: number;
    loanToDepositRatio: string;
  };
  recentAuditLogs: any[];
}

export function AuditorDashboard({ stats, recentAuditLogs }: AuditorDashboardProps) {
  return (
    <>
      {/* Read-Only Banner */}
      <div className="mb-6 p-4 bg-muted border border-border rounded-xl flex items-center gap-3">
        <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="font-bold text-foreground text-sm">Read-Only Access — Supervisory Committee View</p>
          <p className="text-xs text-muted-foreground">You can view all data for audit purposes but cannot modify any records.</p>
        </div>
      </div>

      {/* AI Discrepancy Detector */}
      <Card className="mb-8 card-premium border-2 border-indigo-100 overflow-hidden relative group cursor-pointer hover:border-indigo-300 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><FileSearch className="h-32 w-32 text-indigo-600" /></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                  Alexis AI Discrepancy Detector
                  <Badge className="bg-indigo-600 text-white border-none text-[10px]">NEW</Badge>
                </h3>
                <p className="text-sm text-slate-500 font-medium">Auto-scan transactions for anomalies and compliance risks using neural patterns.</p>
              </div>
            </div>
            <Link href="/advisor">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-100">
                Run AI Audit <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Members', value: stats.totalMembers, icon: Users },
          { label: 'Total Assets', value: formatCurrency(stats.totalAssets), icon: Wallet },
          { label: 'Loans Outstanding', value: formatCurrency(stats.totalLoansOutstanding), icon: FileText },
          { label: 'Loan/Deposit Ratio', value: `${stats.loanToDepositRatio}%`, icon: BarChart3 },
        ].map((s) => (
          <Card key={s.label} className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Overview */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div><CardTitle className="text-xl font-display font-bold">Financial Overview</CardTitle><CardDescription>Read-only financial summary</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Total Member Deposits', value: formatCurrency(stats.totalAssets), status: 'Verified' },
              { label: 'Outstanding Loan Book', value: formatCurrency(stats.totalLoansOutstanding), status: 'Active' },
              { label: 'Net Position', value: formatCurrency(stats.totalAssets - stats.totalLoansOutstanding), status: stats.totalAssets > stats.totalLoansOutstanding ? 'Healthy' : 'Review' },
              { label: 'Loan-to-Deposit Ratio', value: `${stats.loanToDepositRatio}%`, status: parseFloat(stats.loanToDepositRatio) <= 80 ? 'Compliant' : 'Non-Compliant' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</p>
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                </div>
                <Badge variant="outline" className="font-bold text-[10px]">{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileSearch className="h-5 w-5 text-primary" />
              <div><CardTitle className="text-xl font-display font-bold">Recent Audit Trail</CardTitle><CardDescription>Latest system activity logs</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent>
            {recentAuditLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-bold text-foreground">No Recent Activity</p>
                <p className="text-sm text-muted-foreground">Audit logs will appear here as actions occur</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAuditLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">{log.action}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDateTime(log.created_at)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.entity_type} · User: {log.user_id?.substring(0, 8)}...</p>
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
