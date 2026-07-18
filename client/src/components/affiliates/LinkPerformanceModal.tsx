import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api } from '../../../lib/api';

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

interface PerformanceData {
  clicksByDay: Array<{ date: string; count: number }>;
  conversionsByDay: Array<{ date: string; count: number; earnings: number }>;
  topCountries: Array<{ country: string; count: number }>;
}

interface LinkPerformanceModalProps {
  link: AffiliateLink;
  onClose: () => void;
}

export function LinkPerformanceModal({ link, onClose }: LinkPerformanceModalProps) {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, [link.id]);

  const loadPerformance = async () => {
    try {
      const response = await api.get(`/affiliates/links/${link.id}/performance`);
      setPerformance(response.data);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 my-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{link.name}</h3>
            <p className="text-sm text-gray-500">{link.destinationUrl}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{link.clickCount}</p>
              <p className="text-sm text-gray-600">Total Clicks</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{link.conversionCount}</p>
              <p className="text-sm text-gray-600">Conversions</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {link.clickCount > 0 ? ((link.conversionCount / link.clickCount) * 100).toFixed(2) : '0.00'}%
              </p>
              <p className="text-sm text-gray-600">Conversion Rate</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">${link.totalEarnings.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Earnings</p>
            </div>
          </div>

          {/* Clicks Over Time Chart */}
          {performance?.clicksByDay && performance.clicksByDay.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Clicks Over Time (Last 30 Days)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performance.clicksByDay.reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Earnings Over Time Chart */}
          {performance?.conversionsByDay && performance.conversionsByDay.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Earnings Over Time (Last 30 Days)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performance.conversionsByDay.reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="earnings" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Countries */}
          {performance?.topCountries && performance.topCountries.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Top Countries</h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performance.topCountries.map((country, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {country.country || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {country.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}