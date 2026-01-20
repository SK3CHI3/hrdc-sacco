# HRDC SACCO Management System

A modern, ethical, and professional SACCO (Savings and Credit Cooperative) management system built for Kenyan Cooperative Societies.

## 🎯 Overview

HRDC SACCO is a comprehensive digital platform designed to streamline SACCO operations, reduce paperwork, and provide members with easy access to savings and loan services. Built with trust, transparency, and user experience at its core.

## ✨ Key Features

### For Members
- **Digital Onboarding** - Complete registration with document upload
- **Savings Management** - Track shares and deposits in real-time
- **Loan Applications** - Apply for loans with automatic eligibility checks
- **Guarantor System** - Digital guarantor requests and approvals
- **Referral Program** - Earn loyalty points by inviting new members
- **Real-time Notifications** - Stay updated on all activities
- **Mobile Responsive** - Access from any device

### For Administrators
- **Member Approval Workflow** - Review and approve new members
- **Loan Management** - Process and track loan applications
- **Deposit Recording** - Manual and automated deposit tracking
- **Comprehensive Reports** - Financial and operational insights
- **Role-Based Access Control** - Super Admin, Admin, Credit Officer, Committee Member, Auditor
- **Audit Logs** - Complete transparency and compliance

### Smart Loan System
- **Automatic Eligibility Calculation** - Based on savings balance
- **Dynamic Guarantor Requirements** - Only required when loan exceeds savings
- **Loan Calculator** - Real-time repayment calculations
- **Multi-stage Approval** - Credit review and committee approval
- **Status Tracking** - Clear visibility of loan progress

## 🏗️ Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Payments**: Paystack integration ready (M-Pesa + Bank transfers)
- **UI Components**: Custom components with professional fintech styling
- **Authentication**: Supabase Auth with email/password

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account (free tier works)
- Git

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd "HRDC SACCO/hrdc-sacco"
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
3. Create storage bucket: `member-documents` (public)
4. Get your API keys from Settings → API

### 3. Configure Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📖 Detailed Setup

For complete setup instructions including:
- Database configuration
- Storage policies
- Creating super admin
- SACCO settings configuration
- Production deployment

See **[SETUP.md](./SETUP.md)** for the full guide.

## 🗂️ Project Structure

```
hrdc-sacco/
├── app/                      # Next.js app directory
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # Main dashboard
│   ├── onboarding/          # Member onboarding
│   ├── loans/               # Loan management
│   ├── guarantor/           # Guarantor requests
│   ├── admin/               # Admin panels
│   └── api/                 # API routes
├── components/              # React components
│   ├── ui/                  # UI components
│   └── layout/              # Layout components
├── lib/                     # Utilities and helpers
│   ├── supabase/           # Supabase clients
│   ├── hooks/              # Custom React hooks
│   └── utils.ts            # Utility functions
├── types/                   # TypeScript definitions
├── supabase/               # Database migrations
│   └── migrations/         # SQL migration files
└── public/                 # Static assets
```

## 👥 User Roles

1. **Super Admin** - Full system access, can create other admins
2. **Admin** - Approve members, manage loans and deposits
3. **Credit Officer** - Review and score loan applications
4. **Committee Member** - Approve high-value loans
5. **Member** - Apply for loans, save, act as guarantor
6. **Auditor** - Read-only access to all records

## 🔐 Security Features

- Row-Level Security (RLS) on all database tables
- Role-based access control (RBAC)
- Secure file storage with access policies
- Audit logging for all critical operations
- No dark patterns or deceptive UX
- Transparent loan calculations and terms

## 💰 Loan System Logic

### Eligibility Rules
- Loan amount ≤ Available balance → **No guarantors required**
- Loan amount > Available balance → **Guarantors required**

### Guarantor Requirements
- Number of guarantors = ceil((Loan Amount - Available Balance) / 100,000)
- Guarantors must have sufficient uncommitted balance
- All guarantors must explicitly accept
- Digital audit trail maintained

### Loan Workflow
1. **Draft** - Member creates application
2. **Submitted** - All requirements met
3. **Awaiting Guarantor Approval** - Pending guarantor responses
4. **Under Credit Review** - Credit officer evaluation
5. **Committee Review** - For high-value loans
6. **Approved** - Ready for disbursement
7. **Disbursed** - Funds released
8. **Rejected** - Application declined

## 🎨 Design Principles

- **No purple colors** - Professional fintech palette
- **Neutral tones** - Slate, gray, blue-gray, soft green
- **Clear typography** - Legible for all age groups
- **Mobile-first** - Responsive on all devices
- **Trustworthy** - No flashy animations or crypto-startup vibes
- **Kenyan context** - Built for local SACCO operations

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:
- `profiles` - User accounts and roles
- `members` - Member profiles and balances
- `documents` - Uploaded identification documents
- `deposits` - Savings and contributions
- `loans` - Loan applications and status
- `loan_guarantors` - Guarantor relationships
- `referrals` - Member referral tracking
- `loyalty_points` - Points and rewards
- `notifications` - System notifications
- `audit_logs` - Compliance and audit trail

## 🔄 Future Enhancements

- [ ] Paystack payment integration (M-Pesa + Banks)
- [ ] SMS notifications via Africa's Talking
- [ ] Automated loan repayment schedules
- [ ] Member statements and reports
- [ ] Dividend calculations and distribution
- [ ] Mobile app (React Native)
- [ ] WhatsApp notifications
- [ ] Bulk deposit imports
- [ ] Advanced analytics dashboard

## 🤝 Contributing

This is a private SACCO system. For feature requests or issues, contact the development team.

## 📄 License

Proprietary - HRDC SACCO

## 🆘 Support

For setup assistance or technical issues:
1. Check [SETUP.md](./SETUP.md) for detailed instructions
2. Review Supabase dashboard for database errors
3. Check browser console for client-side errors
4. Verify environment variables are correctly set

## 🙏 Acknowledgments

Built with modern web technologies to serve Kenyan SACCO members with dignity, transparency, and efficiency.
