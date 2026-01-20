import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function calculateLoanRepayment(
  principal: number,
  annualRate: number,
  months: number
): { monthlyPayment: number; totalRepayment: number; totalInterest: number } {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = 
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  
  const totalRepayment = monthlyPayment * months;
  const totalInterest = totalRepayment - principal;

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
  };
}

export function getLoanStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    AWAITING_GUARANTOR_APPROVAL: 'bg-yellow-100 text-yellow-700',
    UNDER_CREDIT_REVIEW: 'bg-indigo-100 text-indigo-700',
    COMMITTEE_REVIEW: 'bg-purple-100 text-purple-700',
    APPROVED: 'bg-green-100 text-green-700',
    DISBURSED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getMemberStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
    ACTIVE: 'bg-green-100 text-green-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    INACTIVE: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    REVERSED: 'bg-orange-100 text-orange-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function formatLoanStatus(status: string): string {
  return status.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
}

export function formatMemberStatus(status: string): string {
  return status.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
}
