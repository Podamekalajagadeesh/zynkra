import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { DonationDrive } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Progress } from '../components/ui/progress';
import { EmptyState } from '../components/ui/empty-state';
import { Search, MapPin, Calendar, Heart } from 'lucide-react';

const DonationDrivesPage = () => {
  const [drives, setDrives] = useState<DonationDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const fetchDrives = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await api.get('/donation-drives');
        if (!cancelled) setDrives(response.data);
      } catch {
        if (!cancelled) {
          setError(true);
          addToast('Failed to load donation drives', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDrives();
    return () => { cancelled = true; };
  }, [addToast]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return drives;
    const q = searchQuery.toLowerCase();
    return drives.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.location?.toLowerCase().includes(q),
    );
  }, [drives, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton width={200} height={28} />
          <Skeleton width={240} height={44} className="rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800"
            >
              <Skeleton width="100%" height={120} className="mb-3 rounded-lg" />
              <Skeleton width="70%" height={16} className="mb-2" />
              <Skeleton width="50%" height={12} className="mb-2" />
              <Skeleton width="40%" height={12} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Donation Drives</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950/30">
          <p className="text-red-700 dark:text-red-300 mb-3">
            Something went wrong loading donation drives.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary-600 hover:underline font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Donation Drives</h1>
        <div className="relative w-60">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
          />
          <Input
            placeholder="Search drives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {drives.length === 0 ? (
        <EmptyState
          icon={<Heart size={40} />}
          title="No donation drives yet"
          description="Check back later for community-driven donation campaigns."
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-dark-500">
            No drives match "{searchQuery}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((drive) => {
            const goal = drive.goalAmount || 1000;
            const raised = drive.currentAmount || 0;
            const progress = Math.min((raised / goal) * 100, 100);
            const endDate = drive.endDate ? new Date(drive.endDate) : null;

            return (
              <Link to={`/donation-drives/${drive.id}`} key={drive.id}>
                <Card className="hover:shadow-lg transition-all duration-200 h-full group">
                  <CardContent className="p-0">
                    {drive.imageUrl ? (
                      <img
                        src={drive.imageUrl}
                        alt={drive.title}
                        className="w-full h-36 object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-br from-primary-100 to-cyan-100 dark:from-primary-900/30 dark:to-cyan-900/30 flex items-center justify-center rounded-t-xl">
                        <Heart
                          size={32}
                          className="text-primary-300 dark:text-primary-700"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-dark-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">
                        {drive.title}
                      </h3>

                      {drive.description && (
                        <p className="text-sm text-dark-500 mb-2 line-clamp-2">
                          {drive.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        {(drive.goalAmount != null || drive.currentAmount != null) && (
                          <>
                            <Progress value={progress} className="h-1.5" />
                            <div className="flex items-center justify-between text-xs text-dark-400">
                              <span>${raised.toLocaleString()} raised</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                          </>
                        )}

                        <div className="flex items-center gap-3 text-xs text-dark-500 pt-1">
                          {drive.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {drive.location}
                            </span>
                          )}
                          {endDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />{' '}
                              {endDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DonationDrivesPage;