import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Settings() {
  const { user } = useAuth();
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserAndGmailStatus();
  }, [user]);

  const checkUserAndGmailStatus = async () => {
    try {
      if (!user) return;

      // Check if user signed in with Google
      const { data: identities, error: identityError } = await supabase.auth.getUser();
      if (identityError) throw identityError;

      const isGoogleSignIn = identities.user?.app_metadata?.provider === 'google';
      setIsGoogleUser(isGoogleSignIn);

      // Check Gmail connection status
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('gmail_connected, gmail_tokens')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const isValid = profile.gmail_tokens && 
        profile.gmail_tokens.access_token &&
        profile.gmail_tokens.expires_at && 
        profile.gmail_tokens.expires_at > Date.now();

      setIsGmailConnected(profile.gmail_connected && isValid);
    } catch (error) {
      console.error('Error checking user status:', error);
      toast.error('Failed to check connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGmailConnect = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?gmail_connection=true`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: 'https://www.googleapis.com/auth/gmail.send',
          },
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast.error('Failed to connect Gmail');
    }
  };

  const handleGmailDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          gmail_tokens: null,
          gmail_connected: false
        })
        .eq('id', user?.id);

      if (error) throw error;

      setIsGmailConnected(false);
      toast.success('Gmail disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast.error('Failed to disconnect Gmail');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </CardTitle>
          <CardDescription>
            {isGoogleUser 
              ? 'Gmail is automatically connected when you sign in with Google'
              : 'Connect your Gmail account to send emails directly from the application'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium">Gmail Connection Status</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {isGoogleUser 
                      ? 'Your Gmail account is automatically connected through your Google sign-in.'
                      : isGmailConnected
                        ? 'Your Gmail account is connected. You can send emails directly from the application.'
                        : 'Connect your Gmail account to send emails to recruiters directly from the application.'}
                  </p>
                  {!isGoogleUser && (
                    <Button
                      onClick={isGmailConnected ? handleGmailDisconnect : handleGmailConnect}
                      variant={isGmailConnected ? "outline" : "default"}
                    >
                      {isGmailConnected ? 'Disconnect Gmail' : 'Connect Gmail'}
                    </Button>
                  )}
                </div>
              </div>

              {(isGmailConnected || isGoogleUser) && (
                <div className="text-sm text-gray-500">
                  <p>Connected email: {user?.email}</p>
                  <p className="mt-1">Last connected: {new Date().toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}