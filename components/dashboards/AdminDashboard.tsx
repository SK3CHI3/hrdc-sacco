'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, Wallet, ArrowRight, CheckCircle, UserPlus,
  ArrowDownToLine, ArrowUpFromLine, ClipboardList
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AdminDashboardProps {
  stats: {
    pendingMembers: number;
    activeMembers: number;
    todayDeposits: number;
    todayDepositAmount: number;
    pendingWithdrawals: number;
  };
  pendingMembersList: any[];
  recentDeposits: any[];
  onApproveMember: (id: string) => void;
}

export function AdminDashboard({ stats, pendingMembersList, recentDeposits, onApproveMember }: AdminDashboardProps) {
  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending Approvals', value: stats.pendingMembers, sub: 'Member applications', icon: UserPlus },
          { label: 'Active Members', value: stats.activeMembers, sub: 'Fully verified', icon: Users },
          { label: "Today's Deposits", value: stats.todayDeposits, sub: formatCurrency(stats.todayDepositAmount), icon: ArrowDownToLine },
          { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, sub: 'Awaiting processing', icon: ArrowUpFromLine },
        ].map((s) => (
          <Card key={s.label} className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-foreground">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Member Approvals */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display font-bold">Pending Approvals</CardTitle>
                <CardDescription>Members awaiting verification</CardDescription>
              </div>
              <Link href="/admin/members"><Button variant="outline" size="sm" className="font-bold text-xs">View All</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingMembersList.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-bold text-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending member approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingMembersList.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-bold text-foreground text-sm">{m.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{m.member_number} · {m.national_id}</p>
                    </div>
                    <Button size="sm" className="font-bold text-xs" onClick={() => onApproveMember(m.id)}>
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions + Recent Deposits */}
        <div className="space-y-6">
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-xl font-display font-bold">Operations</CardTitle>
              <CardDescription>Daily administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { href: '/admin/members', icon: Users, label: 'Manage Members' },
                { href: '/admin/deposits', icon: ArrowDownToLine, label: 'Record Deposit' },
                { href: '/admin/loans', icon: ClipboardList, label: 'Review Loans' },
              ].map((a) => (
                <Link key={a.href} href={a.href}>
                  <Button className="w-full justify-between h-14 font-bold border hover:bg-muted/50 transition-colors" variant="outline">
                    <span className="flex items-center"><a.icon className="h-5 w-5 text-muted-foreground mr-3" />{a.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader><CardTitle className="text-lg font-display font-bold">Recent Deposits</CardTitle></CardHeader>
            <CardContent>
              {recentDeposits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent deposits</p>
              ) : (
                <div className="space-y-2">
                  {recentDeposits.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-bold text-sm text-foreground">{d.members?.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{d.members?.member_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-foreground">+{formatCurrency(d.amount)}</p>
                        <Badge variant="outline" className="text-[10px]">{d.payment_status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
