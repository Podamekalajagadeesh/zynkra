import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Building2, MapPin, Clock, Briefcase, DollarSign } from 'lucide-react';
import { JobListing, JobApplication } from '../../../lib/types';
import { JobDetailView } from './JobDetailView';
import { ApplyToJobForm } from './ApplyToJobForm';

interface JobListingsPanelProps {
  jobListings: JobListing[];
  isAdmin: boolean;
}

const jobTypeLabels = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'contract': 'Contract',
  'remote': 'Remote',
  'hybrid': 'Hybrid'
};

export const JobListingsPanel = ({ jobListings, isAdmin }: JobListingsPanelProps) => {
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filteredJobs = filter === 'all' 
    ? jobListings 
    : jobListings.filter(job => job.jobType === filter);

  if (jobListings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Listings</CardTitle>
          <CardDescription>There are no open job positions in this community yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'secondary'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Jobs
        </Button>
        {Object.entries(jobTypeLabels).map(([key, label]) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Job Cards */}
      <div className="grid gap-4">
        {filteredJobs.map(job => (
          <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedJob(job)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Building2 size={14} />
                    {job.company}
                  </CardDescription>
                </div>
                <Badge>{jobTypeLabels[job.jobType]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {job.location}
                </span>
                {job.salary && (
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} />
                    {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()} {job.salary.currency}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Posted {new Date(job.postedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-3 text-sm line-clamp-2">{job.description}</p>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{job.applications.length} applications</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <JobDetailView 
              job={selectedJob} 
              isAdmin={isAdmin}
              onApply={() => {
                setShowApplyForm(true);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Application Form Modal */}
      {showApplyForm && selectedJob && (
        <Dialog open={showApplyForm} onOpenChange={() => setShowApplyForm(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Apply for {selectedJob.title}</DialogTitle>
            </DialogHeader>
            <ApplyToJobForm jobId={selectedJob.id} onSubmit={() => setShowApplyForm(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};