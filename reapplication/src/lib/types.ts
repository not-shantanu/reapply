import { z } from 'zod';

export type JobStatus = 'Applied' | 'Interviewing' | 'Offered' | 'Rejected' | 'Reply Received';
export type WorkType = 'Remote' | 'Hybrid' | 'Onsite';
export type FollowUpStatus = 'pending' | 'sent' | 'cancelled' | 'reply_received';
export type FollowUpTiming = 'immediate' | 'tomorrow' | 'custom';

export const followUpSchema = z.object({
  id: z.string().optional(),
  jobId: z.string(),
  scheduledDate: z.date(),
  emailSubject: z.string().min(1, 'Subject is required'),
  emailBody: z.string().min(1, 'Email body is required'),
  status: z.enum(['pending', 'sent', 'cancelled', 'reply_received']),
  timing: z.enum(['immediate', 'tomorrow', 'custom']),
});

export const jobSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  jobStatus: z.enum(['Remote', 'Hybrid', 'Onsite']),
  location: z.string().optional(),
  status: z.enum(['Applied', 'Interviewing', 'Offered', 'Rejected', 'Reply Received']),
  appliedDate: z.string(),
  userId: z.string().optional(),
  description: z.string().optional(),
  recruiterEmail: z.string().email('Invalid email address').min(1, 'Recruiter email is required'),
  emailThreadId: z.string().optional(),
  lastReplyDate: z.date().optional(),
  followUpCount: z.number().optional(),
});

export type Job = z.infer<typeof jobSchema>;
export type FollowUp = z.infer<typeof followUpSchema>;

export const emailDraftSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
});

export type EmailDraft = z.infer<typeof emailDraftSchema>;