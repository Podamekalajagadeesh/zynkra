import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LinkPerformanceModal } from './LinkPerformanceModal';

interface AffiliateLink {
  id: string;
  name: string;
  destinationUrl: string;
  slug: string;
  clickCount: number;
  conversionCount: number;
  totalEarnings: number;
  commissionRate: number;
  createdAt: string;
}

interface LinksListProps {
  refreshTrigger: number;
  onLinkDeleted: () => void;
}

export function LinksList({ refreshTrigger, onLinkDeleted }: LinksListProps) {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  useEffect(() => {
    loadLinks();
  }, [refreshTrigger]);

  const loadLinks = async () => {
    try {
      const response = await api.get('/affiliates/links');
      setLinks(response.data);
    } catch (error) {
      console.error('Failed to load affiliate links:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (link: AffiliateLink) => {
    const fullUrl = `${window.location.origin}/affiliates/r/${link.slug}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedLinkId(link.id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const deleteLink = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this affiliate link?')) return;
    
    try {
      await api.post(`/affiliates/links/${linkId}/delete`);
      onLinkDeleted();
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No affiliate links yet</h3>
        <p className="text-gray-600">Create your first affiliate link to start earning commissions.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Affiliate Links</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {links.map((link) => (
            <div key={link.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium text-gray-900">{link.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {link.commissionRate}% commission
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate max-w-xl">{link.destinationUrl}</p>
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="text-sm">
                      <span className="text-gray-500">Clicks: </span>
                      <span className="font-medium text-gray-900">{link.clickCount}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Conversions: </span>
                      <span className="font-medium text-gray-900">{link.conversionCount}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Earnings: </span>
                      <span className="font-medium text-green-600">${link.totalEarnings.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedLink(link)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => copyToClipboard(link)}
                    className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {copiedLinkId === link.id ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedLink && (
        <LinkPerformanceModal
          link={selectedLink}
          onClose={() => setSelectedLink(null)}
        />
      )}
    </>
  );
}