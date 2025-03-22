import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        const isGmailConnection = params.get('gmail_connection') === 'true';

        if (error) throw new Error(errorDescription || 'Authentication failed');

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error(sessionError.message);
        if (!session) throw new Error('No session found');

        // Get the user's identity data
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw new Error(userError.message);
        if (!user) throw new Error('No user found');

        // Get Google identity data
        const googleIdentity = user.identities?.find(id => id.provider === 'google');
        if (!googleIdentity?.identity_data) {
          throw new Error('No Google identity data found');
        }

        // Always update tokens for Google sign-in
        const tokenData = {
          access_token: session.provider_token,
          refresh_token: googleIdentity.identity_data.refresh_token,
          expires_at: Date.now() + (3600 * 1000), // 1 hour from now
          token_type: 'Bearer'
        };

        // Update profile with tokens
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            gmail_tokens: tokenData,
            gmail_connected: true,
            gmail_refresh_token: googleIdentity.identity_data.refresh_token,
            refresh_token: googleIdentity.identity_data.refresh_token,
            token_type: 'Bearer',
            email: user.email,
            full_name: googleIdentity.identity_data.full_name,
            avatar_url: googleIdentity.identity_data.avatar_url
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw new Error('Failed to update profile with tokens');
        }

        // Handle redirect and messaging
        if (isGmailConnection) {
          toast.success('Gmail connected successfully!');
          window.location.href = '/settings';
        } else {
          toast.success('Successfully signed in!');
          window.location.href = '/';
        }
      } catch (error: any) {
        console.error('Error handling callback:', error);
        toast.error(error.message || 'Authentication failed');
        setTimeout(() => window.location.href = '/', 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Completing authentication...</h2>
        <p className="text-gray-500">Please wait while we verify your credentials.</p>
      </div>
    </div>
  );
}