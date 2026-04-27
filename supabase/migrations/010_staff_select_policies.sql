-- Comprehensive RLS Fix for Staff Visibility
-- Migration 010: Ensure Staff/Admins can see all data required for the dashboard

-- 1. Fix Profiles Visibility
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
CREATE POLICY "Staff can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER', 'AUDITOR')
    )
    OR id = auth.uid()
  );

-- 2. Fix Members Visibility
DROP POLICY IF EXISTS "Staff can view all members" ON members;
CREATE POLICY "Staff can view all members"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER', 'AUDITOR')
    )
    OR user_id = auth.uid()
  );

-- 3. Fix Loans Visibility
DROP POLICY IF EXISTS "Staff can view all loans" ON loans;
CREATE POLICY "Staff can view all loans"
  ON loans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER', 'AUDITOR')
    )
    OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

-- 4. Fix Deposits Visibility
DROP POLICY IF EXISTS "Staff can view all deposits" ON deposits;
CREATE POLICY "Staff can view all deposits"
  ON deposits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER', 'AUDITOR')
    )
    OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

-- 5. Fix Loan Status History Visibility
DROP POLICY IF EXISTS "Staff can view all loan history" ON loan_status_history;
CREATE POLICY "Staff can view all loan history"
  ON loan_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER', 'AUDITOR')
    )
    OR is_member_loan_owner(loan_id, (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1))
  );
