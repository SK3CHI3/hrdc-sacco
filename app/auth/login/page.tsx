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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6 shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300 group">
            <span className="text-primary-foreground font-display font-black text-3xl group-hover:scale-110 transition-transform">KS</span>
          </div>
          <h1 className="text-5xl font-display font-black text-foreground tracking-tight mb-3">KOPA SACCO</h1>
          <p className="text-muted-foreground font-medium text-xl max-w-md mx-auto">Empowering your financial future through community savings and credit.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          <Card className="card-premium h-full flex flex-col justify-center">
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl font-display font-bold text-foreground">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground font-medium text-lg">Enter your credentials to access your portal</CardDescription>
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

                <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/10" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                </Button>

                <div className="text-center pt-2">
                  <span className="text-muted-foreground font-medium">Don&apos;t have an account? </span>
                  <Link href="/auth/register" className="text-primary font-bold hover:underline transition-all underline-offset-4">
                    Register as Member
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="card-premium h-full bg-slate-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-black text-primary uppercase tracking-[0.2em]">Developer Access</CardTitle>
              <CardDescription className="text-muted-foreground font-semibold">Test account credentials for demonstration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-border shadow-sm hover:border-primary/30 transition-all group">
                <div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">Super Admin</p>
                  <p className="text-xs text-muted-foreground font-medium">superadmin@hrdcsacco.co.ke</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 px-4 font-bold border-2 border-primary/20 text-primary hover:bg-primary hover:text-white"
                  onClick={() => {
                    setEmail('superadmin@hrdcsacco.co.ke');
                    setPassword('password123');
                  }}
                >
                  Fill
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-border shadow-sm hover:border-primary/30 transition-all group">
                <div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">Sacco Admin</p>
                  <p className="text-xs text-muted-foreground font-medium">admin@hrdcsacco.co.ke</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 px-4 font-bold border-2 border-primary/20 text-primary hover:bg-primary hover:text-white"
                  onClick={() => {
                    setEmail('admin@hrdcsacco.co.ke');
                    setPassword('password123');
                  }}
                >
                  Fill
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-border shadow-sm hover:border-primary/30 transition-all group">
                <div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">Credit Officer</p>
                  <p className="text-xs text-muted-foreground font-medium">credit@hrdcsacco.co.ke</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 px-4 font-bold border-2 border-primary/20 text-primary hover:bg-primary hover:text-white"
                  onClick={() => {
                    setEmail('credit@hrdcsacco.co.ke');
                    setPassword('password123');
                  }}
                >
                  Fill
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-border shadow-sm hover:border-primary/30 transition-all group">
                <div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">Committee Member</p>
                  <p className="text-xs text-muted-foreground font-medium">committee@hrdcsacco.co.ke</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 px-4 font-bold border-2 border-primary/20 text-primary hover:bg-primary hover:text-white"
                  onClick={() => {
                    setEmail('committee@hrdcsacco.co.ke');
                    setPassword('password123');
                  }}
                >
                  Fill
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-border shadow-sm hover:border-primary/30 transition-all group">
                <div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">Active Member</p>
                  <p className="text-xs text-muted-foreground font-medium">member.active@hrdcsacco.co.ke</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 px-4 font-bold border-2 border-primary/20 text-primary hover:bg-primary hover:text-white"
                  onClick={() => {
                    setEmail('member.active@hrdcsacco.co.ke');
                    setPassword('password123');
                  }}
                >
                  Fill
                </Button>
              </div>
              <p className="text-[11px] text-center text-muted-foreground font-medium pt-2">
                <span className="text-primary font-bold italic">Note:</span> Password for all accounts is <code className="bg-primary/10 px-1 rounded text-primary">password123</code>
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground font-medium mt-12">
          By signing in, you agree to our <Link href="#" className="text-foreground hover:underline">Terms of Service</Link> and <Link href="#" className="text-foreground hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
