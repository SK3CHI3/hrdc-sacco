-- Fix RLS Recursion and Auditor Access
-- Migration 011: Use SECURITY DEFINER helper functions to avoid infinite recursion

-- 1. Update is_staff() to include AUDITOR
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER', 'AUDITOR')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix Profiles Visibility (Use is_staff() to avoid recursion)
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_staff() OR auth.uid() = id);

-- 3. Fix Members Visibility
DROP POLICY IF EXISTS "Staff can view all members" ON public.members;
CREATE POLICY "Staff can view all members"
  ON public.members FOR SELECT
  USING (is_staff() OR user_id = auth.uid());

-- 4. Fix Loans Visibility
DROP POLICY IF EXISTS "Staff can view all loans" ON public.loans;
CREATE POLICY "Staff can view all loans"
  ON public.loans FOR SELECT
  USING (is_staff() OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- 5. Fix Deposits Visibility
DROP POLICY IF EXISTS "Staff can view all deposits" ON public.deposits;
CREATE POLICY "Staff can view all deposits"
  ON public.deposits FOR SELECT
  USING (is_staff() OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- 6. Fix Loan Status History Visibility
DROP POLICY IF EXISTS "Staff can view all loan history" ON public.loan_status_history;
CREATE POLICY "Staff can view all loan history"
  ON public.loan_status_history FOR SELECT
  USING (is_staff() OR is_member_loan_owner(loan_id, (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1)));
