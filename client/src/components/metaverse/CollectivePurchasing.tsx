import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Users, Plus, ShoppingCart, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../lib/api';

interface CollectivePurchase {
  id: string;
  creatorId: string;
  creator: any;
  productId: string;
  productName: string;
  totalPrice: number;
  currentAmount: number;
  minParticipants: number;
  deadline?: Date;
  status: string;
  participants: Array<{ user: any; contributionAmount: number }>;
  createdAt: Date;
}

export const CollectivePurchasing: React.FC = () => {
  const [purchases, setPurchases] = useState<CollectivePurchase[]>([]);
  const [userPurchases, setUserPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPurchase, setNewPurchase] = useState<Partial<CollectivePurchase>>({
    minParticipants: 2,
  });

  const fetchPurchases = async () => {
    try {
      const [allPurchases, myPurchases] = await Promise.all([
        api.get('/collective-purchasing'),
        api.get('/collective-purchasing/user/my'),
      ]);
      setPurchases(allPurchases.data);
      setUserPurchases(myPurchases.data);
    } catch (error) {
      console.error('Failed to fetch purchases', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleCreatePurchase = async () => {
    try {
      await api.post('/collective-purchasing', newPurchase);
      fetchPurchases();
      setNewPurchase({ minParticipants: 2 });
    } catch (error) {
      console.error('Failed to create purchase', error);
    }
  };

  const handleJoinPurchase = async (id: string, amount: number) => {
    try {
      await api.post(`/collective-purchasing/${id}/join`, { amount });
      fetchPurchases();
    } catch (error) {
      console.error('Failed to join purchase', error);
    }
  };

  const handleCancelPurchase = async (id: string) => {
    try {
      await api.post(`/collective-purchasing/${id}/cancel`);
      fetchPurchases();
    } catch (error) {
      console.error('Failed to cancel purchase', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { color: string; label: string; icon?: React.ElementType }
    > = {
      funding: { color: 'bg-blue-100 text-blue-800', label: 'Funding' },
      funded: { color: 'bg-green-100 text-green-800', label: 'Funded' },
      completed: { color: 'bg-purple-100 text-purple-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    const cfg = config[status] || config.funding;
    return <Badge className={cfg.color}>{cfg.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-500" />
            Shared Collective Purchasing
          </h2>
          <p className="text-gray-500 mt-2">
            Pool resources with other users to buy virtual or physical assets collectively
          </p>
        </div>
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="mb-6">
          <TabsTrigger value="browse">Browse Purchases</TabsTrigger>
          <TabsTrigger value="my-purchases">My Purchases</TabsTrigger>
          <TabsTrigger value="create">Create Purchase</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Loading collective purchases...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.map((purchase) => (
                <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold">
                        {purchase.productName}
                      </CardTitle>
                      {getStatusBadge(purchase.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total Price:</span>
                      <span className="font-semibold">{purchase.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Current Amount:</span>
                      <span className="font-semibold text-blue-600">
                        {purchase.currentAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${(purchase.currentAmount / purchase.totalPrice) * 100}%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>
                        {purchase.participants?.length || 0} / {purchase.minParticipants}{' '}
                        participants
                      </span>
                    </div>

                    {purchase.deadline && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Deadline: {new Date(purchase.deadline).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Amount to contribute"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && purchase.status === 'funding') {
                              const input = e.target as HTMLInputElement;
                              handleJoinPurchase(purchase.id, parseFloat(input.value));
                            }
                          }}
                        />
                      </div>
                      {purchase.status === 'funding' && (
                        <Button onClick={() => {
                          const input = (
                            document.querySelector(`[placeholder="Amount to contribute"]`) as HTMLInputElement
                          );
                          handleJoinPurchase(purchase.id, parseFloat(input.value));
                        }}>
                          Join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {purchases.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No collective purchases yet</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-purchases">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPurchases.map((item) => (
              <Card
                key={item.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    {item.collectivePurchase?.productName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Your contribution: {item.contributionAmount.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
            {userPurchases.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">You haven't joined any collective purchases</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">Create Collective Purchase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name
                </label>
                <Input
                  value={newPurchase.productName || ''}
                  onChange={(e) =>
                    setNewPurchase({ ...newPurchase, productName: e.target.value })
                  }
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID
                </label>
                <Input
                  value={newPurchase.productId || ''}
                  onChange={(e) =>
                    setNewPurchase({ ...newPurchase, productId: e.target.value })
                  }
                  placeholder="Enter product ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Price
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPurchase.totalPrice || ''}
                  onChange={(e) =>
                    setNewPurchase({
                      ...newPurchase,
                      totalPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Participants
                </label>
                <Input
                  type="number"
                  min="2"
                  value={newPurchase.minParticipants || 2}
                  onChange={(e) =>
                    setNewPurchase({
                      ...newPurchase,
                      minParticipants: parseInt(e.target.value) || 2,
                    })
                  }
                />
              </div>

              <Button onClick={handleCreatePurchase} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Purchase
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
