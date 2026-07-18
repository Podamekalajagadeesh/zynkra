import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { ContentCalendar } from '../components/scheduling/ContentCalendar';
import { SchedulePostModal } from '../components/scheduling/SchedulePostModal';
import { BulkUploadModal } from '../components/scheduling/BulkUploadModal';

export const SchedulerPage = () => {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const handlePostScheduled = () => {
    // Refresh the calendar data
    window.location.reload();
  };

  return (
    <PageShell title="Content Scheduler">
      <div className="space-y-8">
        <div className="flex gap-4">
          <Button onClick={() => setIsScheduleModalOpen(true)}>
            Schedule New Post
          </Button>
          <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)}>
            Bulk Upload Posts
          </Button>
        </div>
        
        <ContentCalendar />
        
        <SchedulePostModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onPostScheduled={handlePostScheduled}
        />
        
        <BulkUploadModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onUploadComplete={handlePostScheduled}
        />
      </div>
    </PageShell>
  );
};