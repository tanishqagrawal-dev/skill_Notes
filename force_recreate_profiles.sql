-- Since the table is empty, we will drop it and recreate it 
-- to make absolutely sure ALL the new columns exist.

DROP TABLE IF EXISTS profiles;

CREATE TABLE profiles (
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

-- Disable RLS so anon key can read/write freely
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Allow all operations for anon role
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;

-- Force Supabase to reload its schema cache
NOTIFY pgrst, 'reload schema';
