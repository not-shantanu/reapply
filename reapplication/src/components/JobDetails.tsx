import { useState } from 'react';
import { Job, FollowUp } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Calendar, Mail, User } from 'lucide-react';
import FollowUpSettings from './FollowUpSettings';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface JobDetailsProps {
  job: Job;
}

export default function JobDetails({ job }: JobDetailsProps) {
  const [showFollowUpSettings, setShowFollowUpSettings] = useState(false);

  return (
    <>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">Company</div>
                  <div className="text-gray-600">{job.company}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-gray-600">{job.location || 'Not specified'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">Applied Date</div>
                  <div className="text-gray-600">
                    {new Date(job.appliedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">Recruiter Name</div>
                  <div className="text-gray-600">{job.recruiterName || 'Not specified'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">Recruiter Email</div>
                  <div className="text-gray-600">{job.recruiterEmail}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => setShowFollowUpSettings(true)}
              className="w-full"
            >
              Configure Follow-up Emails
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="description">
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="prose max-w-none">
              {job.description ? (
                <div className="whitespace-pre-wrap">{job.description}</div>
              ) : (
                <div className="text-gray-500">No description available</div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="follow-ups">
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4">
              <div className="space-y-8">
                {/* Follow-up timeline will be implemented here */}
                <div className="text-center text-gray-500">
                  No follow-ups scheduled yet
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={showFollowUpSettings} onOpenChange={setShowFollowUpSettings}>
        <DialogContent className="max-w-3xl">
          <FollowUpSettings
            job={job}
            onComplete={() => setShowFollowUpSettings(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}