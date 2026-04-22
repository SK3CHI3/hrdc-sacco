'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createBrowserClient } from '@/lib/supabase/client';
import { Users, Shield, CreditCard, UserCheck, AlertTriangle } from 'lucide-react';
import { getMemberStatusColor } from '@/lib/utils';

const TEST_ACCOUNTS = [
  {
    role: 'SUPER_ADMIN',
    email: 'superadmin@hrdcsacco.co.ke',
    password: 'password123',
    description: 'Full access to all system features and admin panels.',
    icon: Shield,
    color: 'bg-red-100 text-red-700 border-red-200'
  },
  {
    role: 'ADMIN',
    email: 'admin@hrdcsacco.co.ke',
    password: 'password123',
    description: 'General administrative access for managing members and deposits.',
    icon: Shield,
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  {
    role: 'CREDIT_OFFICER',
    email: 'credit@hrdcsacco.co.ke',
    password: 'password123',
    description: 'Access to loan applications and credit review workflows.',
    icon: CreditCard,
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  {
    role: 'COMMITTEE_MEMBER',
    email: 'committee@hrdcsacco.co.ke',
    password: 'password123',
    description: 'Access to high-value loan committee reviews.',
    icon: Users,
    color: 'bg-purple-100 text-purple-700 border-purple-200'
  },
  {
    role: 'ACTIVE_MEMBER',
    email: 'member.active@hrdcsacco.co.ke',
    password: 'password123',
    description: 'Standard member with an active account and approved status.',
    icon: UserCheck,
    color: 'bg-slate-100 text-slate-700 border-slate-200'
  }
];

export default function TestAccountsPage() {
  const [users, setUsers] = useState<{ email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('email', TEST_ACCOUNTS.map(a => a.email));

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching test accounts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [supabase]);

  const getAccountStatus = (email: string) => {
    const user = users.find(u => u.email === email);
    return user ? 'CREATED' : 'MISSING';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Test Accounts Dashboard</h1>
          <p className="text-slate-600 mt-1">Quick access to pre-configured test accounts for development and verification.</p>
        </div>

        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-900 font-bold">Developer Warning</AlertTitle>
          <AlertDescription className="text-amber-800">
            These accounts are for <strong>testing purposes only</strong>. Do not use them in a production environment. 
            All test accounts use the default password: <code>password123</code>.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEST_ACCOUNTS.map((account) => {
            const status = getAccountStatus(account.email);
            const Icon = account.icon;

            return (
              <Card key={account.email} className="border-2 border-slate-200 hover:border-slate-300 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${account.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant={status === 'CREATED' ? 'default' : 'outline'} className={status === 'CREATED' ? 'bg-green-600' : 'text-slate-400'}>
                      {status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">{account.role.replace('_', ' ')}</CardTitle>
                  <CardDescription className="font-medium text-slate-600">{account.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 mb-6 leading-relaxed">
                    {account.description}
                  </p>
                  
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Password:</span>
                      <code className="font-bold text-slate-900">password123</code>
                    </div>
                    {status === 'MISSING' && (
                      <p className="text-xs text-red-500 font-medium italic mt-2">
                        * Run the seeding script to create this account.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
