import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { api } from '../../lib/api';
import { 
  Building2, Users, Share2, TrendingUp, DollarSign, Plus, Copy, CheckCircle2, 
  MapPin, Home, Globe, Lock, ShieldCheck, Percent, Calendar, Gift, Coins,
  ArrowUpRight, Users2, ExternalLink
} from 'lucide-react';

interface LandParcel {
  id: string;
  worldId: string;
  worldName: string;
  parcelId: string;
  coordinates: { x: number; y: number };
  size: number; // in square meters
  totalValue: number; // in USD
  currentValue: number;
  owners: CoOwner[];
  revenueShare: number; // percentage of total revenue this parcel generates
  monthlyRevenue: number;
  lastTransactionDate: Date;
  imageUrl: string;
  isDeveloped: boolean;
  developmentType?: 'commercial' | 'residential' | 'entertainment' | 'event';
  blockchainNetwork: string;
  tokenContractAddress: string;
}

interface CoOwner {
  userId: string;
  username: string;
  avatarUrl: string;
  ownershipPercentage: number;
  walletAddress: string;
  joinDate: Date;
  totalEarned: number;
}

interface PropertyListing {
  id: string;
  parcelId: string;
  worldName: string;
  sharesAvailable: number;
  sharePrice: number;
  minInvestment: number;
  totalShares: number;
  currentSharesSold: number;
  projectedAnnualReturn: number;
  description: string;
  imageUrl: string;
  endDate: Date;
}

