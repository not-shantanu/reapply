/*
  # Add follow-up email support

  1. New Tables
    - `follow_ups`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references jobs)
      - `scheduled_date` (timestamptz)
      - `email_subject` (text)
      - `email_body` (text)
      - `status` (text): 'pending', 'sent', 'cancelled', 'reply_received'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to jobs table
    - Add `email_thread_id` column to track Gmail thread IDs
    - Add `last_reply_date` to track recruiter responses

  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  scheduled_date timestamptz NOT NULL,
  email_subject text NOT NULL,
  email_body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'cancelled', 'reply_received'))
);

-- Add new columns to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS email_thread_id text,
ADD COLUMN IF NOT EXISTS last_reply_date timestamptz,
ADD COLUMN IF NOT EXISTS follow_up_count int DEFAULT 0;

-- Enable RLS
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for follow_ups
CREATE POLICY "Users can view their own follow-ups"
  ON public.follow_ups
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = follow_ups.job_id
    AND jobs.user_id = auth.uid()
  ));

CREATE POLICY "Users can create follow-ups"
  ON public.follow_ups
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = follow_ups.job_id
    AND jobs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own follow-ups"
  ON public.follow_ups
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = follow_ups.job_id
    AND jobs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own follow-ups"
  ON public.follow_ups
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = follow_ups.job_id
    AND jobs.user_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follow_ups_job_id ON follow_ups(job_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_date ON follow_ups(scheduled_date);