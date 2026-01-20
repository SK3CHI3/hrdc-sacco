-- Fix RLS Infinite Recursion in Profiles Table
-- Migration 003: Fix circular dependency in RLS policies

-- Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON profiles;

-- Drop helper functions that cause recursion (CASCADE removes dependent policies)
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin_or_higher() CASCADE;
DROP FUNCTION IF EXISTS is_staff() CASCADE;

-- ============================================
-- PROFILES TABLE POLICIES (Fixed)
-- ============================================

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Staff can view all profiles (direct role check to avoid recursion)
CREATE POLICY "Staff can view all profiles"
  ON profiles FOR SELECT
  USING (
    role IN ('SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER', 'AUDITOR')
  );

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Only super admins can update any profile including roles
CREATE POLICY "Super admins can manage all profiles"
  ON profiles FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
  );

-- Only super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
  );

-- ============================================
-- RECREATE HELPER FUNCTIONS (Non-recursive)
-- ============================================

-- Helper function to get current user's role (uses SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1),
    'MEMBER'::user_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin or higher
CREATE OR REPLACE FUNCTION is_admin_or_higher()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role IN ('SUPER_ADMIN', 'ADMIN') FROM profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role IN ('SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER') 
     FROM profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_higher() TO authenticated;
GRANT EXECUTE ON FUNCTION is_staff() TO authenticated;

-- ============================================
-- RECREATE POLICIES THAT WERE DROPPED BY CASCADE
-- ============================================

-- MEMBERS TABLE
CREATE POLICY "Staff can view all members"
  ON members FOR SELECT
  USING (is_staff());

CREATE POLICY "Admins can update members"
  ON members FOR UPDATE
  USING (is_admin_or_higher());

-- DEPOSITS TABLE
CREATE POLICY "Staff can view all deposits"
  ON deposits FOR SELECT
  USING (is_staff());

CREATE POLICY "Admins can create deposits"
  ON deposits FOR INSERT
  WITH CHECK (is_admin_or_higher());

CREATE POLICY "Admins can update deposits"
  ON deposits FOR UPDATE
  USING (is_admin_or_higher());

-- LOANS TABLE
CREATE POLICY "Staff can view all loans"
  ON loans FOR SELECT
  USING (is_staff());

-- LOAN GUARANTORS TABLE
CREATE POLICY "Staff can view all guarantors"
  ON loan_guarantors FOR SELECT
  USING (is_staff());

-- LOAN STATUS HISTORY TABLE
CREATE POLICY "Staff can view all loan history"
  ON loan_status_history FOR SELECT
  USING (is_staff());

-- LOAN REPAYMENTS TABLE
CREATE POLICY "Staff can view all repayments"
  ON loan_repayments FOR SELECT
  USING (is_staff());

CREATE POLICY "Admins can record repayments"
  ON loan_repayments FOR INSERT
  WITH CHECK (is_admin_or_higher());

-- REFERRALS TABLE
CREATE POLICY "Staff can view all referrals"
  ON referrals FOR SELECT
  USING (is_staff());

-- LOYALTY POINTS TABLE
CREATE POLICY "Staff can view all points"
  ON loyalty_points FOR SELECT
  USING (is_staff());
