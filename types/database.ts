export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'CREDIT_OFFICER'
  | 'COMMITTEE_MEMBER'
  | 'MEMBER'
  | 'AUDITOR';

export type MemberStatus = 
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'INACTIVE';

export type DocumentType = 
  | 'NATIONAL_ID_FRONT'
  | 'NATIONAL_ID_BACK'
  | 'PASSPORT_PHOTO'
  | 'OTHER';

export type LoanStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'AWAITING_GUARANTOR_APPROVAL'
  | 'UNDER_CREDIT_REVIEW'
  | 'COMMITTEE_REVIEW'
  | 'APPROVED'
  | 'DISBURSED'
  | 'REJECTED'
  | 'CANCELLED';

export type GuarantorStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED';

export type TransactionType = 
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'LOAN_DISBURSEMENT'
  | 'LOAN_REPAYMENT'
  | 'SHARES_PURCHASE'
  | 'DIVIDEND';

export type PaymentMethod = 
  | 'BANK_TRANSFER'
  | 'MPESA'
  | 'CASH'
  | 'PAYSTACK';

export type PaymentStatus = 
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REVERSED';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone_number: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone_number?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone_number?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      members: {
        Row: {
          id: string;
          user_id: string;
          member_number: string;
          national_id: string;
          date_of_birth: string;
          physical_address: string | null;
          postal_address: string | null;
          occupation: string | null;
          employer: string | null;
          status: MemberStatus;
          total_shares: number;
          total_deposits: number;
          available_balance: number;
          committed_balance: number;
          referral_code: string;
          referred_by: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          member_number: string;
          national_id: string;
          date_of_birth: string;
          physical_address?: string | null;
          postal_address?: string | null;
          occupation?: string | null;
          employer?: string | null;
          status?: MemberStatus;
          total_shares?: number;
          total_deposits?: number;
          available_balance?: number;
          committed_balance?: number;
          referral_code: string;
          referred_by?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          member_number?: string;
          national_id?: string;
          date_of_birth?: string;
          physical_address?: string | null;
          postal_address?: string | null;
          occupation?: string | null;
          employer?: string | null;
          status?: MemberStatus;
          total_shares?: number;
          total_deposits?: number;
          available_balance?: number;
          committed_balance?: number;
          referral_code?: string;
          referred_by?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          member_id: string;
          document_type: DocumentType;
          file_url: string;
          file_name: string;
          file_size: number;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          document_type: DocumentType;
          file_url: string;
          file_name: string;
          file_size: number;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          document_type?: DocumentType;
          file_url?: string;
          file_name?: string;
          file_size?: number;
          uploaded_at?: string;
        };
      };
      deposits: {
        Row: {
          id: string;
          member_id: string;
          amount: number;
          transaction_type: TransactionType;
          payment_method: PaymentMethod;
          payment_reference: string | null;
          payment_status: PaymentStatus;
          description: string | null;
          recorded_by: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          amount: number;
          transaction_type: TransactionType;
          payment_method: PaymentMethod;
          payment_reference?: string | null;
          payment_status?: PaymentStatus;
          description?: string | null;
          recorded_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          amount?: number;
          transaction_type?: TransactionType;
          payment_method?: PaymentMethod;
          payment_reference?: string | null;
          payment_status?: PaymentStatus;
          description?: string | null;
          recorded_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
      };
      loans: {
        Row: {
          id: string;
          member_id: string;
          loan_number: string;
          amount: number;
          interest_rate: number;
          duration_months: number;
          monthly_repayment: number;
          total_repayment: number;
          purpose: string;
          status: LoanStatus;
          requires_guarantors: boolean;
          guarantors_required: number;
          guarantors_approved: number;
          credit_score: number | null;
          credit_officer_notes: string | null;
          committee_notes: string | null;
          reviewed_by: string | null;
          approved_by: string | null;
          disbursed_by: string | null;
          disbursed_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          loan_number: string;
          amount: number;
          interest_rate: number;
          duration_months: number;
          monthly_repayment: number;
          total_repayment: number;
          purpose: string;
          status?: LoanStatus;
          requires_guarantors?: boolean;
          guarantors_required?: number;
          guarantors_approved?: number;
          credit_score?: number | null;
          credit_officer_notes?: string | null;
          committee_notes?: string | null;
          reviewed_by?: string | null;
          approved_by?: string | null;
          disbursed_by?: string | null;
          disbursed_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          loan_number?: string;
          amount?: number;
          interest_rate?: number;
          duration_months?: number;
          monthly_repayment?: number;
          total_repayment?: number;
          purpose?: string;
          status?: LoanStatus;
          requires_guarantors?: boolean;
          guarantors_required?: number;
          guarantors_approved?: number;
          credit_score?: number | null;
          credit_officer_notes?: string | null;
          committee_notes?: string | null;
          reviewed_by?: string | null;
          approved_by?: string | null;
          disbursed_by?: string | null;
          disbursed_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      loan_guarantors: {
        Row: {
          id: string;
          loan_id: string;
          guarantor_member_id: string;
          guaranteed_amount: number;
          status: GuarantorStatus;
          requested_at: string;
          responded_at: string | null;
          response_notes: string | null;
        };
        Insert: {
          id?: string;
          loan_id: string;
          guarantor_member_id: string;
          guaranteed_amount: number;
          status?: GuarantorStatus;
          requested_at?: string;
          responded_at?: string | null;
          response_notes?: string | null;
        };
        Update: {
          id?: string;
          loan_id?: string;
          guarantor_member_id?: string;
          guaranteed_amount?: number;
          status?: GuarantorStatus;
          requested_at?: string;
          responded_at?: string | null;
          response_notes?: string | null;
        };
      };
      loan_status_history: {
        Row: {
          id: string;
          loan_id: string;
          from_status: LoanStatus | null;
          to_status: LoanStatus;
          changed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          from_status?: LoanStatus | null;
          to_status: LoanStatus;
          changed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          from_status?: LoanStatus | null;
          to_status?: LoanStatus;
          changed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      loan_repayments: {
        Row: {
          id: string;
          loan_id: string;
          amount: number;
          payment_method: PaymentMethod;
          payment_reference: string | null;
          payment_status: PaymentStatus;
          principal_amount: number;
          interest_amount: number;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          amount: number;
          payment_method: PaymentMethod;
          payment_reference?: string | null;
          payment_status?: PaymentStatus;
          principal_amount: number;
          interest_amount: number;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          amount?: number;
          payment_method?: PaymentMethod;
          payment_reference?: string | null;
          payment_status?: PaymentStatus;
          principal_amount?: number;
          interest_amount?: number;
          recorded_by?: string | null;
          created_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_member_id: string;
          referred_member_id: string;
          points_awarded: number;
          points_awarded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_member_id: string;
          referred_member_id: string;
          points_awarded?: number;
          points_awarded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_member_id?: string;
          referred_member_id?: string;
          points_awarded?: number;
          points_awarded_at?: string | null;
          created_at?: string;
        };
      };
      loyalty_points: {
        Row: {
          id: string;
          member_id: string;
          points: number;
          reason: string;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          points: number;
          reason: string;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          points?: number;
          reason?: string;
          reference_id?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          reference_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      sacco_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_member_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_loan_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_referral_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      is_admin_or_higher: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      get_current_member_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      member_status: MemberStatus;
      document_type: DocumentType;
      loan_status: LoanStatus;
      guarantor_status: GuarantorStatus;
      transaction_type: TransactionType;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
    };
  };
}
