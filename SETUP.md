# HRDC SACCO Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed

## Step 1: Supabase Project Setup

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Project Name**: HRDC SACCO
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to Kenya (e.g., Singapore or Frankfurt)
5. Click "Create new project" and wait for setup to complete

### 1.2 Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor and click "Run"
5. Wait for completion (should show "Success")
6. Create another new query
7. Copy the entire contents of `supabase/migrations/002_rls_policies.sql`
8. Paste and run

### 1.3 Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Name it: `member-documents`
4. Make it **Public** (we'll control access via RLS)
5. Click "Create bucket"

### 1.4 Set Up Storage Policies

In the Storage section, click on `member-documents` bucket, then "Policies":

```sql
-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'member-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM members WHERE user_id = auth.uid()
  )
);

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'member-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM members WHERE user_id = auth.uid()
  )
);

-- Allow staff to view all documents
CREATE POLICY "Staff can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'member-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'ADMIN', 'CREDIT_OFFICER', 'COMMITTEE_MEMBER')
  )
);
```

### 1.5 Get API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 2: Application Setup

### 2.1 Install Dependencies

```bash
cd "HRDC SACCO/hrdc-sacco"
npm install
```

### 2.2 Configure Environment Variables

Create a `.env.local` file in the `hrdc-sacco` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Paystack Configuration (Optional - for future payment integration)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

Replace the placeholder values with your actual Supabase keys from Step 1.5.

### 2.3 Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 3: Create Super Admin Account

### 3.1 Register First User

1. Go to [http://localhost:3000](http://localhost:3000)
2. Click "Register here"
3. Fill in your details and create an account
4. Complete the onboarding process

### 3.2 Promote to Super Admin

1. Go to Supabase dashboard → **Table Editor**
2. Open the `profiles` table
3. Find your user record
4. Change the `role` column from `MEMBER` to `SUPER_ADMIN`
5. Save the change

### 3.3 Activate Member Profile (if needed)

1. In Table Editor, open the `members` table
2. Find your member record
3. Change `status` from `PENDING_APPROVAL` to `ACTIVE`
4. Set `approved_by` to your user ID
5. Set `approved_at` to current timestamp
6. Save

## Step 4: Configure SACCO Settings

The default settings are already inserted by the migration. To modify them:

1. Go to Supabase dashboard → **Table Editor**
2. Open the `sacco_settings` table
3. Modify values as needed:
   - `max_loan_amount`: Maximum loan in KES
   - `min_loan_amount`: Minimum loan in KES
   - `default_interest_rate`: Annual interest rate percentage
   - `max_loan_duration_months`: Maximum loan period
   - `min_loan_duration_months`: Minimum loan period
   - `referral_points_per_member`: Points awarded per referral

## Step 5: Test the System

### 5.1 Test Member Registration

1. Open an incognito/private browser window
2. Go to [http://localhost:3000](http://localhost:3000)
3. Register a new member account
4. Complete onboarding with test documents

### 5.2 Test Member Approval

1. In your super admin account, go to **Admin** → **Members**
2. You should see the pending member
3. Click the checkmark to approve
4. The member should receive a notification

### 5.3 Test Loan Application

1. Log in as the approved member
2. Go to **Loans** → **Apply for Loan**
3. Fill in loan details
4. Submit application
5. Test guarantor workflow if loan requires guarantors

## Step 6: Paystack Integration (Optional)

For M-Pesa and bank payment integration:

1. Create a Paystack account at [https://paystack.com](https://paystack.com)
2. Get your API keys from Paystack dashboard
3. Add keys to `.env.local`
4. Implement payment webhooks (code structure is ready)

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and keys are correct
- Check if your Supabase project is active
- Ensure you're using the correct environment variables

### Authentication Issues

- Clear browser cache and cookies
- Check Supabase Auth settings (Email Auth should be enabled)
- Verify RLS policies are properly set up

### File Upload Issues

- Ensure storage bucket `member-documents` exists
- Verify storage policies are correctly configured
- Check file size limits in Supabase storage settings

### TypeScript Errors

- Run `npm install` to ensure all dependencies are installed
- The database types will sync once Supabase is properly configured
- Restart the development server after adding environment variables

## Production Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Add the same variables from `.env.local` to your production environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (optional)
- `PAYSTACK_SECRET_KEY` (optional)

## Security Checklist

- [ ] Service role key is kept secret (never exposed to client)
- [ ] RLS policies are enabled on all tables
- [ ] Storage policies are properly configured
- [ ] Email confirmation is enabled in Supabase Auth settings
- [ ] Rate limiting is configured in Supabase
- [ ] Database backups are enabled
- [ ] SSL/HTTPS is enforced in production

## Support

For issues or questions:
1. Check the Supabase documentation
2. Review the RLS policies in `002_rls_policies.sql`
3. Check browser console for errors
4. Verify database migrations ran successfully

## Next Steps

1. Customize branding and colors in `tailwind.config.ts`
2. Add email templates in Supabase Auth settings
3. Configure SMS notifications (optional)
4. Set up automated backups
5. Implement additional features as needed
