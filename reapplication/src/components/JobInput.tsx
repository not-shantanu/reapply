import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Job, jobSchema, type EmailDraft as EmailDraftType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, MapPin, Calendar, Mail, Briefcase, X } from 'lucide-react';
import EmailDraft from './EmailDraft';
import EmailPreview from './EmailPreview';

interface JobInputProps {
  onAddJob: (job: Job) => void;
  onClose?: () => void;
}

export default function JobInput({ onAddJob, onClose }: JobInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'email' | 'preview'>('details');
  const [emailDraft, setEmailDraft] = useState<EmailDraftType | null>(null);

  const form = useForm<Job>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      company: '',
      position: '',
      jobStatus: 'Remote',
      location: '',
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      description: '',
      recruiterEmail: '',
    },
  });

  const generateEmailDraft = (job: Job): EmailDraftType => {
    const subject = `Application for ${job.position} position at ${job.company}`;
    const body = `Dear [Recruiter Name],

I am writing to express my interest in the [Position] role at [Company]...
[Template Preview]`;

    return { subject, body };
  };

  const handleJobDetails = async (data: Job) => {
    const draft = generateEmailDraft(data);
    setEmailDraft(draft);
    setStep('email');
  };

  const handleEmailEdit = (draft: EmailDraftType) => {
    setEmailDraft(draft);
    setStep('preview');
  };

  const handleEmailSend = async () => {
    setIsLoading(true);
    try {
      const jobData = form.getValues();
      await onAddJob(jobData);
      form.reset();
      setStep('details');
      setEmailDraft(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'preview' && emailDraft) {
    return (
      <EmailPreview
        draft={emailDraft}
        recruiterEmail={form.getValues().recruiterEmail}
        onBack={() => setStep('email')}
        onSend={handleEmailSend}
      />
    );
  }

  if (step === 'email' && emailDraft) {
    return (
      <EmailDraft
        initialDraft={emailDraft}
        onSave={handleEmailEdit}
        onBack={() => setStep('details')}
        recruiterEmail={form.getValues().recruiterEmail}
      />
    );
  }

  const labelStyle = "text-[14px] font-['Inter'] text-[#666666]";

  return (
    <div className="relative flex flex-col h-full">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      
      <div className="flex-none mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Step 1 of 3:</span>
          <span>Basic Information</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleJobDetails)} className="flex flex-col h-full">
          <ScrollArea className="flex-1 max-h-[60vh] px-4 -mx-4">
            <div className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem className="px-3">
                        <FormLabel className={labelStyle}>Company</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input className="pl-9" placeholder="e.g., Google" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem className="px-3">
                        <FormLabel className={labelStyle}>Position</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input className="pl-9" placeholder="e.g., Senior Software Engineer" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location & Type Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="jobStatus"
                    render={({ field }) => (
                      <FormItem className="px-3">
                        <FormLabel className={labelStyle}>Job Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full px-3 py-2">
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Remote">Remote</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                            <SelectItem value="Onsite">Onsite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="px-3">
                        <FormLabel className={labelStyle}>Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input className="pl-9" placeholder="e.g., San Francisco, CA" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="recruiterEmail"
                  render={({ field }) => (
                    <FormItem className="px-3">
                      <FormLabel className={labelStyle}>Recruiter Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input 
                            className="pl-9"
                            type="email"
                            placeholder="recruiter@company.com" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex-none flex justify-between pt-6 mt-6 border-t">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Continue to Email Draft
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}