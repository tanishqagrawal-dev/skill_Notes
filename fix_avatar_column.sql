-- Step 1: Change avatar column to TEXT (unlimited size) to support base64 images
ALTER TABLE users ALTER COLUMN avatar TYPE text;

-- Step 2: Verify the change
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'avatar';
