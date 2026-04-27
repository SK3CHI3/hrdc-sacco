-- Fix Notification Trigger Security
-- Migration 009: Make notify_loan_status_change SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, title, message, type, reference_id)
    SELECT m.user_id, 'Loan Status Updated', 'Your loan application status has changed to ' || NEW.status, 'LOAN', NEW.id
    FROM members m WHERE m.id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$;
