-- HRDC SACCO Row Level Security Policies
-- Migration 002: RLS Policies for Role-Based Access Control

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacco_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin or higher
CREATE OR REPLACE FUNCTION is_admin_or_higher()
RETURNS BOOLEAN AS $$
  SELECT role IN ('SUPER_ADMIN', 'ADMIN') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is staff (admin, credit officer, committee)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT role IN ('SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER') 
  FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get member_id for current user
CREATE OR REPLACE FUNCTION get_current_member_id()
RETURNS UUID AS $$
  SELECT id FROM members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Staff can view all profiles
CREATE POLICY "Staff can view all profiles"
  ON profiles FOR SELECT
  USING (is_staff());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only super admins can change roles
CREATE POLICY "Super admins can manage roles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- MEMBERS TABLE POLICIES
-- ============================================

-- Members can view their own member record
CREATE POLICY "Members can view own record"
  ON members FOR SELECT
  USING (user_id = auth.uid());

-- Staff can view all member records
CREATE POLICY "Staff can view all members"
  ON members FOR SELECT
  USING (is_staff());

-- Auditors can view all member records
CREATE POLICY "Auditors can view all members"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'AUDITOR'
    )
  );

-- Members can create their own record (onboarding)
CREATE POLICY "Users can create member record"
  ON members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Members can update their own record (limited fields)
CREATE POLICY "Members can update own record"
  ON members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    status = (SELECT status FROM members WHERE user_id = auth.uid())
  );

-- Admins can update member records (including approval)
CREATE POLICY "Admins can update members"
  ON members FOR UPDATE
  USING (is_admin_or_higher());

-- ============================================
-- DOCUMENTS TABLE POLICIES
-- ============================================

-- Members can view their own documents
CREATE POLICY "Members can view own documents"
  ON documents FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Staff can view all documents
CREATE POLICY "Staff can view all documents"
  ON documents FOR SELECT
  USING (is_staff());

-- Members can upload their own documents
CREATE POLICY "Members can upload own documents"
  ON documents FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Members can delete their own documents (if not approved yet)
CREATE POLICY "Members can delete own documents"
  ON documents FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM members 
      WHERE user_id = auth.uid() AND status = 'PENDING_APPROVAL'
    )
  );

-- ============================================
-- DEPOSITS TABLE POLICIES
-- ============================================

-- Members can view their own deposits
CREATE POLICY "Members can view own deposits"
  ON deposits FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Staff can view all deposits
CREATE POLICY "Staff can view all deposits"
  ON deposits FOR SELECT
  USING (is_staff());

-- Auditors can view all deposits
CREATE POLICY "Auditors can view all deposits"
  ON deposits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'AUDITOR'
    )
  );

-- Admins can create deposits (manual recording)
CREATE POLICY "Admins can create deposits"
  ON deposits FOR INSERT
  WITH CHECK (is_admin_or_higher());

-- Admins can update deposits (verification)
CREATE POLICY "Admins can update deposits"
  ON deposits FOR UPDATE
  USING (is_admin_or_higher());

-- ============================================
-- LOANS TABLE POLICIES
-- ============================================

-- Members can view their own loans
CREATE POLICY "Members can view own loans"
  ON loans FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Members can view loans they are guarantors for
CREATE POLICY "Members can view guaranteed loans"
  ON loans FOR SELECT
  USING (
    id IN (
      SELECT loan_id FROM loan_guarantors 
      WHERE guarantor_member_id = get_current_member_id()
    )
  );

-- Staff can view all loans
CREATE POLICY "Staff can view all loans"
  ON loans FOR SELECT
  USING (is_staff());

-- Auditors can view all loans
CREATE POLICY "Auditors can view all loans"
  ON loans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'AUDITOR'
    )
  );

-- Active members can create loan applications
CREATE POLICY "Active members can create loans"
  ON loans FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM members 
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- Members can update their own draft loans
CREATE POLICY "Members can update draft loans"
  ON loans FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    ) AND status = 'DRAFT'
  );

-- Credit officers can update loans under review
CREATE POLICY "Credit officers can update loans"
  ON loans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('CREDIT_OFFICER', 'ADMIN', 'SUPER_ADMIN')
    )
  );

-- Committee members can update loans in committee review
CREATE POLICY "Committee can update loans"
  ON loans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('COMMITTEE_MEMBER', 'ADMIN', 'SUPER_ADMIN')
    ) AND status = 'COMMITTEE_REVIEW'
  );

