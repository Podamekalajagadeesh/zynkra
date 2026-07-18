import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Brain, Zap, Activity, Coins, TrendingUp, History, Lock, Send } from 'lucide-react';
import { api } from '../../../lib/api';

export const CreatorEconomyDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulatedAmount, setSimulatedAmount] = useState('0.05');

  const fetchStats = async () => {
    try {
      const response = await api.get('/neural-compensation/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch neural stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Simulate real-time streaming data updates
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const simulatePayment = async () => {
    try {
      await api.post('/neural-compensation/process', {
        creatorId: 'mock-creator-id', // Usually from context or URL
        amount: parseFloat(simulatedAmount),
        contentType: 'neural_stream',
      });
      alert(`Neural transaction of ${simulatedAmount} NEURO processed instantaneously!`);
      fetchStats();
    } catch (error) {
      alert('Transaction failed');
    }
  };

  if (loading && !stats) return <div className="p-8 text-center"><Activity className="animate-spin h-8 w-8 mx-auto text-blue-500 mb-4"/> Syncing with Neural Network...</div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            Creator Economy 4.0
          </h2>
          <p className="text-gray-500 mt-2">Direct neural compensation via instantaneous microtransactions.</p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-4 py-1 text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" /> Live Neural Sync Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-purple-100 font-medium text-sm uppercase tracking-wider">Total Neural Earnings</p>
              <h3 className="text-4xl font-bold mt-1">{stats?.totalEarned?.toFixed(4) || '0.0000'} <span className="text-lg text-purple-200">NEURO</span></h3>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <Coins className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex items-center text-sm text-green-300 font-medium">
            <TrendingUp className="h-4 w-4 mr-1" /> +12.5% this hour
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 font-medium text-sm uppercase tracking-wider">Active Consumers</p>
              <h3 className="text-4xl font-bold mt-1 text-gray-800">{stats?.activeStreams || 0}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Minds currently synced to your stream</p>
        </Card>

        <Card className="p-6 border-2 border-dashed border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Send className="h-4 w-4" />
            Simulate Neural Payment
          </h3>
          <div className="flex gap-2">
            <input 
              type="number" 
              step="0.01" 
              value={simulatedAmount}
              onChange={(e) => setSimulatedAmount(e.target.value)}
              className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <Button onClick={simulatePayment} className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Cryptographically signed via brainwave
          </p>
        </Card>
      </div>

      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
        <History className="h-5 w-5" /> Recent Microtransactions
      </h3>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Transaction ID</th>
                <th className="px-6 py-3 font-medium">Content Type</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentTransactions?.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {tx.id.split('-')[0]}...
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="capitalize">{tx.contentType.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-6 py-4 font-semibold text-purple-600">
                    +{tx.amount.toFixed(4)} NEURO
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-green-100 text-green-800 border-none">{tx.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No recent neural transactions detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
