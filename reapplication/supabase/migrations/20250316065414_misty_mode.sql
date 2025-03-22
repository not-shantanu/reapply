/*
  # Add active resume support

  1. Changes
    - Add active_resume_id column to profiles table
    - Add indexes for resume management
*/

-- Add active_resume_id column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_resume_id text;

-- Add index for active resume lookup
CREATE INDEX IF NOT EXISTS idx_profiles_active_resume
ON public.profiles(active_resume_id)
WHERE active_resume_id IS NOT NULL;

-- Update storage policies to include active resume management
CREATE POLICY "Users can read active resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.active_resume_id = storage.filename(name)
  )
);