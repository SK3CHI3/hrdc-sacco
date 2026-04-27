-- Fix User Profiles and Loan Submission Workflows
-- Migration 007: Backfill missing profiles and fix RLS policies

-- 1. Backfill missing profiles from auth.users
-- This ensures all existing users show up in the Admin Member dashboards
INSERT INTO public.profiles (id, email, full_name, phone_number, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', ''), 
  COALESCE(raw_user_meta_data->>'phone_number', ''),
  'MEMBER'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Fix Loan Submission RLS Policy
-- The previous policy blocked status changes from DRAFT to SUBMITTED
DROP POLICY IF EXISTS "Members can update draft loans" ON loans;

CREATE POLICY "Members can update draft loans"
  ON loans FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    ) AND status = 'DRAFT'
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    ) AND status IN ('DRAFT', 'SUBMITTED', 'AWAITING_GUARANTOR_APPROVAL')
  );

-- 3. Add Missing Deposits RLS Policy
-- Allows members to request withdrawals and deposits
DROP POLICY IF EXISTS "Members can create deposits" ON deposits;

CREATE POLICY "Members can create deposits"
  ON deposits FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- 4. Ensure Profile Trigger is robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone_number', ''),
    'MEMBER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
