import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/database';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: UserRole;
}

interface MemberProfile {
  id: string;
  member_number: string;
  status: string;
  total_shares: number;
  total_deposits: number;
  available_balance: number;
  committed_balance: number;
  referral_code: string;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setUser(null);
          setMember(null);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser(profile as UserProfile);

          if (profile.role === 'MEMBER') {
            const { data: memberData } = await supabase
              .from('members')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (memberData) {
              setMember(memberData as MemberProfile);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, member, loading };
}
