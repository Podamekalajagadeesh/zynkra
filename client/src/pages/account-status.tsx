import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { useToast } from '../hooks/useToast';
import { api, deactivateAccount, reactivateAccount, deleteAccountPermanently } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function AccountStatusPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { logout } = useAuth();
  const [accountStatus, setAccountStatus] = useState<{ status: string; deactivatedAt?: string; deleted?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivatingAccount, setDeactivatingAccount] = useState(false);
  const [reactivatingAccount, setReactivatingAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const profile = await api.get('/users/me');
        setAccountStatus({
          status: profile.data.status ?? 'active',
          deactivatedAt: profile.data.deactivatedAt,
          deleted: profile.data.deleted,
        });
      } catch {
        // ignore errors
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleDeactivate = async () => {
    setDeactivatingAccount(true);
    try {
      await deactivateAccount(deactivateReason);
      setAccountStatus({ status: 'deactivated', deactivatedAt: new Date().toISOString() });
      addToast('Account deactivated. You can reactivate it anytime.', 'success');
      setDeactivateDialogOpen(false);
      setDeactivateReason('');
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to deactivate account', 'error');
    } finally {
      setDeactivatingAccount(false);
    }
  };

  const handleReactivate = async () => {
    setReactivatingAccount(true);
    try {
      await reactivateAccount();
      setAccountStatus({ status: 'active' });
      addToast('Account reactivated successfully!', 'success');
      setReactivateDialogOpen(false);
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to reactivate account', 'error');
    } finally {
      setReactivatingAccount(false);
    }
  };

  const handleDeletePermanently = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccountPermanently();
      addToast('Account permanently deleted. You are being logged out.', 'success');
      setDeleteDialogOpen(false);
      setTimeout(() => {
        logout();
        navigate('/');
      }, 1500);
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to delete account', 'error');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Account Status" eyebrow="Account">
        <div className="surface-soft p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 animate-pulse" />
          <p className="text-sm text-dark-600 dark:text-dark-300">Loading account status...</p>
        </div>
      </PageShell>
    );
  }

  const isDeactivated = accountStatus?.status === 'deactivated';
  const deactivatedDate = accountStatus?.deactivatedAt ? new Date(accountStatus.deactivatedAt) : null;

  return (
    <PageShell
      title="Account Status"
      eyebrow="Account"
      description={
        isDeactivated
          ? 'Your account is currently deactivated. You can reactivate it anytime.'
          : 'Manage your account status, deactivation, and permanent deletion.'
      }
    >
      <div className="space-y-6 max-w-2xl">
        {/* Account Status Summary */}
        <div className={`rounded-2xl border-2 p-6 ${
          isDeactivated 
            ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30' 
            : 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30'
        }`}>
          <div className="flex items-start gap-4">
            {isDeactivated ? (
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-1" />
            ) : (
              <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400 mt-1" />
            )}
            <div className="flex-1">
              <h2 className={`text-lg font-semibold ${
                isDeactivated 
                  ? 'text-amber-900 dark:text-amber-100' 
                  : 'text-green-900 dark:text-green-100'
              }`}>
                {isDeactivated ? 'Account Deactivated' : 'Account Active'}
              </h2>
              <p className={`mt-1 text-sm ${
                isDeactivated 
                  ? 'text-amber-800 dark:text-amber-200' 
                  : 'text-green-800 dark:text-green-200'
              }`}>
                {isDeactivated && deactivatedDate
                  ? `Deactivated on ${deactivatedDate.toLocaleDateString()}. You can reactivate your account at any time.`
                  : 'Your account is active and in good standing.'}
              </p>
            </div>
          </div>
        </div>

        {/* Deactivation Section */}
        {!isDeactivated && (
          <div className="rounded-2xl border border-dark-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-900/70">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-dark-900 dark:text-white">Deactivate Account</h3>
              <p className="mt-1 text-sm text-dark-600 dark:text-dark-400">
                Deactivate your account temporarily. Your profile, posts, and comments will be hidden, but you can reactivate anytime within 90 days.
              </p>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-dark-600 dark:text-dark-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-dark-400 dark:bg-dark-500" />
                Your profile will be hidden from public view
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-dark-400 dark:bg-dark-500" />
                Your posts and comments will be invisible to other users
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-dark-400 dark:bg-dark-500" />
                You can reactivate within 90 days; after that, your data will be permanently deleted
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-dark-400 dark:bg-dark-500" />
                Messages from deactivation onward will not be delivered
              </li>
            </ul>
            <Button
              variant="secondary"
              onClick={() => setDeactivateDialogOpen(true)}
              className="gap-2"
            >
              <Clock size={16} />
              Deactivate Account
            </Button>
          </div>
        )}

        {/* Reactivation Section */}
        {isDeactivated && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900/50 dark:bg-green-950/30">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Reactivate Account</h3>
              <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                Bring your account back to life. All your data will be restored and visible again.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setReactivateDialogOpen(true)}
              className="gap-2"
            >
              <RotateCcw size={16} />
              Reactivate Account
            </Button>
          </div>
        )}

        {/* Permanent Deletion Section */}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Permanently Delete Account</h3>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <ul className="space-y-2 mb-6 text-sm text-red-700 dark:text-red-300">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 dark:bg-red-500" />
              All your data will be permanently erased from our servers
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 dark:bg-red-500" />
              Your posts, comments, and messages will be deleted
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 dark:bg-red-500" />
              This action is final and cannot be reversed
            </li>
          </ul>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 size={16} />
            Delete Account Permanently
          </Button>
        </div>
      </div>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Your Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate your account? You can reactivate it anytime within 90 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder="Tell us why you're deactivating (optional)"
              className="w-full h-24 rounded-xl border border-dark-200 bg-white px-3 py-2 text-sm dark:border-dark-700 dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setDeactivateDialogOpen(false);
                setDeactivateReason('');
              }}
              disabled={deactivatingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleDeactivate}
              disabled={deactivatingAccount}
            >
              {deactivatingAccount ? 'Deactivating...' : 'Deactivate Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Confirmation Dialog */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Your Account</DialogTitle>
            <DialogDescription>
              Reactivate your account to restore access to your profile and content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setReactivateDialogOpen(false)} disabled={reactivatingAccount}>
              Cancel
            </Button>
            <Button onClick={handleReactivate} disabled={reactivatingAccount}>
              {reactivatingAccount ? 'Reactivating...' : 'Reactivate Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Deletion Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-dark-600 dark:text-dark-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
            <strong>Warning:</strong> All your posts, comments, messages, and profile information will be permanently erased.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)} disabled={deletingAccount}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePermanently} disabled={deletingAccount}>
              {deletingAccount ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
