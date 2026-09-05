// @ts-nocheck
import { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { Download, Trash2, Shield, AlertTriangle, CheckCircle, FileJson, Loader2, Upload } from 'lucide-react';
import { api, get, del } from '../lib/api';

interface ExportInfo {
  dataTypes: string[];
  estimatedSize: string;
  lastExport: string | null;
  canExport: boolean;
}

const DataExportPage: React.FC = () => {
  const [info, setInfo] = useState<ExportInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const { addToast } = useToast();

  useEffect(() => { loadInfo(); }, []);

  const loadInfo = async () => {
    try {
      const data = await get<ExportInfo>('/data-export/info');
      setInfo(data);
    } catch (error) {
      addToast('Failed to load export info', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setExporting(true);
    try {
      const response = await api.get('/data-export/download', { responseType: 'blob' });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zynkra-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast('Data exported successfully!', 'success');
    } catch (error) {
      addToast('Failed to export data', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const payload = JSON.parse(await file.text());
      const response = await api.post('/data-export/import', payload);
      const result = response.data;
      addToast(`Data imported: ${result.posts ?? 0} posts, ${result.articles ?? 0} articles, ${result.courses ?? 0} courses.`, 'success');
      await loadInfo();
    } catch (error: any) {
      const message = error instanceof SyntaxError
        ? 'The selected file is not valid JSON.'
        : error?.response?.data?.message || 'Failed to import data.';
      addToast(message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }

    setDeleting(true);
    try {
      await del('/data-export/delete-all');
      addToast('All data deleted. Your account has been anonymized.', 'success');
      setShowDeleteConfirm(false);
    } catch (error) {
      addToast('Failed to delete data', 'error');
    } finally {
      setDeleting(false);
      setDeleteStep(0);
    }
  };

  if (loading) {
    return (
      <PageShell eyebrow="Privacy" title="Data Export & Deletion">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Privacy"
      title="Data Export & Deletion"
      description="Download your data or request complete deletion. Your data, your choice."
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Export Section */}
        <div className="surface p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileJson size={20} className="text-blue-500" />
            Export Your Data
          </h3>
          <p className="text-sm text-dark-500 dark:text-dark-400 mb-4">
            Download a complete copy of all your data in JSON format. This includes:
          </p>
          <ul className="space-y-2 mb-6">
            {info?.dataTypes.map(type => (
              <li key={type} className="flex items-center gap-2 text-sm">
                <CheckCircle size={14} className="text-green-500" />
                <span className="capitalize">{type.replace(/-/g, ' ')}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={handleDownload}
            isLoading={exporting}
            icon={<Download size={16} />}
          >
            Download My Data
          </Button>
        </div>

        <div className="surface p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload size={20} className="text-blue-500" />
            Import Your Data
          </h3>
          <p className="text-sm text-dark-500 dark:text-dark-400 mb-4">
            Restore content and settings from a Zynkra JSON export. Existing identity, payment, and verification data is not replaced.
          </p>
          <input
            id="account-data-import"
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="sr-only"
          />
          <label
            htmlFor="account-data-import"
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-cyan-500 px-4 py-2 font-medium text-white shadow-lg shadow-primary-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary-500/25 ${importing ? 'pointer-events-none opacity-50' : ''}`}
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {importing ? 'Importing...' : 'Choose Export File'}
          </label>
        </div>

        {/* Deletion Section */}
        <div className="surface p-6 border-2 border-red-200 dark:border-red-900">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trash2 size={20} className="text-red-500" />
            Delete All Data
          </h3>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  This action is irreversible
                </p>
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                  All your posts, messages, articles, courses, and other content will be permanently deleted.
                  Your account will be anonymized.
                </p>
              </div>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              icon={<Trash2 size={16} />}
            >
              Request Data Deletion
            </Button>
          ) : (
            <div className="space-y-4">
              {deleteStep === 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    Are you sure you want to delete all your data?
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    This will permanently delete all your content and anonymize your account.
                  </p>
                </div>
              )}
              {deleteStep === 1 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                    Last chance! This cannot be undone.
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                    All your followers will lose access to your content.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  isLoading={deleting}
                >
                  {deleteStep < 2 ? 'I understand, continue' : 'Delete everything'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteStep(0); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Info */}
        <div className="surface p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield size={20} className="text-green-500" />
            Your Privacy Rights
          </h3>
          <ul className="space-y-3 text-sm text-dark-600 dark:text-dark-400">
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-500 mt-0.5" />
              <span>GDPR compliant: Right to access, rectification, and erasure</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-500 mt-0.5" />
              <span>CCPA compliant: Right to know, delete, and opt-out</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-500 mt-0.5" />
              <span>Zero data collection: We never sell or share your data</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-500 mt-0.5" />
              <span>Encrypted in transit (TLS): Full E2EE is in progress</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-500 mt-0.5" />
              <span>Offline-first: Your data lives on your device first</span>
            </li>
          </ul>
        </div>
      </div>
    </PageShell>
  );
};

export default DataExportPage;
