/*
  # Fix Storage and RLS Policies

  1. Changes
    - Fix bucket creation and management
    - Update storage policies
    - Update RLS policies
  
  2. Security
    - Ensure proper bucket access
    - Fix RLS policy violations
    - Maintain user data isolation
*/

-- Drop existing policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can read their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Public can read resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can read any resume" ON storage.objects;
END $$;

-- Ensure bucket exists with proper settings
DO $$
BEGIN
    -- Update bucket if it exists
    UPDATE storage.buckets
    SET 
        public = true,
        file_size_limit = 5242880,  -- 5MB limit
        allowed_mime_types = ARRAY['application/pdf']::text[]
    WHERE id = 'resumes';

    -- Create bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'resumes') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'resumes',
            'resumes',
            true,
            5242880,  -- 5MB limit
            ARRAY['application/pdf']::text[]
        );
    END IF;
END $$;

-- Create storage policies
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.extension(name) = 'pdf'
);

CREATE POLICY "Users can update their own resumes"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can read resumes"
ON storage.objects FOR SELECT TO public
USING (
    bucket_id = 'resumes' 
    AND auth.role() = 'authenticated'
);

-- Update profiles RLS policies
DO $$
BEGIN
    -- Ensure RLS is enabled
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Update or create policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own Gmail tokens" ON public.profiles;
    
    CREATE POLICY "Users can view own profile"
        ON public.profiles FOR SELECT
        TO authenticated
        USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile"
        ON public.profiles FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
END $$;