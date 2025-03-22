/*
  # Add resume storage support

  1. Changes
    - Add resume_url column to profiles table
    - Create storage bucket for resumes if it doesn't exist
    - Add policies for resume access

  2. Security
    - Enable RLS for storage
    - Add policies for authenticated users
*/

-- Add resume_url column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS resume_url text;

-- Create storage bucket for resumes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'resumes') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('resumes', 'resumes', true);
    END IF;
END $$;

-- Enable RLS for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for resume storage
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can read their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Public can read resumes" ON storage.objects;

    -- Create new policies
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

    CREATE POLICY "Users can read their own resumes"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Users can delete their own resumes"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Public can read resumes"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'resumes');
END $$;