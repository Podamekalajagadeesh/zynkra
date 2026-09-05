import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { AdminVerificationDashboard } from '../components/AdminVerificationDashboard';
import { AdminAppealDashboard } from '../components/AdminAppealDashboard';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function AdminVerificationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Check if user is admin
        if (!user || (user as any).role !== 'admin') {
          navigate('/');
          return;
        }
        setIsAdmin(true);
      } catch (error) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, navigate]);

  if (loading) {
    return (
      <PageShell title="Admin - Verification">
        <div className="text-center p-8">Loading...</div>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell title="Admin - Verification">
        <div className="text-center p-8 text-red-600">
          You do not have permission to access this page.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Verification Management"
      description="Review and manage user verification requests"
      eyebrow="Admin"
    >
      <div className="max-w-6xl">
        <AdminVerificationDashboard />
        <div className="mt-8">
          <AdminAppealDashboard />
        </div>
      </div>
    </PageShell>
  );
}
