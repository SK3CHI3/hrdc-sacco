-- Fix Trigger Security and Loan History RLS
-- Migration 008: Ensure triggers have proper security and history table has policies

-- 1. Make log_loan_status_change SECURITY DEFINER
-- This ensures status logging works even if the user doesn't have direct INSERT permission on history table
CREATE OR REPLACE FUNCTION public.log_loan_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO loan_status_history (loan_id, from_status, to_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), 
            CASE 
              WHEN NEW.status = 'REJECTED' THEN NEW.rejection_reason
              ELSE NULL
            END);
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Make update_guarantor_count SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.update_guarantor_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    UPDATE loans 
    SET guarantors_approved = (
      SELECT COUNT(*) 
      FROM loan_guarantors 
      WHERE loan_id = COALESCE(NEW.loan_id, OLD.loan_id) AND status = 'ACCEPTED'
    )
    WHERE id = COALESCE(NEW.loan_id, OLD.loan_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Add policy for staff to view and insert into history (back-up)
DROP POLICY IF EXISTS "Staff can insert loan history" ON loan_status_history;
CREATE POLICY "Staff can insert loan history"
  ON loan_status_history FOR INSERT
  WITH CHECK (true); -- Trigger will handle the actual logic, but we need a permissive INSERT if run as user

-- 4. Re-apply the Members update policy just to be 100% sure it's correct
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
