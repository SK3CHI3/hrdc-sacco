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
    DRAFT: 'bg-muted text-muted-foreground border-border',
    SUBMITTED: 'bg-primary/10 text-primary border-primary/20',
    AWAITING_GUARANTOR_APPROVAL: 'bg-warning/10 text-warning border-warning/20',
    UNDER_CREDIT_REVIEW: 'bg-blue-100 text-blue-700 border-blue-200',
    COMMITTEE_REVIEW: 'bg-purple-100 text-purple-700 border-purple-200',
    APPROVED: 'bg-success/10 text-success border-success/20',
    DISBURSED: 'bg-success/20 text-success border-success/30 font-bold',
    REJECTED: 'bg-error/10 text-error border-error/20',
    CANCELLED: 'bg-muted text-muted-foreground border-border',
  };
  return colors[status] || 'bg-muted text-muted-foreground border-border';
}

export function getMemberStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING_APPROVAL: 'bg-warning/10 text-warning border-warning/20',
    ACTIVE: 'bg-success/10 text-success border-success/20',
    SUSPENDED: 'bg-error/10 text-error border-error/20',
    INACTIVE: 'bg-muted text-muted-foreground border-border',
  };
  return colors[status] || 'bg-muted text-muted-foreground border-border';
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-warning/10 text-warning border-warning/20',
    COMPLETED: 'bg-success/10 text-success border-success/20',
    FAILED: 'bg-error/10 text-error border-error/20',
    REVERSED: 'bg-orange-100 text-orange-700 border-orange-200',
  };
  return colors[status] || 'bg-muted text-muted-foreground border-border';
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
