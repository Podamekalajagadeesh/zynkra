import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import CrisisEventsDashboard from '../../components/crisis/CrisisEventsDashboard';

const CrisisEventsPage: React.FC = () => {
  return (
    <PageShell
      eyebrow="Emergency"
      title="Crisis Events"
      description="Monitor active crisis events in your area. Stay informed, stay safe, and check in with friends and family."
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/security-checkup" className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Security Checkup
            </Link>
          </Button>
        </div>
      }
    >
      {/* Breadcrumb navigation */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-dark-500 dark:text-dark-400" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-dark-900 dark:text-white">Crisis Events</span>
      </nav>

      {/* Quick links */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          to="/security-checkup"
          className="inline-flex items-center gap-2 rounded-xl border border-dark-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-dark-700 transition-colors hover:bg-dark-50 hover:border-primary-300 dark:border-dark-700 dark:bg-dark-800/80 dark:text-dark-200 dark:hover:bg-dark-700"
        >
          <ShieldCheck className="h-4 w-4" />
          Security Checkup
        </Link>
        <Link
          to="/crisis-response-communities"
          className="inline-flex items-center gap-2 rounded-xl border border-dark-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-dark-700 transition-colors hover:bg-dark-50 hover:border-primary-300 dark:border-dark-700 dark:bg-dark-800/80 dark:text-dark-200 dark:hover:bg-dark-700"
        >
          <AlertTriangle className="h-4 w-4" />
          Crisis Response Communities
        </Link>
      </div>

      {/* Dashboard */}
      <CrisisEventsDashboard />
    </PageShell>
  );
};

export default CrisisEventsPage;
