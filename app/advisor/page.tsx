'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/useUser';
import { AIAdvisorView } from '@/components/ai-advisor/AIAdvisorView';
import { Header } from '@/components/layout/Header';

export default function AdvisorPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const { user, loading: userLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, userLoading, router]);

  if (!mounted || userLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return <AIAdvisorView role={user.role} userName={user.full_name || 'Member'} />;
}
