-- HRDC SACCO Database Schema
-- Migration 001: Initial Schema Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'CREDIT_OFFICER',
  'COMMITTEE_MEMBER',
  'MEMBER',
  'AUDITOR'
);

CREATE TYPE member_status AS ENUM (
  'PENDING_APPROVAL',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE'
);

CREATE TYPE document_type AS ENUM (
  'NATIONAL_ID_FRONT',
  'NATIONAL_ID_BACK',
  'PASSPORT_PHOTO',
  'OTHER'
);

CREATE TYPE loan_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'AWAITING_GUARANTOR_APPROVAL',
  'UNDER_CREDIT_REVIEW',
  'COMMITTEE_REVIEW',
  'APPROVED',
  'DISBURSED',
  'REJECTED',
  'CANCELLED'
);

CREATE TYPE guarantor_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED'
);

CREATE TYPE transaction_type AS ENUM (
  'DEPOSIT',
  'WITHDRAWAL',
  'LOAN_DISBURSEMENT',
  'LOAN_REPAYMENT',
  'SHARES_PURCHASE',
  'DIVIDEND'
);

CREATE TYPE payment_method AS ENUM (
  'BANK_TRANSFER',
  'MPESA',
  'CASH',
  'PAYSTACK'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REVERSED'
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role user_role NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  member_number TEXT UNIQUE NOT NULL,
  national_id TEXT UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  physical_address TEXT,
  postal_address TEXT,
  occupation TEXT,
  employer TEXT,
  status member_status NOT NULL DEFAULT 'PENDING_APPROVAL',
  total_shares DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_deposits DECIMAL(15, 2) NOT NULL DEFAULT 0,
  available_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  committed_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES members(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deposits/Contributions table
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  transaction_type transaction_type NOT NULL,
  payment_method payment_method NOT NULL,
  payment_reference TEXT,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  description TEXT,
  recorded_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  loan_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  interest_rate DECIMAL(5, 2) NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  monthly_repayment DECIMAL(15, 2) NOT NULL,
  total_repayment DECIMAL(15, 2) NOT NULL,
  purpose TEXT NOT NULL,
  status loan_status NOT NULL DEFAULT 'DRAFT',
  requires_guarantors BOOLEAN NOT NULL DEFAULT false,
  guarantors_required INTEGER NOT NULL DEFAULT 0,
  guarantors_approved INTEGER NOT NULL DEFAULT 0,
  credit_score DECIMAL(5, 2),
  credit_officer_notes TEXT,
  committee_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  disbursed_by UUID REFERENCES profiles(id),
  disbursed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loan guarantors table
CREATE TABLE loan_guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  guarantor_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  guaranteed_amount DECIMAL(15, 2) NOT NULL CHECK (guaranteed_amount > 0),
  status guarantor_status NOT NULL DEFAULT 'PENDING',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  response_notes TEXT,
  UNIQUE(loan_id, guarantor_member_id)
);

-- Loan status history table
CREATE TABLE loan_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  from_status loan_status,
  to_status loan_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loan repayments table
CREATE TABLE loan_repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  payment_method payment_method NOT NULL,
  payment_reference TEXT,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  principal_amount DECIMAL(15, 2) NOT NULL,
  interest_amount DECIMAL(15, 2) NOT NULL,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  referred_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  points_awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referrer_member_id, referred_member_id)
);

-- Loyalty points table
CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SACCO settings table
CREATE TABLE sacco_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_referral_code ON members(referral_code);
CREATE INDEX idx_documents_member_id ON documents(member_id);
CREATE INDEX idx_deposits_member_id ON deposits(member_id);
CREATE INDEX idx_deposits_payment_status ON deposits(payment_status);
CREATE INDEX idx_loans_member_id ON loans(member_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loan_guarantors_loan_id ON loan_guarantors(loan_id);
CREATE INDEX idx_loan_guarantors_guarantor_member_id ON loan_guarantors(guarantor_member_id);
CREATE INDEX idx_loan_guarantors_status ON loan_guarantors(status);
CREATE INDEX idx_loan_status_history_loan_id ON loan_status_history(loan_id);
CREATE INDEX idx_loan_repayments_loan_id ON loan_repayments(loan_id);
CREATE INDEX idx_referrals_referrer_member_id ON referrals(referrer_member_id);
CREATE INDEX idx_loyalty_points_member_id ON loyalty_points(member_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique member number
CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM members;
  new_number := 'HRDC' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique loan number
CREATE OR REPLACE FUNCTION generate_loan_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM loans;
  new_number := 'LN' || TO_CHAR(NOW(), 'YYYY') || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update member balances
CREATE OR REPLACE FUNCTION update_member_balances()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'COMPLETED' THEN
    IF NEW.transaction_type = 'DEPOSIT' THEN
      UPDATE members 
      SET 
        total_deposits = total_deposits + NEW.amount,
        available_balance = available_balance + NEW.amount
      WHERE id = NEW.member_id;
    ELSIF NEW.transaction_type = 'SHARES_PURCHASE' THEN
      UPDATE members 
      SET 
        total_shares = total_shares + NEW.amount,
        available_balance = available_balance + NEW.amount
      WHERE id = NEW.member_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_balances
AFTER INSERT OR UPDATE ON deposits
FOR EACH ROW EXECUTE FUNCTION update_member_balances();

-- Function to log loan status changes
CREATE OR REPLACE FUNCTION log_loan_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO loan_status_history (loan_id, from_status, to_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.reviewed_by, 
            CASE 
              WHEN NEW.status = 'REJECTED' THEN NEW.rejection_reason
              ELSE NULL
            END);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_loan_status_change
AFTER UPDATE ON loans
FOR EACH ROW EXECUTE FUNCTION log_loan_status_change();

-- Function to update guarantor count
CREATE OR REPLACE FUNCTION update_guarantor_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE loans 
    SET guarantors_approved = (
      SELECT COUNT(*) 
      FROM loan_guarantors 
      WHERE loan_id = NEW.loan_id AND status = 'ACCEPTED'
    )
    WHERE id = NEW.loan_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_guarantor_count
AFTER INSERT OR UPDATE ON loan_guarantors
FOR EACH ROW EXECUTE FUNCTION update_guarantor_count();

-- Insert default SACCO settings
INSERT INTO sacco_settings (key, value, description) VALUES
  ('max_loan_amount', '5000000', 'Maximum loan amount in KES'),
  ('min_loan_amount', '10000', 'Minimum loan amount in KES'),
  ('default_interest_rate', '12', 'Default annual interest rate percentage'),
  ('max_loan_duration_months', '60', 'Maximum loan duration in months'),
  ('min_loan_duration_months', '3', 'Minimum loan duration in months'),
  ('guarantor_threshold_multiplier', '1', 'Multiplier for guarantor requirement threshold'),
  ('referral_points_per_member', '100', 'Points awarded per successful referral'),
  ('min_shares_for_loan', '5000', 'Minimum shares required to apply for loan'),
  ('max_guarantor_commitment_percentage', '50', 'Maximum percentage of balance a member can commit as guarantor');
