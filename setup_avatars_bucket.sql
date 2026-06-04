-- Create the avatars storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to read avatars (public bucket)
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated and anonymous uploads
CREATE POLICY "Allow avatar uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Allow updates to avatars  
CREATE POLICY "Allow avatar updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');

-- Allow deletes
CREATE POLICY "Allow avatar deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars');

-- Also make sure avatar column in users table is text type
ALTER TABLE users ALTER COLUMN avatar TYPE text;

-- Verify bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';
