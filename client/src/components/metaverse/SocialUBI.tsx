import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Coins, UserCheck, Plus, TrendingUp, Trophy } from 'lucide-react';
import api from '../../lib/api';

interface ParticipationReward {
  id: string;
  amount: number;
  type: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface UBIDisbursement {
  id: string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  description?: string;
  createdAt: Date;
}

export const SocialUBI: React.FC = () => {
  const [rewards, setRewards] = useState<ParticipationReward[]>([]);
  const [disbursements, setDisbursements] = useState<UBIDisbursement[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [rewardsRes, totalRes, disbursementsRes, statsRes] = await Promise.all([
        api.get('/social-ubi/my-rewards'),
        api.get('/social-ubi/my-total'),
        api.get('/social-ubi/my-disbursements'),
        api.get('/social-ubi/stats'),
      ]);
      setRewards(rewardsRes.data);
      setTotal(totalRes.data);
      setDisbursements(disbursementsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddReward = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/social-ubi/reward', {
        amount: parseFloat(formData.get('amount') as string),
        type: formData.get('type') as string,
        description: formData.get('description') as string,
      });
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Failed to add reward', error);
    }
  };

  const getParticipationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      content_creation: 'Content Creation',
      moderation: 'Moderation',
      comment: 'Comment',
      like: 'Like',
      share: 'Share',
      group_engagement: 'Group Engagement',
    };
    return labels[type] || type;
  };

  if (loading && !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading Social UBI data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Coins className="h-8 w-8 text-purple-600" />
            Universal Basic Income from Social Participation
          </h2>
          <p className="text-gray-500 mt-2">
            Earn income for contributing to community content and moderation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Your Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-700">{total.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Global Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">
              {stats?.global?.totalRewards?.toFixed(2) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Global Disbursements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.global?.totalDisbursements?.toFixed(2) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rewards">
        <TabsList className="mb-6">
          <TabsTrigger value="rewards">Participation Rewards</TabsTrigger>
          <TabsTrigger value="disbursements">UBI Disbursements</TabsTrigger>
          <TabsTrigger value="add">Add Reward</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-purple-100 text-purple-800">
                      <Trophy className="h-3 w-3 mr-1 inline" />
                      {getParticipationTypeLabel(reward.type)}
                    </Badge>
                    <span className="font-semibold text-purple-600">+{reward.amount.toFixed(2)}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {reward.description && (
                    <p className="text-sm text-gray-600">{reward.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(reward.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
            {rewards.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No participation rewards yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="disbursements">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disbursements.map((disb) => (
              <Card key={disb.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-green-100 text-green-800">
                      <UserCheck className="h-3 w-3 mr-1 inline" />
                      UBI Disbursement
                    </Badge>
                    <span className="font-semibold text-green-600">+{disb.amount.toFixed(2)}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Period: {new Date(disb.periodStart).toLocaleDateString()} -{' '}
                    {new Date(disb.periodEnd).toLocaleDateString()}
                  </p>
                  {disb.description && (
                    <p className="text-sm text-gray-600 mt-1">{disb.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(disb.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
            {disbursements.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No UBI disbursements yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="add">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">Add Participation Reward</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddReward} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <Input name="amount" type="number" step="0.01" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participation Type
                  </label>
                  <select
                    name="type"
                    className="w-full border border-gray-300 rounded-md p-2"
                    required
                  >
                    <option value="content_creation">Content Creation</option>
                    <option value="moderation">Moderation</option>
                    <option value="comment">Comment</option>
                    <option value="like">Like</option>
                    <option value="share">Share</option>
                    <option value="group_engagement">Group Engagement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    name="description"
                    placeholder="Describe this participation"
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reward
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
