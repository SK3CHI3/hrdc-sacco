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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Eye, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { formatDate, getMemberStatusColor, formatMemberStatus } from '@/lib/utils';

export default function AdminMembersPage() {
  const { user, loading: userLoading } = useUser();
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
    };
    checkAuth();
  }, [router, supabase]);

  useEffect(() => {
    if (userLoading) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchMembers();
  }, [user, userLoading, router]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            phone_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = members;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.member_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.national_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
  }, [searchTerm, statusFilter, members]);

  const handleApprove = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({
          status: 'ACTIVE',
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', memberId);

      if (error) throw error;
      fetchMembers();
    } catch (error) {
      console.error('Error approving member:', error);
    }
  };

  const handleReject = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({
          status: 'INACTIVE',
        })
        .eq('id', memberId);

      if (error) throw error;

      const member = members.find(m => m.id === memberId);
      if (member) {
        await supabase.from('notifications').insert({
          user_id: member.user_id,
          title: 'Membership Application',
          message: 'Your membership application requires additional review. Please contact the SACCO office.',
          type: 'APPROVAL',
        });
      }

      fetchMembers();
    } catch (error) {
      console.error('Error rejecting member:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Member Management</h1>
          <p className="text-slate-600 mt-1">Review and manage SACCO members</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">
                {members.filter(m => m.status === 'PENDING_APPROVAL').length}
              </div>
              <p className="text-sm text-slate-600">Pending Approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">
                {members.filter(m => m.status === 'ACTIVE').length}
              </div>
              <p className="text-sm text-slate-600">Active Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">
                {members.filter(m => m.status === 'SUSPENDED').length}
              </div>
              <p className="text-sm text-slate-600">Suspended</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">
                {members.length}
              </div>
              <p className="text-sm text-slate-600">Total Members</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Members List</CardTitle>
                <CardDescription>All registered members and their status</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full sm:w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING_APPROVAL">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <Alert>
                <AlertDescription>No members found matching your criteria.</AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Member #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Joined</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                          {member.member_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {member.profiles?.full_name}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {member.profiles?.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getMemberStatusColor(member.status)}>
                            {formatMemberStatus(member.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {formatDate(member.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/members/${member.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {member.status === 'PENDING_APPROVAL' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(member.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(member.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
