'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { useUser } from '@/lib/hooks/useUser';

// Role-specific dashboard components
import { MemberDashboard, MemberPendingView } from '@/components/dashboards/MemberDashboard';
import { SuperAdminDashboard } from '@/components/dashboards/SuperAdminDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { CreditOfficerDashboard } from '@/components/dashboards/CreditOfficerDashboard';
import { CommitteeDashboard } from '@/components/dashboards/CommitteeDashboard';
import { AuditorDashboard } from '@/components/dashboards/AuditorDashboard';

// Role subtitle mapping
const ROLE_SUBTITLES: Record<string, string> = {
  MEMBER: 'Manage your savings and loans',
  SUPER_ADMIN: 'SACCO-wide overview and system management',
  ADMIN: 'Operations and member management',
  CREDIT_OFFICER: 'Loan pipeline and credit management',
  COMMITTEE_MEMBER: 'Governance and loan approvals',
  AUDITOR: 'Compliance monitoring and audit oversight',
};

export default function DashboardPage() {
  const { user, member, loading: userLoading } = useUser();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); }
    };
    checkAuth();
  }, [router, supabase]);

  useEffect(() => {
    if (!user || userLoading) return;
    fetchDashboardData();
  }, [user, member, userLoading]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      switch (user.role) {
        case 'MEMBER':
          await fetchMemberData();
          break;
        case 'SUPER_ADMIN':
          await fetchSuperAdminData();
          break;
        case 'ADMIN':
          await fetchAdminData();
          break;
        case 'CREDIT_OFFICER':
          await fetchCreditOfficerData();
          break;
        case 'COMMITTEE_MEMBER':
          await fetchCommitteeData();
          break;
        case 'AUDITOR':
          await fetchAuditorData();
          break;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── MEMBER ───
  const fetchMemberData = async () => {
    if (!member) { setLoading(false); return; }

    const [loansRes, guarantorRes] = await Promise.all([
      supabase.from('loans').select('*').eq('member_id', member.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('loan_guarantors').select(`*, loans:loan_id (loan_number, amount, members:member_id (user_id, profiles:user_id (full_name)))`)
        .eq('guarantor_member_id', member.id).eq('status', 'PENDING').order('requested_at', { ascending: false }),
    ]);

    const loans = loansRes.data || [];
    setDashboardData({
      recentLoans: loans,
      guarantorRequests: guarantorRes.data || [],
      recentTransactions: [],
      stats: {
        totalSavings: member.total_shares + member.total_deposits,
        availableBalance: member.available_balance,
        activeLoans: loans.filter((l: any) => l.status === 'DISBURSED').length,
        pendingLoans: loans.filter((l: any) => ['SUBMITTED', 'AWAITING_GUARANTOR_APPROVAL', 'UNDER_CREDIT_REVIEW', 'COMMITTEE_REVIEW'].includes(l.status)).length,
      },
    });
  };

  // ─── SUPER ADMIN ───
  const fetchSuperAdminData = async () => {
    const [membersRes, activeRes, pendingRes, loansRes, depositsRes, disbursedRes] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'PENDING_APPROVAL'),
      supabase.from('loans').select('*', { count: 'exact', head: true }).in('status', ['SUBMITTED', 'AWAITING_GUARANTOR_APPROVAL', 'UNDER_CREDIT_REVIEW', 'COMMITTEE_REVIEW']),
      supabase.from('deposits').select('amount').eq('payment_status', 'COMPLETED'),
      supabase.from('loans').select('amount').eq('status', 'DISBURSED'),
    ]);

    const totalDeposits = depositsRes.data?.reduce((sum: number, d: any) => sum + Number(d.amount), 0) || 0;
    const totalLoansOutstanding = disbursedRes.data?.reduce((sum: number, l: any) => sum + Number(l.amount), 0) || 0;

    setDashboardData({
      stats: {
        totalMembers: membersRes.count || 0,
        activeMembers: activeRes.count || 0,
        pendingMembers: pendingRes.count || 0,
        totalAssets: totalDeposits,
        totalLoansOutstanding,
        pendingLoans: loansRes.count || 0,
        totalDeposits,
        disbursedLoansCount: disbursedRes.data?.length || 0,
        overdueAlerts: 0,
      },
    });
  };

  // ─── ADMIN ───
  const fetchAdminData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingMembersRes, activeRes, pendingListRes, depositsRes, withdrawalsRes] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'PENDING_APPROVAL'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('members').select('*, profiles:user_id (full_name, email)').eq('status', 'PENDING_APPROVAL').order('created_at', { ascending: false }).limit(5),
      supabase.from('deposits').select('*, members:member_id (member_number, profiles:user_id (full_name))').eq('payment_status', 'COMPLETED').order('created_at', { ascending: false }).limit(10),
      supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('transaction_type', 'WITHDRAWAL').eq('payment_status', 'PENDING'),
    ]);

    const todayDeposits = depositsRes.data?.filter((d: any) => new Date(d.created_at) >= today) || [];

    setDashboardData({
      stats: {
        pendingMembers: pendingMembersRes.count || 0,
        activeMembers: activeRes.count || 0,
        todayDeposits: todayDeposits.length,
        todayDepositAmount: todayDeposits.reduce((s: number, d: any) => s + Number(d.amount), 0),
        pendingWithdrawals: withdrawalsRes.count || 0,
      },
      pendingMembersList: pendingListRes.data || [],
      recentDeposits: depositsRes.data || [],
    });
  };

  // ─── CREDIT OFFICER ───
  const fetchCreditOfficerData = async () => {
    const [submittedRes, reviewRes, guarantorRes, approvedRes, disbursedRes, recentRes] = await Promise.all([
      supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED'),
      supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'UNDER_CREDIT_REVIEW'),
      supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'AWAITING_GUARANTOR_APPROVAL'),
      supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED'),
      supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'DISBURSED'),
      supabase.from('loans').select('*, members:member_id (member_number, profiles:user_id (full_name))')
        .in('status', ['SUBMITTED', 'UNDER_CREDIT_REVIEW', 'AWAITING_GUARANTOR_APPROVAL', 'APPROVED'])
        .order('created_at', { ascending: false }).limit(5),
    ]);

    setDashboardData({
      stats: {
        newApplications: submittedRes.count || 0,
        underReview: reviewRes.count || 0,
        awaitingGuarantors: guarantorRes.count || 0,
        readyToDisburse: approvedRes.count || 0,
        disbursedThisMonth: disbursedRes.count || 0,
        overdueLoans: 0,
      },
      recentLoans: recentRes.data || [],
    });
  };

  // ─── COMMITTEE ───
  const fetchCommitteeData = async () => {
    const [committeeRes, disbursedMonthRes, allDisbursedRes] = await Promise.all([
      supabase.from('loans').select('*, members:member_id (member_number, profiles:user_id (full_name))')
        .eq('status', 'COMMITTEE_REVIEW').order('created_at', { ascending: false }),
      supabase.from('loans').select('amount').eq('status', 'DISBURSED'),
      supabase.from('loans').select('amount, status').eq('status', 'DISBURSED'),
    ]);

    const disbursedLoans = allDisbursedRes.data || [];
    const totalPortfolio = disbursedLoans.reduce((s: number, l: any) => s + Number(l.amount), 0);

    setDashboardData({
      stats: {
        highValuePending: committeeRes.data?.length || 0,
        totalDisbursedMonth: totalPortfolio,
        totalPortfolio,
        avgLoanSize: disbursedLoans.length > 0 ? totalPortfolio / disbursedLoans.length : 0,
        performingLoans: disbursedLoans.length,
        nonPerformingLoans: 0,
      },
      committeeLoans: committeeRes.data || [],
    });
  };

  // ─── AUDITOR ───
  const fetchAuditorData = async () => {
    const [membersRes, depositsRes, loansRes, auditRes] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('deposits').select('amount').eq('payment_status', 'COMPLETED'),
      supabase.from('loans').select('amount').eq('status', 'DISBURSED'),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    const totalAssets = depositsRes.data?.reduce((s: number, d: any) => s + Number(d.amount), 0) || 0;
    const totalLoans = loansRes.data?.reduce((s: number, l: any) => s + Number(l.amount), 0) || 0;

    setDashboardData({
      stats: {
        totalMembers: membersRes.count || 0,
        totalAssets,
        totalLoansOutstanding: totalLoans,
        totalTransactions: (depositsRes.data?.length || 0) + (loansRes.data?.length || 0),
        loanToDepositRatio: totalAssets > 0 ? ((totalLoans / totalAssets) * 100).toFixed(1) : '0',
      },
      recentAuditLogs: auditRes.data || [],
    });
  };

  // ─── APPROVE MEMBER (for admin) ───
  const handleApproveMember = async (memberId: string) => {
    try {
      await supabase.from('members').update({
        status: 'ACTIVE',
        approved_by: user!.id,
        approved_at: new Date().toISOString(),
      }).eq('id', memberId);
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving member:', error);
    }
  };

  // ─── LOADING STATE ───
  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground font-display font-bold text-xl">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ─── RENDER ───
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Welcome back, {user.full_name}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {ROLE_SUBTITLES[user.role] || 'Dashboard'}
          </p>
        </div>

        {/* Role-Based Dashboard */}
        {user.role === 'MEMBER' && (member?.status === 'PENDING_APPROVAL' || !member) && (
          <MemberPendingView user={user} />
        )}

        {user.role === 'MEMBER' && member?.status === 'ACTIVE' && dashboardData && (
          <MemberDashboard
            user={user}
            member={member}
            stats={dashboardData.stats}
            recentLoans={dashboardData.recentLoans}
            guarantorRequests={dashboardData.guarantorRequests}
            recentTransactions={dashboardData.recentTransactions}
          />
        )}

        {user.role === 'SUPER_ADMIN' && dashboardData && (
          <SuperAdminDashboard stats={dashboardData.stats} />
        )}

        {user.role === 'ADMIN' && dashboardData && (
          <AdminDashboard
            stats={dashboardData.stats}
            pendingMembersList={dashboardData.pendingMembersList}
            recentDeposits={dashboardData.recentDeposits}
            onApproveMember={handleApproveMember}
          />
        )}

        {user.role === 'CREDIT_OFFICER' && dashboardData && (
          <CreditOfficerDashboard
            stats={dashboardData.stats}
            recentLoans={dashboardData.recentLoans}
          />
        )}

        {user.role === 'COMMITTEE_MEMBER' && dashboardData && (
          <CommitteeDashboard
            stats={dashboardData.stats}
            committeeLoans={dashboardData.committeeLoans}
          />
        )}

        {user.role === 'AUDITOR' && dashboardData && (
          <AuditorDashboard
            stats={dashboardData.stats}
            recentAuditLogs={dashboardData.recentAuditLogs}
          />
        )}
      </main>
    </div>
  );
}
