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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-lg mb-4">
            <span className="text-white font-bold text-2xl">HS</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">HRDC SACCO</h1>
          <p className="text-slate-700 font-medium mt-2">Create your member account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Member Registration</CardTitle>
            <CardDescription>Join HRDC SACCO and start your savings journey</CardDescription>
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

              <Button type="submit" className="w-full" disabled={loading || !!success}>
                {loading ? 'Creating account...' : success ? 'Account Created!' : 'Create Account'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-slate-700 font-medium">Already have an account? </span>
                <Link href="/auth/login" className="text-slate-900 font-semibold hover:underline">
                  Sign in here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-700 font-medium mt-6">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
