# 🇰🇪 Kopa SACCO — Roles & Dashboards Reference

This document maps out the formal role-based management structure for the Kopa SACCO platform, aligning our digital operations with standard Kenyan SACCO practices and SASRA regulatory expectations.

## 1. The Core Ecosystem

Kopa SACCO operates primarily as a **BOSA (Back Office Service Activity)**. The system is designed to handle members' monthly share contributions, deposits, and loan processing. The core concept is **"Save to Borrow"** — members build share capital and borrow against it, using other members as guarantors.

## 2. Role-Based Access & Dashboard Architecture

To ensure separation of duties and proper governance, the platform uses 6 distinct roles. Each role has a purpose-built dashboard.

### 👤 MEMBER (The Co-owner)
- **Real-World Equivalent**: A registered SACCO shareholder.
- **System Responsibilities**: Make monthly contributions, apply for loans, guarantee other members, track savings growth.
- **Dashboard View**: 
  - Subdued, clean summary of their Share Capital, Deposits, and Available Loan Limit.
  - Quick action buttons (Apply for Loan, Guarantee Requests, Withdrawals).
  - Clear alerts for pending applications or pending guarantor requests.

### 👑 SUPER_ADMIN (The Command Center)
- **Real-World Equivalent**: CEO / Chairman of the Board.
- **System Responsibilities**: Full oversight of the entire SACCO's health, user management, and system-wide settings.
- **Dashboard View**: 
  - Top-level KPIs: Total Assets, Total Members, Outstanding Loan Book.
  - SACCO Health Overview (Net Worth, Loan-to-Deposit Ratio for SASRA compliance).
  - Full system management access points (can manage ANY entity in the DB).

### ⚙️ ADMIN (The Operations Hub)
- **Real-World Equivalent**: Operations Manager / Branch Manager / Tellers.
- **System Responsibilities**: Day-to-day operations, processing new member registrations, verifying deposits, handling withdrawals.
- **Dashboard View**:
  - Operational KPIs: Pending Approvals, Today's Deposits, Pending Withdrawals.
  - Prominent list of pending member approvals for quick action.
  - Recent deposit activity feed.

### 💰 CREDIT_OFFICER (The Loan Pipeline)
- **Real-World Equivalent**: Loan Officer / Credit Manager.
- **System Responsibilities**: Appraising loan applications, assessing borrower risk, tracking defaulters, managing disbursements.
- **Dashboard View**:
  - Visual Pipeline: Submitted → Credit Review → Guarantors → Approved.
  - Actionable alerts for Overdue Loans.
  - List of recent applications needing credit review.

### 🏛️ COMMITTEE_MEMBER (The Governance View)
- **Real-World Equivalent**: Elected Credit Committee Member.
- **System Responsibilities**: Reviewing and voting on high-value loans that exceed standard limits, monitoring overall portfolio health.
- **Dashboard View**:
  - The "Committee Inbox" — a focused list of high-value loans awaiting a vote.
  - Portfolio Quality metrics (Performing vs. Non-Performing loans).
  - Target tracking (e.g., maintaining >95% performing loans).

### 🔍 AUDITOR (The Oversight View)
- **Real-World Equivalent**: Elected Supervisory Committee.
- **System Responsibilities**: Independent oversight, verifying financial accuracy, ensuring policy compliance.
- **Dashboard View**:
  - **100% Read-Only**. They cannot modify records, approve loans, or process funds.
  - Real-time Audit Trail (logs of who did what, when).
  - SASRA compliance indicators (e.g., Loan-to-Deposit ratio warnings).

## 3. UI/UX Philosophy

The dashboards have been recently retouched to reflect a **premium, unified, and subtle aesthetic**:
- **No Rainbow Colors**: We removed overly vibrant backgrounds and colored borders.
- **Uniformity**: All staff cards use a consistent `card-premium` utility class with subtle shadowing.
- **Muted Icons**: System icons use `muted-foreground` rather than stark primary colors to keep the interface looking professional and data-focused.
- **Typography**: `Outfit` is used for bold, legible headings, while `Inter` handles the dense data grids.

This architecture ensures Kopa SACCO remains compliant, secure, and incredibly easy to use for all stakeholders.
