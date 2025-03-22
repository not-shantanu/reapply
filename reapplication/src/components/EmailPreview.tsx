import { useState } from 'react';
import { type EmailDraft as EmailDraftType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EmailPreviewProps {
  draft: EmailDraftType;
  recruiterEmail: string;
  onBack: () => void;
  onSend: () => void;
}

export default function EmailPreview({ draft, recruiterEmail, onBack, onSend }: EmailPreviewProps) {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);

  const getValidAccessToken = async (): Promise<string | null> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!sessionError && session?.provider_token) {
        return session.provider_token;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithOAuth({
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

      if (authError) throw authError;
      if (!authData.url) throw new Error('No OAuth URL returned');

      window.location.href = authData.url;
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to get Gmail access. Please try again.');
    }
  };

  const sendEmailWithToken = async (accessToken: string) => {
    if (!user?.email) throw new Error('User email not found');

    const emailContent = [
      `From: ${user.email}`,
      `To: ${recruiterEmail}`,
      `Subject: ${draft.subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      draft.body
    ].join('\r\n');

    const base64EncodedEmail = btoa(emailContent)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64EncodedEmail }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to send email');
    }

    return response;
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      if (!user) throw new Error('Not authenticated');

      const accessToken = await getValidAccessToken();
      if (!accessToken) return;

      await sendEmailWithToken(accessToken);
      toast.success('Email sent successfully!');
      onSend();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-none mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Step 3 of 3:</span>
          <span>Preview and send your application email</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium">Email Preview</h3>
            <p className="text-sm text-gray-500">Review your email before sending</p>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">To:</span>
              <p className="font-medium">{recruiterEmail}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Subject:</span>
              <p className="font-medium">{draft.subject}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Message:</span>
              <div className="mt-2 whitespace-pre-wrap font-mono text-sm border rounded-lg p-4 bg-gray-50">
                {draft.body}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="flex-none flex justify-between pt-6 border-t">
        <Button 
          type="button" 
          variant="outline"
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          onClick={handleSendEmail}
          disabled={isSending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSending ? 'Sending...' : 'Send Email'}
        </Button>
      </div>
    </div>
  );
}