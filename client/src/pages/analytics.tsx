import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { getAnalytics } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CompetitorAnalytics } from '../components/analytics/CompetitorAnalytics';

type PostPerformance = {
  postId: string;
  postContent: string;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  engagementRate: number;
  mediaUrl?: string;
  postType: string;
};

type ProductPerformance = {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
};

type AnalyticsData = {
  postEngagement: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalEngagements: number;
    topPerformingPosts: PostPerformance[];
  };
  profileAnalytics: {
    reach: number;
    totalReach: number;
    impressions: number;
    totalImpressions: number;
    engagementRate: string;
    followerCount: number;
    followerGrowth: number;
    followerGrowthRate: string;
  };
  audienceInsights: {
    locationData: Record<string, number>;
    activeTimes: Record<string, number>;
    totalAudience: number;
  };
  audienceDemographics: {
    totalFollowers: number;
    totalFollowing: number;
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    topInterests: Record<string, number>;
  };
  revenue: {
    totalTips: number;
    totalSubscriptions: number;
    socialCommerceRevenue: number;
    monthlyRevenue: number;
  };
  socialCommerce: {
    totalOrders: number;
    monthlyOrders: number;
    uniqueCustomers: number;
    repeatCustomers: number;
    averageOrderValue: number;
    productPerformance: ProductPerformance[];
    conversionRate: number;
  };
};

const EMPTY_ANALYTICS: AnalyticsData = {
  postEngagement: {
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalSaves: 0,
    totalEngagements: 0,
    topPerformingPosts: [],
  },
  profileAnalytics: {
    reach: 0,
    totalReach: 0,
    impressions: 0,
    totalImpressions: 0,
    engagementRate: "0.00",
    followerCount: 0,
    followerGrowth: 0,
    followerGrowthRate: "0.00",
  },
  audienceInsights: {
    locationData: {},
    activeTimes: {},
    totalAudience: 0,
  },
  audienceDemographics: {
    totalFollowers: 0,
    totalFollowing: 0,
    ageGroups: {},
    genderDistribution: {},
    topInterests: {},
  },
  revenue: {
    totalTips: 0,
    totalSubscriptions: 0,
    socialCommerceRevenue: 0,
    monthlyRevenue: 0,
  },
  socialCommerce: {
    totalOrders: 0,
    monthlyOrders: 0,
    uniqueCustomers: 0,
    repeatCustomers: 0,
    averageOrderValue: 0,
    productPerformance: [],
    conversionRate: 0,
  },
};

