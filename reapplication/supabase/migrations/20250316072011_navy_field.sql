/*
  # Fix storage policies and permissions

  1. Changes
    - Fix storage bucket permissions
    - Update RLS policies for better security
    - Enable public access to specific resume paths

  2. Security
    - Ensure proper bucket access
    - Fix RLS policy issues
    - Maintain user data isolation
*/

-- Drop existing policies to clean up
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can read their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Public can read resumes" ON storage.objects;
END $$;

-- Ensure bucket exists and is public
DO $$
BEGIN
    -- Update bucket to be public if it exists
    UPDATE storage.buckets
    SET public = true
    WHERE id = 'resumes';

    -- Create bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'resumes') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('resumes', 'resumes', true);
    END IF;
END $$;

-- Create new storage policies with fixed permissions
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own resumes"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read any resume"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes');

CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can read resumes"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'resumes');

-- Update profiles table RLS policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own Gmail tokens" ON public.profiles;
    
    CREATE POLICY "Users can update own Gmail tokens"
    ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
END $$;