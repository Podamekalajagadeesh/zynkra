
import { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';

export default function DataPrivacyPage() {
  const [exportStatus, setExportStatus] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchExportStatus = async () => {
      try {
        const response = await api.get('/data-export');
        setExportStatus(response.data);
      } catch (error) {
        // Ignore errors, as it's expected that there may not be an export yet
      }
    };

    fetchExportStatus();

    const interval = setInterval(fetchExportStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.post('/data-export');
      addToast('Data export started', 'success');
    } catch (error) {
      addToast('Failed to start data export', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/data-deletion');
      addToast('Account deletion requested', 'success');
      setDeleteDialogOpen(false);
      // Redirect to home page after successful deletion request
      window.location.href = '/';
    } catch (error) {
      addToast('Failed to request account deletion', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageShell
      title="Data & Privacy"
      description="Manage your data and privacy settings in compliance with GDPR/CCPA."
    >
      <div className="space-y-8">
        {/* Data Export Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">Export Your Data</h2>
            <p className="text-sm text-gray-500">
              Export a copy of your personal data in a machine-readable JSON format. This includes your profile information, posts, comments, and connections.
            </p>
          </div>
          {exportStatus && exportStatus.status === 'completed' ? (
            <a href={exportStatus.fileUrl} download>
              <Button>Download Export</Button>
            </a>
          ) : (
            <Button
              onClick={handleExport}
              disabled={exporting || (exportStatus && exportStatus.status === 'pending')}
            >
              {exporting || (exportStatus && exportStatus.status === 'pending')
                ? 'Preparing export...'
                : 'Request Data Export'}
            </Button>
          )}
        </div>

        {/* Data Deletion Section */}
        <div className="space-y-4 border-t pt-8">
          <div>
            <h2 className="text-lg font-bold">Request Account Deletion</h2>
            <p className="text-sm text-gray-500">
              Permanently delete your account and all associated personal data. This action complies with GDPR/CCPA right to be forgotten requirements. Your data will be permanently removed within 30 days.
            </p>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleting}
          >
            Request Account Deletion
          </Button>
        </div>

        {/* Privacy Policy Section */}
        <div className="space-y-4 border-t pt-8">
          <div>
            <h2 className="text-lg font-bold">Privacy Policy & Data Usage</h2>
            <p className="text-sm text-gray-500">
              Review our full privacy policy to understand how we collect, use, and share your personal data in compliance with global privacy regulations.
            </p>
          </div>
          <a href="/privacy">
            <Button variant="secondary">View Privacy Policy</Button>
          </a>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone. All your personal data will be permanently removed within 30 days in compliance with GDPR and CCPA requirements.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? 'Processing...' : 'Confirm Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}