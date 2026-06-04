-- ============================================================
-- PROFILES TABLE for SKIL MATRIX
-- Run this entire block in Supabase SQL Editor
-- ============================================================

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,               -- Firebase UID
  email TEXT UNIQUE,
  name TEXT,
  avatar TEXT,                       -- public URL or base64
  phone TEXT,
  country_code TEXT,
  gender TEXT,
  college TEXT,
  program TEXT,
  year TEXT,
  branch TEXT,
  semester TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  xp INTEGER DEFAULT 0,
  uploads INTEGER DEFAULT 0,
  focusminutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Disable RLS so anon key can read/write freely
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Allow all operations for anon role
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;

-- 4. Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_timestamp();

-- 5. Also create avatars storage bucket (for image uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar deletes" ON storage.objects;

-- Create storage policies
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow avatar uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Allow avatar updates" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Allow avatar deletes" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

-- 6. Verify everything
SELECT 'profiles table created' AS status, COUNT(*) AS rows FROM profiles;
SELECT 'avatars bucket' AS status, id, name, public FROM storage.buckets WHERE id = 'avatars';
