'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-lg mb-4">
            <span className="text-white font-bold text-2xl">HS</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">HRDC SACCO</h1>
          <p className="text-slate-700 font-medium mt-2">Sign in to your account</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-slate-700 font-medium">Don&apos;t have an account? </span>
                  <Link href="/auth/register" className="text-slate-900 font-semibold hover:underline">
                    Register here
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-wider">Test Accounts (Dev Only)</CardTitle>
              <CardDescription>Click to instantly fill credentials for demoing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Super Admin</p>
                  <p className="text-slate-600">superadmin@hrdcsacco.co.ke</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs font-bold bg-white"
                  onClick={() => {
                    setEmail('superadmin@hrdcsacco.co.ke');
                    setPassword('password123');
                  }}
                >
                  Auto-fill
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Sacco Admin</p>
                  <p className="text-slate-600">admin@hrdcsacco.co.ke</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs font-bold bg-white"
                  onClick={() => {
                    setEmail('admin@hrdcsacco.co.ke');
                    setPassword('password123');
                  }}
                >
                  Auto-fill
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Credit Officer</p>
                  <p className="text-slate-600">credit@hrdcsacco.co.ke</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs font-bold bg-white"
                  onClick={() => {
                    setEmail('credit@hrdcsacco.co.ke');
                    setPassword('password123');
                  }}
                >
                  Auto-fill
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Committee Member</p>
                  <p className="text-slate-600">committee@hrdcsacco.co.ke</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs font-bold bg-white"
                  onClick={() => {
                    setEmail('committee@hrdcsacco.co.ke');
                    setPassword('password123');
                  }}
                >
                  Auto-fill
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Active Member</p>
                  <p className="text-slate-600">member.active@hrdcsacco.co.ke</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs font-bold bg-white"
                  onClick={() => {
                    setEmail('member.active@hrdcsacco.co.ke');
                    setPassword('password123');
                  }}
                >
                  Auto-fill
                </Button>
              </div>
              <p className="text-[10px] text-center text-slate-500 italic">
                * Password for all: password123
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-slate-700 font-medium mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
