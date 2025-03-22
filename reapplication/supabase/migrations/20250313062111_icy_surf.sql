/*
  # Add Gmail Token Management

  1. Changes
    - Add function to handle Gmail token refresh
    - Add trigger for Gmail token updates
    - Add indexes for token management

  2. Security
    - Function runs with security definer
    - Indexes optimize token-related queries
*/

-- Drop existing objects first
DROP TRIGGER IF EXISTS on_gmail_token_update ON public.profiles;
DROP FUNCTION IF EXISTS handle_gmail_token_refresh();

-- Create function to handle Gmail token refresh
CREATE OR REPLACE FUNCTION handle_gmail_token_refresh()
RETURNS trigger AS $$
BEGIN
  -- Update the gmail_connected status based on token presence
  IF NEW.gmail_tokens IS NOT NULL THEN
    NEW.gmail_connected := true;
    -- Store refresh token separately if available
    IF NEW.gmail_tokens->>'refresh_token' IS NOT NULL THEN
      NEW.gmail_refresh_token := NEW.gmail_tokens->>'refresh_token';
    END IF;
  ELSE
    NEW.gmail_connected := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for Gmail token management
CREATE TRIGGER on_gmail_token_update
  BEFORE UPDATE OF gmail_tokens ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_gmail_token_refresh();

-- Drop existing indexes
DROP INDEX IF EXISTS idx_profiles_gmail_connected;
DROP INDEX IF EXISTS idx_profiles_tokens;

-- Add indexes for token management
CREATE INDEX IF NOT EXISTS idx_profiles_gmail_connected
  ON public.profiles(gmail_connected)
  WHERE gmail_connected = true;

CREATE INDEX IF NOT EXISTS idx_profiles_tokens
  ON public.profiles(gmail_refresh_token, refresh_token)
  WHERE gmail_connected = true;