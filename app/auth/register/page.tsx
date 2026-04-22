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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('rate limit')) {
          throw new Error('Too many signup attempts. Please wait a few minutes and try again.');
        }
        throw signUpError;
      }

      if (authData.user) {
        if (authData.session) {
          router.push('/onboarding');
        } else {
          setError('');
          setSuccess(formData.email);
          setTimeout(() => router.push('/auth/login'), 8000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6 shadow-xl shadow-primary/20 -rotate-3 hover:rotate-0 transition-transform duration-300 group">
            <span className="text-primary-foreground font-display font-black text-3xl group-hover:scale-110 transition-transform">KS</span>
          </div>
          <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-2">KOPA SACCO</h1>
          <p className="text-muted-foreground font-medium text-lg">Create your member account</p>
        </div>

        <Card className="card-premium">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-display font-bold text-foreground">Member Registration</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">Join KOPA SACCO and start your savings journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-900">
                    <div className="font-semibold mb-2">✅ Account Created Successfully!</div>
                    <div className="text-sm space-y-1">
                      <p>A confirmation email has been sent to:</p>
                      <p className="font-medium">{success}</p>
                      <div className="mt-3">
                        <p className="font-medium">Next steps:</p>
                        <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                          <li>Check your email inbox</li>
                          <li>Check your spam/junk folder if not found</li>
                          <li>Click the confirmation link in the email</li>
                          <li>Return here to sign in</li>
                        </ol>
                      </div>
                      <p className="mt-3 text-xs text-green-700">Redirecting to login page in 8 seconds...</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={loading || !!success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading || !!success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+254 700 000 000"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  disabled={loading || !!success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading || !!success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading || !!success}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/10" disabled={loading || !!success}>
                {loading ? 'Creating account...' : success ? 'Account Created!' : 'Create Account'}
              </Button>

              <div className="text-center pt-2">
                <span className="text-muted-foreground font-medium">Already have an account? </span>
                <Link href="/auth/login" className="text-primary font-bold hover:underline transition-all underline-offset-4">
                  Sign in here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground font-medium mt-8">
          By registering, you agree to our <Link href="#" className="text-foreground hover:underline">Terms of Service</Link> and <Link href="#" className="text-foreground hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
