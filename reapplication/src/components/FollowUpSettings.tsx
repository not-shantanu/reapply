import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Job, FollowUp, FollowUpTiming } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface FollowUpSettingsProps {
  job: Job;
  onComplete: () => void;
}

const followUpFormSchema = z.object({
  count: z.number().min(1).max(5),
  timing: z.array(z.enum(['immediate', 'tomorrow', 'custom'])),
  customDates: z.array(z.string().optional()),
  subjects: z.array(z.string()),
  bodies: z.array(z.string()),
});

type FollowUpFormValues = z.infer<typeof followUpFormSchema>;

export default function FollowUpSettings({ job, onComplete }: FollowUpSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      count: 1,
      timing: ['tomorrow'],
      customDates: [''],
      subjects: ['Following up on my application'],
      bodies: ['Dear Hiring Manager,\n\nI hope this email finds you well. I am writing to follow up on my application for the [Position] role at [Company].\n\nI remain very interested in the opportunity and would welcome the chance to discuss how my skills and experience align with your needs.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]'],
    },
  });

  const followUpCount = form.watch('count');
  const timingValues = form.watch('timing');

  const calculateScheduledDate = (timing: FollowUpTiming, customDate?: string): Date => {
    const now = new Date();
    switch (timing) {
      case 'immediate':
        return now;
      case 'tomorrow':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      case 'custom':
        return customDate ? new Date(customDate) : now;
      default:
        return now;
    }
  };

  const handleSubmit = async (values: FollowUpFormValues) => {
    setIsSubmitting(true);
    try {
      const followUps: Omit<FollowUp, 'id'>[] = [];

      for (let i = 0; i < values.count; i++) {
        const scheduledDate = calculateScheduledDate(
          values.timing[i],
          values.customDates[i]
        );

        followUps.push({
          jobId: job.id!,
          scheduledDate,
          emailSubject: values.subjects[i],
          emailBody: values.bodies[i]
            .replace('[Position]', job.position)
            .replace('[Company]', job.company),
          status: 'pending',
          timing: values.timing[i],
        });
      }

      const { error } = await supabase
        .from('follow_ups')
        .insert(followUps);

      if (error) throw error;

      // Update job's follow-up count
      await supabase
        .from('jobs')
        .update({ follow_up_count: followUps.length })
        .eq('id', job.id);

      toast.success('Follow-up emails scheduled successfully');
      onComplete();
    } catch (error) {
      console.error('Error scheduling follow-ups:', error);
      toast.error('Failed to schedule follow-up emails');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Follow-up Emails</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Follow-ups</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of follow-ups" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'follow-up' : 'follow-ups'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {Array.from({ length: followUpCount }).map((_, index) => (
              <div key={index} className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Follow-up #{index + 1}</h3>
                
                <FormField
                  control={form.control}
                  name={`timing.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timing</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timing" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Send Immediately</SelectItem>
                          <SelectItem value="tomorrow">Send Tomorrow</SelectItem>
                          <SelectItem value="custom">Custom Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {timingValues[index] === 'custom' && (
                  <FormField
                    control={form.control}
                    name={`customDates.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name={`subjects.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`bodies.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Body</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={8}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onComplete}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Follow-ups'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}