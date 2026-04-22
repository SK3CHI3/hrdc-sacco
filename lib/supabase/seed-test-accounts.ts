import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_ACCOUNTS = [
  {
    role: 'SUPER_ADMIN',
    email: 'superadmin@hrdcsacco.co.ke',
    fullName: 'System Super Admin',
    status: 'ACTIVE'
  },
  {
    role: 'ADMIN',
    email: 'admin@hrdcsacco.co.ke',
    fullName: 'Sacco Administrator',
    status: 'ACTIVE'
  },
  {
    role: 'CREDIT_OFFICER',
    email: 'credit@hrdcsacco.co.ke',
    fullName: 'Credit Review Officer',
    status: 'ACTIVE'
  },
  {
    role: 'COMMITTEE_MEMBER',
    email: 'committee@hrdcsacco.co.ke',
    fullName: 'Loan Committee Member',
    status: 'ACTIVE'
  },
  {
    role: 'MEMBER',
    email: 'member.active@hrdcsacco.co.ke',
    fullName: 'Active Member User',
    status: 'ACTIVE',
    isMember: true
  }
];

async function seed() {
  console.log('🚀 Starting test account seeding...');

  for (const account of TEST_ACCOUNTS) {
    console.log(`\nProcessing ${account.email}...`);

    // 1. Create/Get User in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: account.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: account.fullName
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`   User already exists in Auth.`);
      } else {
        console.error(`   Error creating auth user: ${authError.message}`);
        continue;
      }
    }

    // Get the user ID (either from new creation or search)
    let userId: string;
    if (authData?.user) {
      userId = authData.user.id;
    } else {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const existingUser = userData?.users.find(u => u.email === account.email);
      if (!existingUser) {
        console.error(`   Could not find existing user ID.`);
        continue;
      }
      userId = existingUser.id;
    }

    // 2. Update Profile Role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: account.role,
        full_name: account.fullName 
      })
      .eq('id', userId);

    if (profileError) {
      console.error(`   Error updating profile: ${profileError.message}`);
    } else {
      console.log(`   Profile updated with role: ${account.role}`);
    }

    // 3. Create Member record if needed
    if (account.role === 'MEMBER' || account.isMember) {
      // Check if member already exists
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingMember) {
        // We need to call the database functions to get member number and referral code
        // But for simplicity in this script, we can just let the DB handle it if possible
        // Actually, the migrations don't have defaults, so we'll just insert with placeholders
        // and let the user update them or we can call the functions via RPC if exposed.
        
        const { data: memberNum } = await supabase.rpc('generate_member_number');
        const { data: refCode } = await supabase.rpc('generate_referral_code');

        const { error: memberError } = await supabase
          .from('members')
          .insert({
            user_id: userId,
            member_number: memberNum || `MEM-${Math.floor(Math.random() * 1000000)}`,
            national_id: `ID-${Math.floor(Math.random() * 10000000)}`,
            date_of_birth: '1990-01-01',
            status: account.status,
            referral_code: refCode || Math.random().toString(36).substring(2, 10).toUpperCase(),
            total_shares: 5000,
            total_deposits: 10000,
            available_balance: 15000
          });

        if (memberError) {
          console.error(`   Error creating member record: ${memberError.message}`);
        } else {
          console.log(`   Member record created and activated.`);
        }
      } else {
        console.log(`   Member record already exists.`);
        // Update status to ACTIVE
        await supabase.from('members').update({ status: 'ACTIVE' }).eq('user_id', userId);
      }
    }
  }

  console.log('\n✅ Seeding completed!');
}

seed().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
