import { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { useToast } from '../../../hooks/useToast';
import { JobListing } from '../../../lib/types';

interface CreateJobFormProps {
  communityId: string;
}

export const CreateJobForm = ({ communityId }: CreateJobFormProps) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<'full-time' | 'part-time' | 'contract' | 'remote' | 'hybrid'>('full-time');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('USD');
  const [applicationUrl, setApplicationUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !company || !location || !description) {
      showToast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        type: 'error'
      });
      return;
    }

    // Create new job listing - in a real app this would call an API
    const newJob: Partial<JobListing> = {
      title,
      company,
      location,
      jobType,
      description,
      requirements: requirements.split('\n').filter(r => r.trim()),
      responsibilities: responsibilities.split('\n').filter(r => r.trim()),
      salary: salaryMin && salaryMax ? {
        min: parseInt(salaryMin),
        max: parseInt(salaryMax),
        currency: salaryCurrency
      } : undefined,
      applicationUrl: applicationUrl || undefined,
      postedAt: new Date().toISOString(),
      applications: []
    };

    // In a real app, we'd send this to the server to add to the community's jobListings
    console.log('Created new job listing:', newJob);
    
    showToast({
      title: 'Job posted successfully!',
      description: 'Your job listing is now visible to the community',
      type: 'success'
    });

    // Reset form
    setTitle('');
    setCompany('');
    setLocation('');
    setJobType('full-time');
    setDescription('');
    setRequirements('');
    setResponsibilities('');
    setSalaryMin('');
    setSalaryMax('');
    setApplicationUrl('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Job Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Company *</label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Acme Inc."
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Location *</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, CA or Remote"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Job Type</label>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Job Description *</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the role, what it's like to work at the company, and the ideal candidate..."
          className="min-h-[150px]"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Requirements (one per line)</label>
        <Textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="5+ years of experience in React&#10;Strong TypeScript skills&#10;Experience with cloud platforms"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Responsibilities (one per line)</label>
        <Textarea
          value={responsibilities}
          onChange={(e) => setResponsibilities(e.target.value)}
          placeholder="Lead development of core features&#10;Mentor junior engineers&#10;Collaborate with product and design teams"
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Minimum Salary</label>
          <Input
            type="number"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="100000"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Maximum Salary</label>
          <Input
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="150000"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Currency</label>
          <Input
            value={salaryCurrency}
            onChange={(e) => setSalaryCurrency(e.target.value)}
            placeholder="USD"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Application URL (optional)</label>
        <Input
          value={applicationUrl}
          onChange={(e) => setApplicationUrl(e.target.value)}
          placeholder="https://yourcompany.com/careers/apply"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary">Cancel</Button>
        <Button type="submit">Post Job</Button>
      </div>
    </form>
  );
};