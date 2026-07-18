import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { api } from '../../lib/api';
import { StatsCards } from '../../components/brand-collabs/StatsCards';
import { CreateBrandModal } from '../../components/brand-collabs/CreateBrandModal';
import { CreateOpportunityModal } from '../../components/brand-collabs/CreateOpportunityModal';
import { OpportunitiesList } from '../../components/brand-collabs/OpportunitiesList';
import { MyApplicationsList } from '../../components/brand-collabs/MyApplicationsList';
import { CollabTrackingModal, CollabROIDashboard } from '../../components/brand-collabs/CollabTrackingModal';

interface Brand {
  id: string;
  name: string;
}

interface CollabOpportunity {
  id: string;
  title: string;
  description: string;
  budget: number;
  paymentType: 'fixed' | 'commission' | 'hybrid';
  category: string;
  minFollowers: number;
  deadline: string;
  status: string;
  brand: {
    name: string;
    logoUrl?: string;
  };
}

interface CollabApplication {
  id: string;
  pitch: string;
  proposedRate: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt: string;
  opportunity: {
    title: string;
    brand: {
      name: string;
    };
  };
}

interface DashboardStats {
  totalBrands: number;
  totalOpportunities: number;
  totalApplications: number;
  acceptedApplications: number;
  creatorApplications: number;
  creatorAccepted: number;
}

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

export function BrandCollabsDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [opportunities, setOpportunities] = useState<CollabOpportunity[]>([]);
  const [myApplications, setMyApplications] = useState<CollabApplication[]>([]);
  const [trackedCollabs, setTrackedCollabs] = useState<TrackedCollab[]>([]);
  const [showCreateBrand, setShowCreateBrand] = useState(false);
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [showTrackCollab, setShowTrackCollab] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<TrackedCollab | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minBudgetFilter, setMinBudgetFilter] = useState('');
  const [maxBudgetFilter, setMaxBudgetFilter] = useState('');

  useEffect(() => {
    loadStats();
    loadBrands();
    loadOpportunities();
    loadMyApplications();
    loadTrackedCollabs();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const response = await api.get('/brand-collabs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load brand collabs stats:', error);
    }
  };

  const loadTrackedCollabs = async () => {
    try {
      const response = await api.get('/brand-collabs/tracked-collabs');
      setTrackedCollabs(response.data);
    } catch (error) {
      console.error('Failed to load tracked collabs:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await api.get('/brand-collabs/brands');
      setBrands(response.data);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const loadOpportunities = async () => {
    try {
      let url = '/brand-collabs/opportunities';
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);
      if (minBudgetFilter) params.append('minBudget', minBudgetFilter);
      if (maxBudgetFilter) params.append('maxBudget', maxBudgetFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      setOpportunities(response.data);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    }
  };

  const loadMyApplications = async () => {
    try {
      const response = await api.get('/brand-collabs/my-applications');
      setMyApplications(response.data);
    } catch (error) {
      console.error('Failed to load my applications:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const categories = ['Fashion', 'Technology', 'Lifestyle', 'Beauty', 'Fitness', 'Food & Beverage', 'Travel', 'Gaming'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Collab Marketplace</h1>
          <p className="text-gray-600 mt-1">Connect with brands and creators for partnerships</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowCreateBrand(true)} variant="secondary">
            Register Brand
          </Button>
          <Button onClick={() => setShowCreateOpportunity(true)} disabled={brands.length === 0}>
            Post Opportunity
          </Button>
          <Button onClick={() => {
            setSelectedCollab(null);
            setShowTrackCollab(true);
          }}>
            Track New Collab
          </Button>
        </div>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="mt-8">
        <Tabs defaultValue="browse">
          <TabsList className="mb-6">
            <TabsTrigger value="browse">Browse Opportunities</TabsTrigger>
            <TabsTrigger value="my-applications">My Applications</TabsTrigger>
            <TabsTrigger value="manage">Manage My Opportunities</TabsTrigger>
            <TabsTrigger value="roi-tracking">ROI Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Min budget"
                  value={minBudgetFilter}
                  onChange={(e) => setMinBudgetFilter(e.target.value)}
                  className="w-full md:w-32"
                />
                <Input
                  type="number"
                  placeholder="Max budget"
                  value={maxBudgetFilter}
                  onChange={(e) => setMaxBudgetFilter(e.target.value)}
                  className="w-full md:w-32"
                />
                <Button onClick={loadOpportunities}>Filter</Button>
              </div>
            </div>
            <OpportunitiesList opportunities={opportunities} onRefresh={handleRefresh} />
          </TabsContent>

          <TabsContent value="my-applications">
            <MyApplicationsList applications={myApplications} />
          </TabsContent>

          <TabsContent value="manage">
            {brands.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">🏷️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No brands registered yet</h3>
                <p className="text-gray-600 mb-4">Register your brand to start posting collaboration opportunities.</p>
                <Button onClick={() => setShowCreateBrand(true)}>Register Your First Brand</Button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold mb-4">Your Brands ({brands.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {brands.map(brand => (
                    <div key={brand.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="font-semibold text-gray-900">{brand.name}</h4>
                    </div>
                  ))}
                </div>
                <MyApplicationsList applications={myApplications} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {showCreateBrand && (
        <CreateBrandModal
          isOpen={showCreateBrand}
          onClose={() => setShowCreateBrand(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showCreateOpportunity && (
        <CreateOpportunityModal
          brands={brands}
          onClose={() => setShowCreateOpportunity(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showTrackCollab && (
        <CollabTrackingModal
          isOpen={showTrackCollab}
          onClose={() => setShowTrackCollab(false)}
          onSuccess={handleRefresh}
          collab={selectedCollab}
        />
      )}
    </div>
  );
}