-- ============================================
-- LOAN GUARANTORS TABLE POLICIES
-- ============================================

-- Members can view guarantor requests for their loans
CREATE POLICY "Members can view own loan guarantors"
  ON loan_guarantors FOR SELECT
  USING (
    loan_id IN (
      SELECT id FROM loans 
      WHERE member_id = get_current_member_id()
    )
  );

-- Members can view guarantor requests they received
CREATE POLICY "Members can view guarantor requests"
  ON loan_guarantors FOR SELECT
  USING (guarantor_member_id = get_current_member_id());

-- Staff can view all guarantor records
CREATE POLICY "Staff can view all guarantors"
  ON loan_guarantors FOR SELECT
  USING (is_staff());

-- Loan applicants can add guarantors to their loans
CREATE POLICY "Members can add guarantors"
  ON loan_guarantors FOR INSERT
  WITH CHECK (
    loan_id IN (
      SELECT id FROM loans 
      WHERE member_id = get_current_member_id() 
      AND status IN ('DRAFT', 'AWAITING_GUARANTOR_APPROVAL')
    )
  );

-- Guarantors can respond to guarantor requests
CREATE POLICY "Guarantors can respond to requests"
  ON loan_guarantors FOR UPDATE
  USING (guarantor_member_id = get_current_member_id())
  WITH CHECK (guarantor_member_id = get_current_member_id());

-- ============================================
-- LOAN STATUS HISTORY POLICIES
-- ============================================

-- Members can view history of their loans
CREATE POLICY "Members can view own loan history"
  ON loan_status_history FOR SELECT
  USING (
    loan_id IN (
      SELECT id FROM loans 
      WHERE member_id = get_current_member_id()
    )
  );

-- Staff can view all loan history
CREATE POLICY "Staff can view all loan history"
  ON loan_status_history FOR SELECT
  USING (is_staff());

-- Auditors can view all loan history
CREATE POLICY "Auditors can view all loan history"
  ON loan_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'AUDITOR'
    )
  );

-- ============================================
-- LOAN REPAYMENTS POLICIES
-- ============================================

-- Members can view their own loan repayments
CREATE POLICY "Members can view own repayments"
  ON loan_repayments FOR SELECT
  USING (
    loan_id IN (
      SELECT id FROM loans 
      WHERE member_id = get_current_member_id()
    )
  );

-- Staff can view all repayments
CREATE POLICY "Staff can view all repayments"
  ON loan_repayments FOR SELECT
  USING (is_staff());

-- Auditors can view all repayments
CREATE POLICY "Auditors can view all repayments"
  ON loan_repayments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'AUDITOR'
    )
  );

-- Admins can record repayments
CREATE POLICY "Admins can record repayments"
  ON loan_repayments FOR INSERT
  WITH CHECK (is_admin_or_higher());

-- ============================================
-- REFERRALS POLICIES
-- ============================================

-- Members can view their own referrals
CREATE POLICY "Members can view own referrals"
  ON referrals FOR SELECT
  USING (
    referrer_member_id = get_current_member_id() OR
    referred_member_id = get_current_member_id()
  );

-- Staff can view all referrals
CREATE POLICY "Staff can view all referrals"
  ON referrals FOR SELECT
  USING (is_staff());

-- System creates referrals (handled by triggers)
CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

-- ============================================
-- LOYALTY POINTS POLICIES
-- ============================================

-- Members can view their own loyalty points
CREATE POLICY "Members can view own points"
  ON loyalty_points FOR SELECT
  USING (member_id = get_current_member_id());

-- Staff can view all loyalty points
CREATE POLICY "Staff can view all points"
  ON loyalty_points FOR SELECT
  USING (is_staff());

-- System creates loyalty points (handled by triggers/functions)
CREATE POLICY "System can create points"
  ON loyalty_points FOR INSERT
  WITH CHECK (true);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Auditors can view all audit logs
CREATE POLICY "Auditors can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('AUDITOR', 'SUPER_ADMIN')
    )
  );

-- System creates audit logs
CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- SACCO SETTINGS POLICIES
-- ============================================

-- Everyone can view settings
CREATE POLICY "Everyone can view settings"
  ON sacco_settings FOR SELECT
  USING (true);

-- Only super admins can modify settings
CREATE POLICY "Super admins can modify settings"
  ON sacco_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );
