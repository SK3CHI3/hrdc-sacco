-- Auto-create profile on user signup
-- Migration 004: Create trigger to automatically insert profile when user signs up

-- Drop the restrictive INSERT policy on profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a more permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also allow anon users to insert (for the brief moment during signup)
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
