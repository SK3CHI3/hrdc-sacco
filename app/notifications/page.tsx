'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';

export default function NotificationsPage() {
  const { user, loading: userLoading } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!user || userLoading) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, userLoading, supabase]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-900 font-bold">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'ERROR':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="h-6 w-6 text-amber-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-700 font-medium mt-1">Stay updated with your SACCO activities</p>
        </div>

        {notifications.length === 0 ? (
          <Card className="border-2 border-slate-200">
            <CardContent className="p-12 text-center">
              <Bell className="h-20 w-20 text-slate-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Notifications</h2>
              <p className="text-slate-700 font-medium">
                You're all caught up! We'll notify you of any important updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`border-2 ${notification.read_at ? 'border-slate-200 bg-white' : 'border-blue-300 bg-blue-50'}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {notification.title}
                        </h3>
                        {!notification.read_at && (
                          <Badge className="bg-blue-600 text-white font-bold flex-shrink-0">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-700 font-medium mb-2">
                        {notification.message}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(notification.created_at).toLocaleString('en-KE', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
