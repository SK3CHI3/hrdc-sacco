-- Fix RLS Infinite Recursion in Loans and Loan Guarantors
-- Migration 006: Fix circular dependency between loans and loan_guarantors

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view guaranteed loans" ON loans;
DROP POLICY IF EXISTS "Members can view own loan guarantors" ON loan_guarantors;

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================

-- Check if a member is a guarantor for a specific loan
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
CREATE OR REPLACE FUNCTION is_member_loan_guarantor(l_id UUID, m_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM loan_guarantors 
    WHERE loan_id = l_id AND guarantor_member_id = m_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if a member is the owner of a specific loan
CREATE OR REPLACE FUNCTION is_member_loan_owner(l_id UUID, m_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM loans 
    WHERE id = l_id AND member_id = m_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_member_loan_guarantor(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_member_loan_owner(UUID, UUID) TO authenticated;

-- ============================================
-- FIXED POLICIES
-- ============================================

-- Loans: Members can view loans they are guarantors for
CREATE POLICY "Members can view guaranteed loans"
  ON loans FOR SELECT
  USING (
    is_member_loan_guarantor(id, get_current_member_id())
  );

-- Loan Guarantors: Members can view guarantor records for their own loans
CREATE POLICY "Members can view own loan guarantors"
  ON loan_guarantors FOR SELECT
  USING (
    is_member_loan_owner(loan_id, get_current_member_id())
  );

-- Double check if there are other cross-references
-- loan_status_history, loan_repayments also reference loans

DROP POLICY IF EXISTS "Members can view own loan history" ON loan_status_history;
CREATE POLICY "Members can view own loan history"
  ON loan_status_history FOR SELECT
  USING (
    is_member_loan_owner(loan_id, get_current_member_id())
  );

DROP POLICY IF EXISTS "Members can view own repayments" ON loan_repayments;
CREATE POLICY "Members can view own repayments"
  ON loan_repayments FOR SELECT
  USING (
    is_member_loan_owner(loan_id, get_current_member_id())
  );
