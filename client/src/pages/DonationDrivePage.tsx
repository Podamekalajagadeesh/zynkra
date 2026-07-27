// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { DonationDrive, Donation } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Modal } from '../components/ui/modal';
import { Skeleton } from '../components/ui/skeleton';
import { Progress } from '../components/ui/progress';
import { MapPin, Calendar, ArrowLeft, Heart, Users } from 'lucide-react';

const DonationDrivePage = () => {
  const { id } = useParams<{ id: string }>();
  const [drive, setDrive] = useState<DonationDrive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState('');
  const [donateMessage, setDonateMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchDrive = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await api.get(`/donation-drives/${id}`);
        if (!cancelled) setDrive(response.data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDrive();
    return () => { cancelled = true; };
  }, [id]);

  const handleDonate = async () => {
    const amount = parseFloat(donateAmount);
    if (!amount || amount <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/donation-drives/${id}/donations`, {
        amount,
        message: donateMessage || undefined,
      });
      // Re-fetch drive data to update amounts and donations list
      const response = await api.get(`/donation-drives/${id}`);
      setDrive(response.data);
      setShowDonate(false);
      setDonateAmount('');
      setDonateMessage('');
      addToast(`Thank you for your $${amount.toFixed(2)} donation!`, 'success');
    } catch {
      addToast('Failed to process donation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Skeleton width={120} height={20} className="mb-6" />
        <Skeleton width="100%" height={200} className="mb-4 rounded-xl" />
        <Skeleton width="60%" height={24} className="mb-2" />
        <Skeleton width="100%" height={60} className="mb-4" />
        <Skeleton width="40%" height={16} className="mb-2" />
        <Skeleton width="30%" height={16} />
      </div>
    );
  }

  if (error || !drive) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Link to="/donation-drives" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-4">
          <ArrowLeft size={14} /> All Donation Drives
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950/30">
          <p className="text-red-700 dark:text-red-300 mb-2">Failed to load donation drive.</p>
          <p className="text-sm text-red-500 dark:text-red-400">
            The drive may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const goal = drive.goalAmount || 1000;
  const raised = drive.currentAmount || 0;
  const progress = Math.min((raised / goal) * 100, 100);
  const donations = drive.donations || [];
  const endDate = drive.endDate ? new Date(drive.endDate) : null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/donation-drives" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6">
        <ArrowLeft size={14} /> All Donation Drives
      </Link>

      {/* Hero / Image */}
      {drive.imageUrl && (
        <div className="mb-6 rounded-xl overflow-hidden">
          <img
            src={drive.imageUrl}
            alt={drive.title}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2 text-dark-900 dark:text-white">
        {drive.title}
      </h1>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-dark-500">
        {drive.location && (
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {drive.location}
          </span>
        )}
        {endDate && (
          <span className="flex items-center gap-1">
            <Calendar size={14} /> Ends {endDate.toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-dark-600 dark:text-dark-300">
              ${raised.toLocaleString()} raised
            </span>
            <span className="text-sm text-dark-500">
              Goal: ${goal.toLocaleString()}
            </span>
          </div>
          <Progress value={progress} className="h-3 mb-3" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-dark-400">
              {Math.round(progress)}% funded
            </span>
            <span className="text-xs text-dark-400">
              {donations.length} donation{donations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {drive.description && (
        <p className="text-dark-600 dark:text-dark-300 mb-6 leading-relaxed">
          {drive.description}
        </p>
      )}

      {/* Donate button */}
      <Button
        size="lg"
        className="w-full mb-8"
        onClick={() => setShowDonate(true)}
        icon={<Heart size={18} />}
      >
        Donate Now
      </Button>

      {/* Recent donations */}
      {donations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={18} />
            Recent Donations
          </h2>
          <div className="space-y-3">
            {donations.map((donation: Donation) => (
              <Card key={donation.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(donation.donor?.displayName || donation.donor?.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-dark-900 dark:text-white">
                          {donation.donor?.displayName || donation.donor?.username || 'Anonymous'}
                        </p>
                        <span className="text-xs text-dark-400">
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {donation.message && (
                        <p className="text-sm text-dark-500 mt-0.5 truncate">
                          "{donation.message}"
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">
                      ${Number(donation.amount).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Donate modal */}
      <Modal isOpen={showDonate} onClose={() => setShowDonate(false)}>
        <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">
          Make a Donation
        </h2>
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
            <Input
              type="number"
              placeholder="Amount"
              min="1"
              step="0.01"
              value={donateAmount}
              onChange={(e) => setDonateAmount(e.target.value)}
              className="pl-8 text-lg"
            />
          </div>
          <Textarea
            placeholder="Leave a message (optional)"
            value={donateMessage}
            onChange={(e) => setDonateMessage(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowDonate(false)}>
              Cancel
            </Button>
            <Button onClick={handleDonate} isLoading={submitting}>
              Donate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DonationDrivePage;