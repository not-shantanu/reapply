import { ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Job } from '@/lib/types';
import JobDetails from '@/components/JobDetails';
import { useState } from 'react';

interface JobTableProps {
  jobs: Job[];
}

const statusColors = {
  Applied: 'bg-yellow-50 text-yellow-800',
  Rejected: 'bg-red-50 text-red-800',
  Interviewing: 'bg-blue-50 text-blue-800',
  Offered: 'bg-green-50 text-green-800',
};

export default function JobTable({ jobs }: JobTableProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleRowClick = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  if (jobs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No jobs added yet. Click the "Add Job" button to get started.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">
                <Checkbox />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Job Status</TableHead>
              <TableHead>Salary/year</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow 
                key={job.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(job)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                      {job.company.charAt(0)}
                    </div>
                    <span className="font-medium">{job.company}</span>
                  </div>
                </TableCell>
                <TableCell>{job.position}</TableCell>
                <TableCell>
                  <div>
                    {job.jobStatus}
                    {job.location && (
                      <div className="text-sm text-gray-500">{job.location}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{job.salary}</TableCell>
                <TableCell>{new Date(job.appliedDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${
                      statusColors[job.status as keyof typeof statusColors]
                    }`}
                  >
                    {job.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedJob && <JobDetails job={selectedJob} />}
        </DialogContent>
      </Dialog>
    </>
  );
}