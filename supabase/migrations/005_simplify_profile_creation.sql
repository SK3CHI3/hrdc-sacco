-- Simplify profile creation
-- Migration 005: Use service role for profile creation instead of complex RLS

-- Drop the problematic policies
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- Simple policy: authenticated users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Grant service role bypass for profile creation
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Update the trigger function to use SECURITY DEFINER properly
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