const VirtualRealEstateCoOwnership: React.FC = () => {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<PropertyListing | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [activeTab, setActiveTab] = useState('my-properties');

  // User's owned virtual real estate parcels
  const [userParcels, setUserParcels] = useState<LandParcel[]>([]);
  // Available investment properties
  const [availableListings, setAvailableListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [parcelsRes, listingsRes] = await Promise.all([
          api.get('/virtual-real-estate/my-properties'),
          api.get('/virtual-real-estate/listings')
        ]);
        
        // Transform date strings to Date objects
        const parcels = parcelsRes.data.map((p: any) => ({
          ...p,
          lastTransactionDate: new Date(p.lastTransactionDate || Date.now()),
          owners: p.owners.map((o: any) => ({
            ...o,
            joinDate: new Date(o.joinDate)
          }))
        }));

        const listings = listingsRes.data.map((l: any) => ({
          ...l,
          endDate: new Date(l.endDate)
        }));

        setUserParcels(parcels);
        setAvailableListings(listings);
      } catch (error) {
        console.error('Failed to fetch virtual real estate data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate user's portfolio metrics
  const totalPortfolioValue = userParcels.reduce((sum, parcel) => {
    const userShare = parcel.currentValue * (parcel.owners.find(o => o.userId === user?.id)?.ownershipPercentage || 0) / 100;
    return sum + userShare;
  }, 0);

  const totalMonthlyRevenue = userParcels.reduce((sum, parcel) => {
    const userShare = parcel.monthlyRevenue * (parcel.owners.find(o => o.userId === user?.id)?.ownershipPercentage || 0) / 100;
    return sum + userShare;
  }, 0);

  const totalValueGrowth = userParcels.reduce((sum, parcel) => {
    const userInitial = parcel.totalValue * (parcel.owners.find(o => o.userId === user?.id)?.ownershipPercentage || 0) / 100;
    const userCurrent = parcel.currentValue * (parcel.owners.find(o => o.userId === user?.id)?.ownershipPercentage || 0) / 100;
    return sum + (userCurrent - userInitial);
  }, 0);

  const copyContractAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleInvest = async () => {
    if (!selectedListing || !investmentAmount || parseFloat(investmentAmount) < selectedListing.minInvestment) {
      alert(`Minimum investment is $${selectedListing?.minInvestment}`);
      return;
    }
    if (!wallet) {
      alert('Please connect your wallet first to invest in virtual real estate');
      return;
    }

    try {
      await api.post('/virtual-real-estate/invest', {
        listingId: selectedListing.id,
        amount: parseFloat(investmentAmount)
      });
      alert(`Successfully invested $${investmentAmount} in ${selectedListing.worldName}! Your fractional ownership has been recorded on the blockchain.`);
      setIsInvestModalOpen(false);
      setInvestmentAmount('');
      setSelectedListing(null);
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Investment failed:', error);
      alert('Investment failed. Please try again.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Virtual Real Estate Co-Ownership</h1>
        <p className="text-gray-600 dark:text-gray-400">Collectively own and develop social spaces in the metaverse with fractional ownership and revenue sharing</p>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Portfolio Value</h3>
            <Home className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalPortfolioValue)}</p>
          <p className="text-sm text-green-500 flex items-center mt-1">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            +{((totalValueGrowth / (totalPortfolioValue - totalValueGrowth)) * 100).toFixed(1)}% all time
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Revenue</h3>
            <Coins className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalMonthlyRevenue)}</p>
          <p className="text-sm text-gray-500 mt-1">Passive income from properties</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Properties Owned</h3>
            <Building2 className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold">{userParcels.length}</p>
          <p className="text-sm text-gray-500 mt-1">Across {new Set(userParcels.map(p => p.blockchainNetwork)).size} blockchains</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earned</h3>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(userParcels.reduce((sum, p) => {
            const owner = p.owners.find(o => o.userId === user?.id);
            return sum + (owner?.totalEarned || 0);
          }, 0))}</p>
          <p className="text-sm text-gray-500 mt-1">Lifetime dividends & appreciation</p>
        </Card>
      </div>

      <Tabs defaultValue="my-properties" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
          <TabsTrigger value="my-properties" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            My Properties
          </TabsTrigger>
          <TabsTrigger value="invest" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Invest More
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-properties">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userParcels.map(parcel => {
              const userOwner = parcel.owners.find(o => o.userId === user?.id);
              return (
                <Card key={parcel.id} className="overflow-hidden">
                  <div className="relative h-48 bg-gray-200 dark:bg-gray-800">
                    <img 
                      src={parcel.imageUrl} 
                      alt={parcel.worldName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-white mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>Coordinates: {parcel.coordinates.x}, {parcel.coordinates.y}</span>
                        <Badge className="ml-auto bg-blue-500">{parcel.blockchainNetwork}</Badge>
                      </div>
                      <h3 className="text-white font-semibold text-lg">{parcel.worldName}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Your Ownership</p>
                        <p className="text-xl font-bold flex items-center">
                          <Percent className="h-5 w-5 mr-1 text-green-500" />
                          {userOwner?.ownershipPercentage}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Value</p>
                        <p className="text-xl font-bold">{formatCurrency(parcel.currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                        <p className="text-xl font-bold text-green-600">+{formatCurrency(parcel.monthlyRevenue * (userOwner?.ownershipPercentage || 0) / 100)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Earned</p>
                        <p className="text-xl font-bold">{formatCurrency(userOwner?.totalEarned || 0)}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Co-Owners</p>
                      <div className="flex -space-x-2">
                        {parcel.owners.map((owner, idx) => (
                          <img 
                            key={owner.userId}
                            src={owner.avatarUrl} 
                            alt={owner.username}
                            className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900"
                            title={`${owner.username} - ${owner.ownershipPercentage}%`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="secondary" 
                        className="flex-1"
                        onClick={() => copyContractAddress(parcel.tokenContractAddress)}
                      >
                        {copiedAddress === parcel.tokenContractAddress ? (
                          <><CheckCircle2 className="h-4 w-4 mr-2" /> Copied!</>
                        ) : (
                          <><Copy className="h-4 w-4 mr-2" /> Copy Contract</>
                        )}
                      </Button>
                      <Button variant="default" className="flex-1">
                        <ExternalLink className="h-4 w-4 mr-2" /> Visit World
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="invest">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {availableListings.map(listing => {
              const progress = (listing.currentSharesSold / listing.totalShares) * 100;
              const daysLeft = Math.ceil((listing.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              
              return (
                <Card key={listing.id} className="overflow-hidden">
                  <div className="relative h-40 bg-gray-200 dark:bg-gray-800">
                    <img 
                      src={listing.imageUrl} 
                      alt={listing.worldName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-green-500">{listing.projectedAnnualReturn}% APY</Badge>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-white font-semibold text-lg">{listing.worldName}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{listing.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Share Price</p>
                        <p className="font-bold">${listing.sharePrice}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Min Investment</p>
                        <p className="font-bold">${listing.minInvestment}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>{listing.currentSharesSold.toLocaleString()} / {listing.totalShares.toLocaleString()} shares sold</span>
                        <span className="text-orange-500">{daysLeft}d left</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <Dialog open={isInvestModalOpen && selectedListing?.id === listing.id} onOpenChange={(open) => {
                      setIsInvestModalOpen(open);
                      if (!open) setSelectedListing(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          onClick={() => setSelectedListing(listing)}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Invest Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invest in {listing.worldName}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Investment Amount (USD)</Label>
                            <Input 
                              type="number" 
                              min={listing.minInvestment}
                              step={listing.sharePrice}
                              value={investmentAmount}
                              onChange={(e) => setInvestmentAmount(e.target.value)}
                              placeholder={`Minimum $${listing.minInvestment}`}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              You will receive approximately {Math.floor(parseFloat(investmentAmount || '0') / listing.sharePrice)} shares
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Projected annual return</span>
                              <span className="font-bold text-green-600">
                                +${((parseFloat(investmentAmount || '0') * listing.projectedAnnualReturn) / 100).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Your ownership share</span>
                              <span className="font-bold">
                                {((parseFloat(investmentAmount || '0') / (listing.totalShares * listing.sharePrice)) * 100).toFixed(4)}%
                              </span>
                            </div>
                          </div>
                          <Button className="w-full" onClick={handleInvest}>
                            <DollarSign className="h-4 w-4 mr-2" /> Confirm Investment
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VirtualRealEstateCoOwnership;