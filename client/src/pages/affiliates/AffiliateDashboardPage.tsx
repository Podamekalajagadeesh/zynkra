import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { CreateLinkModal } from '../../components/affiliates/CreateLinkModal';
import { LinksList } from '../../components/affiliates/LinksList';
import { StatsCards } from '../../components/affiliates/StatsCards';

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  availableEarnings: number;
}

export function AffiliateDashboardPage() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const response = await api.get('/affiliates/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load affiliate stats:', error);
    }
  };

  const handleLinkCreated = () => {
    setShowCreateModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Marketing</h1>
          <p className="text-gray-600 mt-1">Track your commissions and manage your affiliate links</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Link
        </button>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="mt-8">
        <LinksList refreshTrigger={refreshTrigger} onLinkDeleted={() => setRefreshTrigger(prev => prev + 1)} />
      </div>

      {showCreateModal && (
        <CreateLinkModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleLinkCreated}
        />
      )}
    </div>
  );
}