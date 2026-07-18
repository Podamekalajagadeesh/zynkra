import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Building2, MapPin, Clock, DollarSign, Briefcase } from 'lucide-react';
import { JobListing } from '../../../lib/types';

interface JobDetailViewProps {
  job: JobListing;
  isAdmin: boolean;
  onApply: () => void;
}

const jobTypeLabels = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'contract': 'Contract',
  'remote': 'Remote',
  'hybrid': 'Hybrid'
};

export const JobDetailView = ({ job, isAdmin, onApply }: JobDetailViewProps) => {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Building2 size={16} />
              {job.company}
            </CardDescription>
          </div>
          <Badge className="text-sm">{jobTypeLabels[job.jobType]}</Badge>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin size={16} />
            {job.location}
          </span>
          {job.salary && (
            <span className="flex items-center gap-1">
              <DollarSign size={16} />
              ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} {job.salary.currency}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={16} />
            Posted {new Date(job.postedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{job.description}</p>
        </CardContent>
      </Card>

      {job.requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {job.responsibilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Responsibilities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {job.responsibilities.map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <span className="text-sm text-gray-500">{job.applications.length} candidates have applied</span>
        {!isAdmin && <Button onClick={onApply}>Apply Now</Button>}
      </div>
    </div>
  );
};