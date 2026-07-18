import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Trees, Factory, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../lib/api';

interface CarbonTransaction {
  id: string;
  amount: number;
  type: 'emission' | 'offset';
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export const CarbonNeutralEconomy: React.FC = () => {
  const [transactions, setTransactions] = useState<CarbonTransaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [txRes, balanceRes, globalRes] = await Promise.all([
        api.get('/carbon-neutral/my-transactions'),
        api.get('/carbon-neutral/my-balance'),
        api.get('/carbon-neutral/stats'),
      ]);
      setTransactions(txRes.data);
      setBalance(balanceRes.data);
      setGlobalStats(globalRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/carbon-neutral/transaction', {
        amount: parseFloat(formData.get('amount') as string),
        type: formData.get('type') as string,
        description: formData.get('description') as string,
      });
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Failed to add transaction', error);
    }
  };

  if (loading && !globalStats) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading carbon neutral data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Trees className="h-8 w-8 text-green-600" />
            Carbon-Neutral Digital Economy
          </h2>
          <p className="text-gray-500 mt-2">Track and offset carbon emissions from platform transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Your Carbon Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {balance >= 0 ? (
                <span className="text-green-600">+{balance.toFixed(2)} kg</span>
              ) : (
                <span className="text-red-600">{balance.toFixed(2)} kg</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Emissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              -{globalStats?.totalEmissions?.toFixed(2) || 0} kg
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Offsets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              +{globalStats?.totalOffsets?.toFixed(2) || 0} kg
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList className="mb-6">
          <TabsTrigger value="transactions">Your Transactions</TabsTrigger>
          <TabsTrigger value="add">Add Transaction</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <Badge
                      className={
                        tx.type === 'emission' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }
                    >
                      {tx.type === 'emission' ? (
                        <>
                          <Factory className="h-3 w-3 mr-1 inline" />
                          Emission
                        </>
                      ) : (
                        <>
                          <Trees className="h-3 w-3 mr-1 inline" />
                          Offset
                        </>
                      )}
                    </Badge>
                    <span
                      className={`font-semibold ${
                        tx.type === 'emission' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {tx.type === 'emission' ? '-' : '+'}{tx.amount.toFixed(2)} kg
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {tx.description && <p className="text-sm text-gray-600">{tx.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
            {transactions.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No transactions yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="add">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">Add Carbon Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (kg CO₂)</label>
                  <Input name="amount" type="number" step="0.01" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    name="type"
                    className="w-full border border-gray-300 rounded-md p-2"
                    required
                  >
                    <option value="emission">Emission</option>
                    <option value="offset">Offset</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <Textarea name="description" placeholder="Describe this transaction" />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
