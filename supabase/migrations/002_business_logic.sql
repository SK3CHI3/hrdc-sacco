-- 1. Trigger for Referral Points
CREATE OR REPLACE FUNCTION award_referral_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  referrer_id UUID;
BEGIN
  -- Only award points when status changes to ACTIVE
  IF OLD.status = 'PENDING_APPROVAL' AND NEW.status = 'ACTIVE' THEN
    -- Get points value from settings
    SELECT (value->>'value')::INTEGER INTO points_to_award 
    FROM sacco_settings WHERE key = 'referral_points_per_member';
    
    IF points_to_award IS NULL THEN points_to_award := 100; END IF;

    -- If the member was referred
    IF NEW.referred_by IS NOT NULL THEN
      -- Award points to referrer
      INSERT INTO loyalty_points (member_id, points, reason, reference_id)
      VALUES (NEW.referred_by, points_to_award, 'Referral of ' || NEW.member_number, NEW.id);
      
      -- Award points to the new member
      INSERT INTO loyalty_points (member_id, points, reason, reference_id)
      VALUES (NEW.id, points_to_award, 'Joined via referral', NEW.id);
      
      -- Update referral record
      UPDATE referrals 
      SET points_awarded = points_to_award, points_awarded_at = NOW()
      WHERE referred_member_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_referral_points
AFTER UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION award_referral_points();

-- 2. Trigger for Guarantor Commitments
CREATE OR REPLACE FUNCTION manage_guarantor_commitment()
RETURNS TRIGGER AS $$
DECLARE
  v_loan_id UUID;
  v_guarantors_required INTEGER;
  v_guarantors_approved INTEGER;
  v_loan_status loan_status;
BEGIN
  -- Determine loan ID based on operation
  IF TG_OP = 'DELETE' THEN v_loan_id := OLD.loan_id; ELSE v_loan_id := NEW.loan_id; END IF;

  -- If status changed to ACCEPTED
  IF (TG_OP = 'UPDATE' AND OLD.status != 'ACCEPTED' AND NEW.status = 'ACCEPTED') OR 
     (TG_OP = 'INSERT' AND NEW.status = 'ACCEPTED') THEN
    UPDATE members 
    SET 
      committed_balance = committed_balance + NEW.guaranteed_amount,
      available_balance = available_balance - NEW.guaranteed_amount
    WHERE id = NEW.guarantor_member_id;
    
    -- Create notification for borrower
    INSERT INTO notifications (user_id, title, message, type, reference_id)
    SELECT m.user_id, 'Guarantor Accepted', 'A member has accepted to guarantee your loan.', 'LOAN', NEW.loan_id
    FROM loans l JOIN members m ON l.member_id = m.id
    WHERE l.id = NEW.loan_id;

    -- CHECK FOR AUTO-SUBMISSION
    SELECT status, guarantors_required INTO v_loan_status, v_guarantors_required 
    FROM loans WHERE id = NEW.loan_id;
    
    SELECT COUNT(*) INTO v_guarantors_approved 
    FROM loan_guarantors WHERE loan_id = NEW.loan_id AND status = 'ACCEPTED';
    
    IF v_loan_status = 'AWAITING_GUARANTOR_APPROVAL' AND v_guarantors_approved >= v_guarantors_required THEN
      UPDATE loans SET status = 'SUBMITTED' WHERE id = NEW.loan_id;
    END IF;

  -- If status changed FROM ACCEPTED (to REJECTED or loan cancelled)
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'ACCEPTED' AND NEW.status != 'ACCEPTED') OR
        (TG_OP = 'DELETE' AND OLD.status = 'ACCEPTED') THEN
    UPDATE members 
    SET 
      committed_balance = committed_balance - OLD.guaranteed_amount,
      available_balance = available_balance + OLD.guaranteed_amount
    WHERE id = OLD.guarantor_member_id;
    
    -- Notify borrower if rejected
    IF NEW.status = 'REJECTED' THEN
      INSERT INTO notifications (user_id, title, message, type, reference_id)
      SELECT m.user_id, 'Guarantor Declined', 'A guarantor has declined your loan request.', 'LOAN', NEW.loan_id
      FROM loans l JOIN members m ON l.member_id = m.id
      WHERE l.id = NEW.loan_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_manage_guarantor_commitment
AFTER INSERT OR UPDATE OR DELETE ON loan_guarantors
FOR EACH ROW EXECUTE FUNCTION manage_guarantor_commitment();

-- 3. Automatic Notifications for Loan Status Changes
CREATE OR REPLACE FUNCTION notify_loan_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, title, message, type, reference_id)
    SELECT m.user_id, 'Loan Status Updated', 'Your loan application status has changed to ' || NEW.status, 'LOAN', NEW.id
    FROM members m WHERE m.id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_loan_status_change ON loans;
CREATE TRIGGER trigger_notify_loan_status_change
AFTER UPDATE ON loans
FOR EACH ROW EXECUTE FUNCTION notify_loan_status_change();

-- 4. Improved Member Balance Updates (Handling Withdrawals)
CREATE OR REPLACE FUNCTION update_member_balances_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle completed deposits/purchases/withdrawals
  IF NEW.payment_status = 'COMPLETED' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'COMPLETED') THEN
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
    ELSIF NEW.transaction_type = 'WITHDRAWAL' THEN
      UPDATE members 
      SET 
        total_deposits = total_deposits - NEW.amount,
        available_balance = available_balance - NEW.amount
      WHERE id = NEW.member_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_member_balances ON deposits;
CREATE TRIGGER trigger_update_member_balances
AFTER INSERT OR UPDATE ON deposits
FOR EACH ROW EXECUTE FUNCTION update_member_balances_v2();
