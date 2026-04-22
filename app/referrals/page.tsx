'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Users, 
  ArrowLeft, 
  Copy, 
  Share2, 
  Gift, 
  Trophy,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { formatDate } from '@/lib/utils';

export default function ReferralsPage() {
  const { user, member } = useUser();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<{ points: number; reason: string; created_at: string; id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    if (member) {
      fetchReferralData();
    }
  }, [member]);

  const fetchReferralData = async () => {
    try {
      if (!member) return;

      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_member:referred_member_id (
            member_number,
            profiles:user_id (full_name)
          )
        `)
        .eq('referrer_member_id', member.id);

      setReferrals(referralsData || []);

      const { data: pointsData } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false });

      setLoyaltyPoints(pointsData || []);

    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (member?.referral_code) {
      navigator.clipboard.writeText(member.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalPoints = loyaltyPoints.reduce((sum, p) => sum + p.points, 0);

  if (!user || !member) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Referral Program</h1>
            <p className="text-slate-600 mt-1">Invite friends and earn loyalty points</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Gift className="h-32 w-32" />
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Your Referral Code</CardTitle>
                <CardDescription className="text-slate-400 font-medium">
                  Share this code with friends when they register
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-8">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex-1 w-full flex items-center justify-between">
                    <span className="text-4xl font-black tracking-widest">{member.referral_code}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={copyToClipboard}
                      className="hover:bg-white/20 text-white"
                    >
                      {copied ? <CheckCircle className="h-6 w-6 text-green-400" /> : <Copy className="h-6 w-6" />}
                    </Button>
                  </div>
                  <Button className="h-16 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-2xl w-full md:w-auto">
                    <Share2 className="mr-2 h-5 w-5" />
                    Share Link
                  </Button>
                </div>
                <p className="mt-6 text-sm text-slate-400">
                  Earn 100 points for every member you refer who completes onboarding.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referred Members</CardTitle>
                <CardDescription>Track the status of your invitations</CardDescription>
              </CardHeader>
              <CardContent>
                {referrals.length > 0 ? (
                  <div className="space-y-4">
                    {referrals.map((ref) => (
                      <div key={ref.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-full">
                            <Users className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{ref.referred_member.profiles.full_name}</p>
                            <p className="text-xs text-slate-500">{ref.referred_member.member_number}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">+{ref.points_awarded} Points</p>
                          <p className="text-xs text-slate-500">Earned on {formatDate(ref.points_awarded_at || ref.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500">You haven&apos;t referred anyone yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-2 border-slate-200">
              <CardHeader className="text-center">
                <Trophy className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                <CardTitle className="text-3xl font-black">{totalPoints}</CardTitle>
                <CardDescription className="text-slate-600 font-bold uppercase tracking-wider">
                  Loyalty Points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full h-12 font-bold" variant="outline">
                  Redeem Rewards
                </Button>
                <p className="text-xs text-center text-slate-500 mt-4">
                  Points can be used to pay for loan processing fees or cleared against interest.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loyaltyPoints.length > 0 ? (
                    loyaltyPoints.slice(0, 5).map((point) => (
                      <div key={point.id} className="flex gap-3">
                        <div className="mt-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">+{point.points} Points</p>
                          <p className="text-xs text-slate-600">{point.reason}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDate(point.created_at)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">No activity yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
