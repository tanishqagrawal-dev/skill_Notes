-- Add allow_download boolean to approved_notes
ALTER TABLE public.approved_notes 
ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT true;

-- Add allow_download boolean to pending_notes
ALTER TABLE public.pending_notes 
ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT true;