export const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalytics()
      .then((data) => {
        if (data && typeof data === 'object') {
          setAnalytics(data as AnalyticsData);
          return;
        }

        setAnalytics(null);
        setError('Analytics data is unavailable right now.');
      })
      .catch((err) => {
        console.error('Failed to fetch analytics:', err);
        setAnalytics(null);
        setError('You do not have access to analytics or the service is unavailable.');
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = analytics ?? EMPTY_ANALYTICS;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <PageShell title="Analytics">
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="space-y-4">
          <p className="text-sm text-dark-600 dark:text-dark-300">{error}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Profile Analytics Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Profile Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reach (30d)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.profileAnalytics.reach}</p>
                  <p className="text-sm text-gray-500">Total: {stats.profileAnalytics.totalReach}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Impressions (30d)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.profileAnalytics.impressions}</p>
                  <p className="text-sm text-gray-500">Total: {stats.profileAnalytics.totalImpressions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.profileAnalytics.engagementRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Follower Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.profileAnalytics.followerGrowth > 0 ? '+' : ''}{stats.profileAnalytics.followerGrowth}</p>
                  <p className="text-sm text-gray-500">{stats.profileAnalytics.followerGrowthRate}% growth</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Followers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.profileAnalytics.followerCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Following</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.audienceDemographics.totalFollowing}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Post Engagement Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Post Engagement</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Total Likes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.postEngagement.totalLikes}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.postEngagement.totalComments}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Shares</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.postEngagement.totalShares}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Saves</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.postEngagement.totalSaves}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Engagements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.postEngagement.totalEngagements}</p>
                </CardContent>
              </Card>
            </div>

            {/* Post Performance Chart - Engagement by Post */}
            {stats.postEngagement.topPerformingPosts.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Engagement by Post (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={stats.postEngagement.topPerformingPosts.slice(0, 10).map(post => ({
                        name: post.postContent.substring(0, 20) + (post.postContent.length > 20 ? '...' : ''),
                        likes: post.likes,
                        comments: post.comments,
                        shares: post.shares,
                        saves: post.saves
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="likes" stackId="a" fill="#8884d8" name="Likes" />
                      <Bar dataKey="comments" stackId="a" fill="#82ca9d" name="Comments" />
                      <Bar dataKey="shares" stackId="a" fill="#ffc658" name="Shares" />
                      <Bar dataKey="saves" stackId="a" fill="#0088fe" name="Saves" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Post Performance Table - Complete List */}
            {stats.postEngagement.topPerformingPosts.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">All Post Performance (sorted by engagement)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Post</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Type</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Created</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Impressions</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Reach</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Likes</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Comments</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Shares</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Saves</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Engagement Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.postEngagement.topPerformingPosts.map((post) => (
                        <tr key={post.postId} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="border border-gray-300 dark:border-gray-700 p-3 max-w-xs truncate" title={post.postContent}>
                            {post.mediaUrl && <img src={post.mediaUrl} alt="" className="w-10 h-10 object-cover inline-block mr-2 rounded" />}
                            {post.postContent.substring(0, 50)}{post.postContent.length > 50 ? '...' : ''}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3 capitalize">{post.postType}</td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3">{new Date(post.createdAt).toLocaleDateString()}</td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3">{post.impressions.toLocaleString()}</td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3">{post.reach.toLocaleString()}</td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3">{post.likes.toLocaleString()}</td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3">{post.comments.toLocaleString()}</td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3">{post.shares.toLocaleString()}</td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3">{post.saves.toLocaleString()}</td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">{post.engagementRate.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Audience Insights Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Audience Insights</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Active Times Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Times (Hour of Day)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(stats.audienceInsights.activeTimes).map(([hour, count]) => ({ hour: `${hour}:00`, count }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Location Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Location Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.audienceInsights.locationData).map(([location, value]) => ({ name: location, value }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#82ca9d"
                      >
                        {Object.entries(stats.audienceInsights.locationData).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#0088fe', '#00C49F'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Follower Demographic Breakdowns Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Follower Demographic Breakdowns</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Age Groups Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Age Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.audienceDemographics.ageGroups).length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(stats.audienceDemographics.ageGroups).map(([group, count]) => ({ name: group, count }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" name="Followers" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <p>No age data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gender Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Gender Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.audienceDemographics.genderDistribution).length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(stats.audienceDemographics.genderDistribution).map(([gender, value]) => ({ name: gender, value }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#82ca9d"
                        >
                          {Object.entries(stats.audienceDemographics.genderDistribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#8884d8', '#ffc658', '#0088fe', '#00C49F'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <p>No gender data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Interests Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.audienceDemographics.topInterests).length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={Object.entries(stats.audienceDemographics.topInterests)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([interest, count]) => ({ name: interest, count }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#00C49F" name="Followers" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <p>No interest data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Revenue Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Revenue Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatCurrency(stats.revenue.totalTips)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatCurrency(stats.revenue.totalSubscriptions)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Social Commerce Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatCurrency(stats.revenue.socialCommerceRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatCurrency(stats.revenue.monthlyRevenue)}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Social Commerce Analytics Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Social Commerce Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.socialCommerce.totalOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.socialCommerce.monthlyOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Unique Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.socialCommerce.uniqueCustomers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Repeat Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.socialCommerce.repeatCustomers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Average Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatCurrency(stats.socialCommerce.averageOrderValue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.socialCommerce.conversionRate.toFixed(2)}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Product Performance Table */}
            {stats.socialCommerce.productPerformance.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Product Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Product Name</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Units Sold</th>
                        <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.socialCommerce.productPerformance.map((product) => (
                        <tr key={product.productId} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="border border-gray-300 dark:border-gray-700 p-3">{product.productName}</td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3">{product.unitsSold}</td>
                          <td className="border border-gray-300 dark:border-gray-700 p-3">{formatCurrency(product.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Competitor Analytics Section */}
          <CompetitorAnalytics userAnalytics={analytics} />
        </div>
      )}
    </PageShell>
  );
};