import { useEffect, useState } from 'react';
import { Award, BadgeCheck, FileText, Link2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import { VerificationBadges } from '../components/VerificationBadge';
import { VerificationHistoryTimeline } from '../components/VerificationHistoryTimeline';
import { VerificationAppealForm } from '../components/VerificationAppealForm';
import { VerificationDocumentUpload } from '../components/VerificationDocumentUpload';

export default function VerificationAndTrustPage() {
  const [verification, setVerification] = useState<any>(null);
  const [trust, setTrust] = useState<any>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [documentStatus, setDocumentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [verificationRes, trustRes, linkedRes, documentRes] = await Promise.all([
          api.get('/users/me/verification-status'),
          api.get('/users/me/trust-indicator').catch(() => ({
            data: {
              accountId: '',
              verified: false,
              badges: [],
              trustScore: 0,
              updatedAt: new Date().toISOString(),
            },
          })),
          api.get('/users/me/account-dashboard').then((res) => res.data.linkedAccounts ?? []),
          api.get('/users/me/verification-history').catch(() => ({ data: [] })),
        ]);

        setVerification(verificationRes.data);
        setTrust(trustRes.data ?? { accountId: '', verified: false, badges: [], trustScore: 0, updatedAt: new Date().toISOString() });
        setLinkedAccounts(linkedRes);
        setDocumentStatus(documentRes.data?.[0] ?? { status: 'not_started' });
      } catch {
        setVerification({ verified: false, status: 'not_started', type: 'identity', appeals: [] });
        setTrust({ verified: false, badges: [], trustScore: 0 });
        setLinkedAccounts([]);
        setDocumentStatus({ status: 'not_started' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <PageShell title="Verification & Trust" description="Loading your verification profile...">
        <div className="rounded-2xl border border-dark-200 bg-white p-6 text-sm text-dark-600 dark:border-dark-700 dark:bg-dark-900/70 dark:text-dark-300">
          Loading verification and trust data...
        </div>
      </PageShell>
    );
  }

  const trustBadges = trust?.badges?.length ? trust.badges : ['Identity Verified'];

  return (
    <PageShell
      eyebrow="Identity"
      title="Verification & Trust"
      description="See your verification state, trust score, linked accounts, and document review progress."
    >
      <div className="space-y-6 max-w-4xl">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
            <div className="mb-3 inline-flex rounded-xl bg-primary-50 p-2 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <p className="text-sm text-dark-500 dark:text-dark-400">Verification status</p>
            <p className="mt-2 text-xl font-semibold text-dark-900 dark:text-white">
              {verification?.verified ? 'Verified' : (verification?.status ?? 'Not started')}
            </p>
          </div>

          <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
            <div className="mb-3 inline-flex rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Award className="h-5 w-5" />
            </div>
            <p className="text-sm text-dark-500 dark:text-dark-400">Trust score</p>
            <p className="mt-2 text-xl font-semibold text-dark-900 dark:text-white">
              {trust?.trustScore ?? 0}/100
            </p>
          </div>

          <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
            <div className="mb-3 inline-flex rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
              <Link2 className="h-5 w-5" />
            </div>
            <p className="text-sm text-dark-500 dark:text-dark-400">Linked accounts</p>
            <p className="mt-2 text-xl font-semibold text-dark-900 dark:text-white">
              {linkedAccounts.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-dark-900 dark:text-white">Trust Indicators</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {trustBadges.map((badge: string) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                >
                  {badge}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-dark-600 dark:text-dark-300">
              Trust rating is based on account verification, security health, document review, and linked identity signals.
            </p>
          </div>

          <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-dark-900 dark:text-white">Document Verification</h3>
            </div>
            <p className="text-sm text-dark-600 dark:text-dark-300">
              Status: <span className="font-medium">{documentStatus?.status ?? 'not_started'}</span>
            </p>
            <div className="mt-4">
              <Button variant="secondary" onClick={async () => {
                try {
                  const response = await api.post('/users/me/verification-request', {
                    type: 'identity',
                    reason: 'Identity verification requested from trust dashboard.',
                    links: [],
                  });
                  setVerification(response.data);
                } catch {
                  // Intentionally silent; request will show the validation state.
                }
              }}>
                Request verification
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">Linked Accounts</h3>
          </div>

          {linkedAccounts.length === 0 ? (
            <p className="text-sm text-dark-600 dark:text-dark-300">No external accounts linked yet.</p>
          ) : (
            <div className="space-y-3">
              {linkedAccounts.map((account: any) => (
                <div key={account.provider || account.id} className="flex items-center justify-between rounded-xl border border-dark-200 p-3 dark:border-dark-700">
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white">{account.provider}</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">{account.displayName || account.email || 'Connected account'}</p>
                  </div>
                  {account.isPrimary ? (
                    <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                      Primary
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Upload Section */}
        <div>
          <VerificationDocumentUpload />
        </div>

        {verification?.status === 'rejected' && verification?.id ? (
          <div>
            <VerificationAppealForm
              requestId={verification.id}
              rejectionReason={verification.reviewNote ?? undefined}
            />
          </div>
        ) : null}

        {/* Verification History Timeline */}
        <div>
          <VerificationHistoryTimeline />
        </div>
      </div>
    </PageShell>
  );
}
