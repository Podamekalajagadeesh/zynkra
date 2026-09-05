import { useEffect, useState } from 'react';
import { CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from './ui/button';

interface VerificationHistoryEntry {
  id: string;
  action: string;
  status: 'approved' | 'rejected' | 'pending' | 'appealed';
  timestamp: string;
  details?: string;
  reviewedBy?: string;
}

export function VerificationHistoryTimeline() {
  const [history, setHistory] = useState<VerificationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/users/me/verification-history');
        setHistory(res.data || []);
      } catch (error) {
        console.error('Failed to load verification history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-dark-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-900/70">
        <p className="text-sm text-dark-500">Loading history...</p>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="rounded-lg border border-dark-200 bg-white p-6 text-center dark:border-dark-700 dark:bg-dark-900/70">
        <Clock className="mx-auto h-8 w-8 text-dark-400 mb-2" />
        <p className="text-sm text-dark-500">No verification history yet</p>
      </div>
    );
  }

  const displayedHistory = expanded ? history : history.slice(0, 3);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'appealed':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'appealed':
        return 'Appeal Submitted';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="rounded-lg border border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-900/70">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-6 text-dark-900 dark:text-white">
          Verification History
        </h3>

        <div className="space-y-4">
          {displayedHistory.map((entry, index) => (
            <div key={entry.id} className="relative">
              {/* Timeline line */}
              {index < displayedHistory.length - 1 && (
                <div className="absolute left-2.5 top-10 bottom-0 w-0.5 bg-dark-200 dark:bg-dark-700" />
              )}

              {/* Timeline item */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 pt-1">{getStatusIcon(entry.status)}</div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-dark-900 dark:text-white">
                      {entry.action}
                    </p>
                    <span className="text-xs text-dark-500">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-dark-600 dark:text-dark-300 mt-1">
                    Status: <span className="font-semibold">{getStatusLabel(entry.status)}</span>
                  </p>
                  {entry.details && (
                    <p className="text-sm text-dark-600 dark:text-dark-300 mt-2">
                      {entry.details}
                    </p>
                  )}
                  {entry.reviewedBy && (
                    <p className="text-xs text-dark-500 mt-2">
                      Reviewed by: {entry.reviewedBy}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {history.length > 3 && (
          <div className="mt-6">
            <Button
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center gap-2"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show more ({history.length - 3} more)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
