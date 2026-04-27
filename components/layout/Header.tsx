'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Bell, LogOut, User, Shield, ChevronDown } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/lib/hooks/useUser';

// Role display names mapped to Kenyan SACCO titles
const ROLE_TITLES: Record<string, string> = {
  SUPER_ADMIN: 'Chief Executive',
  ADMIN: 'Operations Manager',
  CREDIT_OFFICER: 'Credit Officer',
  COMMITTEE_MEMBER: 'Committee Member',
  MEMBER: 'Member',
  AUDITOR: 'Auditor',
};

// Role badge colors
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  CREDIT_OFFICER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMMITTEE_MEMBER: 'bg-amber-100 text-amber-800 border-amber-200',
  MEMBER: 'bg-slate-100 text-slate-800 border-slate-200',
  AUDITOR: 'bg-rose-100 text-rose-800 border-rose-200',
};

// Navigation links per role
function getNavLinks(role: string, memberStatus?: string) {
  const base = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/advisor', label: 'AI Advisor' }
  ];

  switch (role) {
    case 'MEMBER':
      if (memberStatus !== 'ACTIVE') return base;
      return [
        ...base,
        { href: '/loans', label: 'My Loans' },
        { href: '/guarantor', label: 'Guarantor' },
        { href: '/withdrawals', label: 'Withdrawals' },
        { href: '/referrals', label: 'Referrals' },
      ];

    case 'SUPER_ADMIN':
      return [
        ...base,
        { href: '/admin/members', label: 'Members' },
        { href: '/admin/loans', label: 'All Loans' },
        { href: '/admin/deposits', label: 'Deposits' },
      ];

    case 'ADMIN':
      return [
        ...base,
        { href: '/admin/members', label: 'Members' },
        { href: '/admin/deposits', label: 'Deposits' },
        { href: '/admin/loans', label: 'Loans' },
      ];

    case 'CREDIT_OFFICER':
      return [
        ...base,
        { href: '/admin/loans', label: 'Loan Pipeline' },
        { href: '/admin/members', label: 'Members' },
        { href: '/admin/deposits', label: 'Deposits' },
      ];

    case 'COMMITTEE_MEMBER':
      return [
        ...base,
        { href: '/admin/loans', label: 'Committee Loans' },
        { href: '/admin/members', label: 'Members' },
      ];

    case 'AUDITOR':
      return [
        ...base,
        { href: '/admin/members', label: 'Members' },
        { href: '/admin/loans', label: 'Loan Reports' },
        { href: '/admin/deposits', label: 'Transactions' },
      ];

    default:
      return base;
  }
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, member } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (!user) return null;

  const navLinks = getNavLinks(user.role, member?.status);
  const roleTitle = ROLE_TITLES[user.role] || user.role;
  const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.MEMBER;

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <span className="text-white font-black text-base">KS</span>
              </div>
              <span className="font-display font-black text-2xl text-foreground tracking-tighter">KOPA SACCO</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-muted hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/notifications">
              <Button variant="outline" size="icon" className="relative border-2 border-border hover:border-primary hover:bg-primary/5">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </Button>
            </Link>

            <div className="flex items-center space-x-3 border-l border-border pl-3">
              <div className="text-right">
                <p className="text-sm font-bold text-foreground leading-tight">{user.full_name}</p>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-bold ${roleColor}`}>
                  {roleTitle}
                </Badge>
              </div>
              <Button variant="outline" size="icon" onClick={handleSignOut} className="border-2 border-error/30 hover:bg-error hover:text-white hover:border-error transition-all">
                <LogOut className="h-5 w-5 text-error" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {/* User Info */}
            <div className="flex items-center space-x-3 pb-4 mb-2 border-b border-border">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{user.full_name}</p>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-bold ${roleColor}`}>
                  {roleTitle}
                </Badge>
              </div>
            </div>

            {/* Nav Links */}
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block py-3 px-4 rounded-lg font-bold text-base transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Notifications */}
            <Link
              href="/notifications"
              className="block py-3 px-4 rounded-lg text-foreground hover:bg-muted font-bold text-base"
              onClick={() => setMobileMenuOpen(false)}
            >
              Notifications
            </Link>

            {/* Sign Out */}
            <div className="pt-3 mt-2 border-t border-border">
              <Button
                variant="outline"
                className="w-full justify-start border-2 border-error text-error hover:bg-error hover:text-white font-bold py-3"
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
