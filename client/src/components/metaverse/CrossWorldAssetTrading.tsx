import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { ArrowRightLeft, Plus, CheckCircle, XCircle, Gift } from 'lucide-react';
import api from '../../lib/api';

interface Trade {
  id: string;
  sellerId: string;
  seller?: any;
  buyerId?: string;
  buyer?: any;
  offeredAssets: string[];
  requestedAssets: string[];
  price: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

export const CrossWorldAssetTrading: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTrade, setNewTrade] = useState<Partial<Trade>>({
    offeredAssets: [],
    requestedAssets: [],
    price: 0,
    currency: 'GLOBAL_COIN',
  });

  const fetchTrades = async () => {
    try {
      const [publicTrades, personalTrades] = await Promise.all([
        api.get('/cross-world-trading'),
        api.get('/cross-world-trading/my'),
      ]);
      setTrades(publicTrades.data);
      setUserTrades(personalTrades.data);
    } catch (error) {
      console.error('Failed to fetch trades', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleCreateTrade = async () => {
    try {
      await api.post('/cross-world-trading', newTrade);
      fetchTrades();
      setNewTrade({
        offeredAssets: [],
        requestedAssets: [],
        price: 0,
        currency: 'GLOBAL_COIN',
      });
    } catch (error) {
      console.error('Failed to create trade', error);
    }
  };

  const handleAcceptTrade = async (id: string) => {
    try {
      await api.post(`/cross-world-trading/${id}/accept`);
      fetchTrades();
    } catch (error) {
      console.error('Failed to accept trade', error);
    }
  };

  const handleCancelTrade = async (id: string) => {
    try {
      await api.post(`/cross-world-trading/${id}/cancel`);
      fetchTrades();
    } catch (error) {
      console.error('Failed to cancel trade', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline', color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      completed: { variant: 'default', color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { variant: 'outline', color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-8 w-8 text-blue-500" />
            Cross-World Asset Trading
          </h2>
          <p className="text-gray-500 mt-2">
            Buy, sell, and trade digital assets across all metaverse platforms with GLOBAL_COIN
          </p>
        </div>
      </div>

      <Tabs defaultValue="marketplace">
        <TabsList className="mb-6">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="my-trades">My Trades</TabsTrigger>
          <TabsTrigger value="create-trade">Create Trade</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Loading marketplace...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trades.map((trade) => (
                <Card key={trade.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold">
                      Trade #{trade.id.slice(0, 8)}
                    </CardTitle>
                    {getStatusBadge(trade.status)}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Gift className="h-4 w-4" />
                        <span>Offering:</span>
                        <span className="font-medium">
                          {trade.offeredAssets.length} assets
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Gift className="h-4 w-4" />
                        <span>Requesting:</span>
                        <span className="font-medium">
                          {trade.requestedAssets.length} assets
                        </span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {trade.price} {trade.currency}
                      </div>
                    </div>
                    {trade.status === 'pending' && (
                      <Button
                        className="w-full"
                        onClick={() => handleAcceptTrade(trade.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Trade
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {trades.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No trades available in marketplace</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-trades">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userTrades.map((trade) => (
              <Card key={trade.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold">
                    Trade #{trade.id.slice(0, 8)}
                  </CardTitle>
                  {getStatusBadge(trade.status)}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Gift className="h-4 w-4" />
                      <span>Offering:</span>
                      <span className="font-medium">
                        {trade.offeredAssets.length} assets
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Gift className="h-4 w-4" />
                      <span>Requesting:</span>
                      <span className="font-medium">
                        {trade.requestedAssets.length} assets
                      </span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {trade.price} {trade.currency}
                    </div>
                  </div>
                  {trade.status === 'pending' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleCancelTrade(trade.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Trade
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {userTrades.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No trades yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create-trade">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">Create New Trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offered Assets (comma separated IDs)
                </label>
                <Input
                  value={newTrade.offeredAssets?.join(', ') || ''}
                  onChange={(e) =>
                    setNewTrade({
                      ...newTrade,
                      offeredAssets: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="asset1, asset2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Assets (comma separated IDs)
                </label>
                <Input
                  value={newTrade.requestedAssets?.join(', ') || ''}
                  onChange={(e) =>
                    setNewTrade({
                      ...newTrade,
                      requestedAssets: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="asset3, asset4"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <Input
                    type="number"
                    value={newTrade.price || 0}
                    onChange={(e) =>
                      setNewTrade({ ...newTrade, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <Input
                    value={newTrade.currency || 'GLOBAL_COIN'}
                    onChange={(e) =>
                      setNewTrade({ ...newTrade, currency: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleCreateTrade} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Trade
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
