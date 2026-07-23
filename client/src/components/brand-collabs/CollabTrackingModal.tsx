import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
} from '../ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../lib/api';

interface TrackedCollab {
  id: string;
  opportunityTitle: string;
  brandName: string;
  startDate: string;
  endDate: string;
  investment: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  engagementRate: number;
  posts: Array<{
    date: string;
    impressions: number;
    engagement: number;
    clicks: number;
  }>;
}

interface CollabTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collab?: TrackedCollab | null;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function CollabTrackingModal({
  isOpen,
  onClose,
  onSuccess,
  collab,
}: CollabTrackingModalProps) {
  const [formData, setFormData] = useState({
    opportunityTitle: '',
    brandName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    investment: '',
    revenue: '',
    impressions: '',
    clicks: '',
    conversions: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (collab) {
      setFormData({
        opportunityTitle: collab.opportunityTitle,
        brandName: collab.brandName,
        startDate: collab.startDate,
        endDate: collab.endDate,
        investment: collab.investment.toString(),
        revenue: collab.revenue.toString(),
        impressions: collab.impressions.toString(),
        clicks: collab.clicks.toString(),
        conversions: collab.conversions.toString(),
      });
    } else {
      setFormData({
        opportunityTitle: '',
        brandName: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        investment: '',
        revenue: '',
        impressions: '',
        clicks: '',
        conversions: '',
      });
    }
  }, [collab, isOpen]);

  const calculateROI = () => {
    const investment = parseFloat(formData.investment) || 0;
    const revenue = parseFloat(formData.revenue) || 0;
    if (investment === 0) return 0;
    return ((revenue - investment) / investment) * 100;
  };

  const calculateConversionRate = () => {
    const clicks = parseInt(formData.clicks) || 0;
    const conversions = parseInt(formData.conversions) || 0;
    if (clicks === 0) return 0;
    return (conversions / clicks) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        investment: parseFloat(formData.investment),
        revenue: parseFloat(formData.revenue),
        impressions: parseInt(formData.impressions),
        clicks: parseInt(formData.clicks),
        conversions: parseInt(formData.conversions),
      };

      if (collab) {
        await api.put(`/brand-collabs/tracked-collabs/${collab.id}`, payload);
      } else {
        await api.post('/brand-collabs/tracked-collabs', payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save collab tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const roi = calculateROI();
  const conversionRate = calculateConversionRate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {collab ? 'Edit Collab Tracking' : 'Track New Brand Collab'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opportunityTitle">Collab Title</Label>
              <Input
                id="opportunityTitle"
                value={formData.opportunityTitle}
                onChange={(e) => setFormData({ ...formData, opportunityTitle: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investment">Total Investment ($)</Label>
              <Input
                id="investment"
                type="number"
                step="0.01"
                value={formData.investment}
                onChange={(e) => setFormData({ ...formData, investment: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenue">Total Revenue ($)</Label>
              <Input
                id="revenue"
                type="number"
                step="0.01"
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="impressions">Total Impressions</Label>
              <Input
                id="impressions"
                type="number"
                value={formData.impressions}
                onChange={(e) => setFormData({ ...formData, impressions: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clicks">Total Clicks</Label>
              <Input
                id="clicks"
                type="number"
                value={formData.clicks}
                onChange={(e) => setFormData({ ...formData, clicks: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conversions">Total Conversions</Label>
              <Input
                id="conversions"
                type="number"
                value={formData.conversions}
                onChange={(e) => setFormData({ ...formData, conversions: e.target.value })}
                required
              />
            </div>
          </div>

          {/* ROI and Performance Metrics Preview */}
          {(parseFloat(formData.investment) > 0 || parseInt(formData.impressions) > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-gray-600">ROI</h4>
                  <p className={`text-2xl font-bold mt-1 ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {roi.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-gray-600">Conversion Rate</h4>
                  <p className="text-2xl font-bold mt-1 text-blue-600">
                    {conversionRate.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-gray-600">Cost Per Conversion</h4>
                  <p className="text-2xl font-bold mt-1 text-purple-600">
                    ${parseInt(formData.conversions) > 0 
                      ? (parseFloat(formData.investment) / parseInt(formData.conversions)).toFixed(2)
                      : '0.00'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : collab ? 'Update Collab' : 'Track Collab'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CollabROIDashboardProps {
  trackedCollabs: TrackedCollab[];
}

export function CollabROIDashboard({ trackedCollabs }: CollabROIDashboardProps) {
  if (trackedCollabs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No collabs tracked yet</h3>
        <p className="text-gray-600">Start tracking your brand partnerships to measure ROI.</p>
      </div>
    );
  }

  const overallStats = trackedCollabs.reduce(
    (acc, collab) => ({
      totalInvestment: acc.totalInvestment + collab.investment,
      totalRevenue: acc.totalRevenue + collab.revenue,
      totalImpressions: acc.totalImpressions + collab.impressions,
      totalClicks: acc.totalClicks + collab.clicks,
      totalConversions: acc.totalConversions + collab.conversions,
    }),
    { totalInvestment: 0, totalRevenue: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0 }
  );

  const overallROI = ((overallStats.totalRevenue - overallStats.totalInvestment) / overallStats.totalInvestment) * 100;
  const overallConversionRate = overallStats.totalClicks > 0 
    ? (overallStats.totalConversions / overallStats.totalClicks) * 100 
    : 0;

  const performanceData = trackedCollabs.map((collab) => ({
    name: collab.brandName,
    roi: parseFloat(calculateCollabROI(collab).toFixed(2)),
    investment: collab.investment,
    revenue: collab.revenue,
  }));

  const channelData = trackedCollabs.map((collab, index) => ({
    name: collab.opportunityTitle,
    value: collab.impressions,
  }));

  function calculateCollabROI(collab: TrackedCollab) {
    if (collab.investment === 0) return 0;
    return ((collab.revenue - collab.investment) / collab.investment) * 100;
  }

  const dailyPerformance = trackedCollabs.flatMap((collab) => 
    collab.posts.map(post => ({
      date: post.date,
      impressions: post.impressions,
      engagement: post.engagement,
    }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-0">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Investment</h3>
            <p className="text-3xl font-bold mt-2 text-blue-600">
              ${overallStats.totalInvestment.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-0">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">
              ${overallStats.totalRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className={`${overallROI >= 0 ? 'bg-emerald-50' : 'bg-red-50'} border-0`}>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Overall ROI</h3>
            <p className={`text-3xl font-bold mt-2 ${overallROI >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {overallROI.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-0">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Conversion Rate</h3>
            <p className="text-3xl font-bold mt-2 text-purple-600">
              {overallConversionRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ROI by Collab */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">ROI by Brand Collab</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="roi" fill="#10B981" name="ROI %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Investment vs Revenue */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Investment vs Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="investment" fill="#3B82F6" name="Investment $" />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue $" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Performance Trend */}
        {dailyPerformance.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Performance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="impressions" stroke="#3B82F6" name="Impressions" />
                  <Line type="monotone" dataKey="engagement" stroke="#10B981" name="Engagement" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Impressions Distribution */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Impressions Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tracked Collabs List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">All Tracked Collabs</h3>
        {trackedCollabs.map((collab) => {
          const collabROI = calculateCollabROI(collab);
          const collabConversionRate = collab.clicks > 0 ? (collab.conversions / collab.clicks) * 100 : 0;
          
          return (
            <Card key={collab.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{collab.opportunityTitle}</h4>
                      <span className="text-sm text-gray-500">by {collab.brandName}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Investment</p>
                        <p className="text-lg font-semibold">${collab.investment.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Revenue</p>
                        <p className="text-lg font-semibold text-green-600">${collab.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ROI</p>
                        <p className={`text-lg font-semibold ${collabROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {collabROI.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Conversions</p>
                        <p className="text-lg font-semibold text-blue-600">{collab.conversions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Impressions</p>
                        <p className="text-lg font-semibold">{collab.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Clicks</p>
                        <p className="text-lg font-semibold">{collab.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Conversion Rate</p>
                        <p className="text-lg font-semibold text-purple-600">{collabConversionRate.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-lg font-semibold">
                          {new Date(collab.startDate).toLocaleDateString()} - {new Date(collab.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}