import { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { useToast } from '../../../hooks/useToast';

interface ApplyToJobFormProps {
  jobId: string;
  onSubmit: () => void;
}

export const ApplyToJobForm = ({ jobId, onSubmit }: ApplyToJobFormProps) => {
  const { showToast } = useToast();
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would send the application to the server
    console.log('Submitted application for job:', jobId, { coverLetter, resumeUrl });
    
    showToast({
      title: 'Application submitted!',
      description: 'Your application has been sent to the hiring team.',
      type: 'success'
    });

    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Resume URL (optional)</label>
        <Input
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="Link to your resume (Google Drive, LinkedIn, etc.)"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Cover Letter</label>
        <Textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Tell the hiring team why you're a great fit for this role..."
          className="min-h-[200px]"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onSubmit}>Cancel</Button>
        <Button type="submit">Submit Application</Button>
      </div>
    </form>
  );
};