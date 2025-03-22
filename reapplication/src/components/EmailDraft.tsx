import { useState } from 'react';
import { type EmailDraft as EmailDraftType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth/AuthProvider';

interface EmailDraftProps {
  initialDraft: EmailDraftType;
  onSave: (draft: EmailDraftType) => void;
  onBack: () => void;
  recruiterEmail: string;
}

export default function EmailDraft({ initialDraft, onSave, onBack, recruiterEmail }: EmailDraftProps) {
  const [draft, setDraft] = useState<EmailDraftType>(initialDraft);
  const { user } = useAuth();

  const labelStyle = "text-[14px] font-['Inter'] text-[#666666]";

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-none mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Step 2 of 3:</span>
          <span>Review and edit the email before sending to the recruiter</span>
        </div>
      </div>

      <ScrollArea className="flex-1 max-h-[60vh] px-4 -mx-4">
        <div className="space-y-6">
          <div>
            <label className={labelStyle}>To</label>
            <Input
              value={recruiterEmail}
              disabled
              className="mt-2 bg-gray-50"
            />
          </div>

          <div>
            <label className={labelStyle}>Subject</label>
            <Input
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              className="mt-2"
            />
          </div>

          <div>
            <label className={labelStyle}>Message</label>
            <Textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              className="mt-2 min-h-[200px] font-mono text-sm"
            />
          </div>
        </div>
      </ScrollArea>

      <div className="flex-none flex justify-between pt-6 mt-6 border-t">
        <Button 
          type="button" 
          variant="outline"
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          onClick={() => onSave(draft)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}