'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Bell, LogOut, User } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/hooks/useUser';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, member } = useUser();
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (!user) return null;

  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER', 'AUDITOR'].includes(user.role);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-800 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">HS</span>
              </div>
              <span className="font-semibold text-lg text-slate-900">HRDC SACCO</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-slate-900 hover:text-slate-700 font-bold text-base">
              Dashboard
            </Link>
            
            {user.role === 'MEMBER' && member?.status === 'ACTIVE' && (
              <>
                <Link href="/loans/apply" className="text-slate-900 hover:text-slate-700 font-bold text-base">
                  My Loans
                </Link>
                <Link href="/guarantor" className="text-slate-900 hover:text-slate-700 font-bold text-base">
                  Guarantor
                </Link>
              </>
            )}

            {isStaff && (
              <>
                <Link href="/admin/members" className="text-slate-900 hover:text-slate-700 font-bold text-base">
                  Members
                </Link>
                <Link href="/admin/loans" className="text-slate-900 hover:text-slate-700 font-bold text-base">
                  Loans
                </Link>
              </>
            )}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/notifications">
              <Button variant="outline" size="icon" className="relative border-2 border-slate-900 hover:bg-slate-900 hover:text-white">
                <Bell className="h-6 w-6 text-slate-900" />
              </Button>
            </Link>

            <div className="flex items-center space-x-3 border-l border-slate-300 pl-4">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{user.full_name}</p>
                <p className="text-xs font-bold text-slate-700">{user.role.replace('_', ' ')}</p>
              </div>
              <Button variant="outline" size="icon" onClick={handleSignOut} className="border-2 border-red-600 hover:bg-red-600 hover:text-white">
                <LogOut className="h-6 w-6 text-red-600" />
              </Button>
            </div>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200">
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-300">
              <User className="h-8 w-8 text-slate-900" />
              <div>
                <p className="text-sm font-bold text-slate-900">{user.full_name}</p>
                <p className="text-xs font-bold text-slate-700">{user.role.replace('_', ' ')}</p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="block py-3 text-slate-900 hover:bg-slate-100 font-bold text-base"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>

            {user.role === 'MEMBER' && member?.status === 'ACTIVE' && (
              <>
                <Link
                  href="/loans/apply"
                  className="block py-3 text-slate-900 hover:bg-slate-100 font-bold text-base"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Loans
                </Link>
                <Link
                  href="/guarantor"
                  className="block py-3 text-slate-900 hover:bg-slate-100 font-bold text-base"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Guarantor
                </Link>
              </>
            )}

            {isStaff && (
              <>
                <Link
                  href="/admin/members"
                  className="block py-3 text-slate-900 hover:bg-slate-100 font-bold text-base"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Members
                </Link>
                <Link
                  href="/admin/loans"
                  className="block py-3 text-slate-900 hover:bg-slate-100 font-bold text-base"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Loans
                </Link>
              </>
            )}

            <Link
              href="/notifications"
              className="block py-3 text-slate-900 hover:bg-slate-100 font-bold text-base"
              onClick={() => setMobileMenuOpen(false)}
            >
              Notifications
            </Link>

            <div className="pt-3 border-t border-slate-300">
              <Button
                variant="outline"
                className="w-full justify-start border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-bold py-3"
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
