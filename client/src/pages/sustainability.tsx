import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Leaf, TreeDeciduous, TrendingUp, Recycle, Globe, Award } from 'lucide-react';
import { formatCarbonEmissions, getPlatformSustainabilityMetrics } from '../lib/carbonCalculator';
import { Badge } from '../components/ui/badge';
import { api } from '../lib/api';

type UserContentEmissions = {
  postId: string;
  postType: string;
  createdAt: string;
  emissions: number;
  offset: number;
  netEmissions: number;
  sustainabilityScore: number;
};

type UserSustainabilityData = {
  totalEmissions: number;
  totalOffset: number;
  netEmissions: number;
  totalEmissionsSaved: number;
  averageSustainabilityScore: number;
  monthlyEmissions: { month: string; emissions: number; offset: number }[];
  contentBreakdown: { type: string; emissions: number; count: number }[];
  userRank: number;
  totalUsers: number;
  achievements: { id: string; name: string; description: string; unlockedAt: string | null }[];
  recentContent: UserContentEmissions[];
};

const EMPTY_SUSTAINABILITY_DATA: UserSustainabilityData = {
  totalEmissions: 0,
  totalOffset: 0,
  netEmissions: 0,
  totalEmissionsSaved: 0,
  averageSustainabilityScore: 0,
  monthlyEmissions: [],
  contentBreakdown: [],
  userRank: 0,
  totalUsers: 0,
  achievements: [],
  recentContent: [],
};

// Generate realistic demo data that varies each session
function generateDemoSustainabilityData(): UserSustainabilityData {
  const rand = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const monthlyEmissions = months.map((month) => {
    const emissions = rand(8, 20);
    return { month, emissions, offset: Math.round(emissions * 0.4 * 10) / 10 };
  });
  const totalEmissions = monthlyEmissions.reduce((s, m) => s + m.emissions, 0);
  const totalOffset = monthlyEmissions.reduce((s, m) => s + m.offset, 0);
  const videoCount = Math.floor(Math.random() * 10) + 5;
  const imageCount = Math.floor(Math.random() * 40) + 20;
  const audioCount = Math.floor(Math.random() * 10) + 2;
  const textCount = Math.floor(Math.random() * 50) + 30;
  const achievements = [
    { id: 'first-post', name: 'First Step', description: 'Created your first piece of content', unlockedAt: '2025-01-15' },
    { id: 'eco-warrior', name: 'Eco Warrior', description: 'Maintained an average sustainability score above 70 for 3 months', unlockedAt: Math.random() > 0.3 ? '2025-04-20' : null },
    { id: 'carbon-cutter', name: 'Carbon Cutter', description: 'Reduced your monthly emissions by 50%', unlockedAt: Math.random() > 0.5 ? '2025-10-05' : null },
    { id: 'tree-planter', name: 'Tree Planter', description: 'Your usage has contributed to planting 10 trees', unlockedAt: null },
  ];
  return {
    totalEmissions: Math.round(totalEmissions * 10) / 10,
    totalOffset: Math.round(totalOffset * 10) / 10,
    netEmissions: Math.round((totalEmissions - totalOffset) * 10) / 10,
    totalEmissionsSaved: rand(20, 60),
    averageSustainabilityScore: Math.floor(Math.random() * 25) + 65,
    monthlyEmissions,
    contentBreakdown: [
      { type: 'video', emissions: rand(50, 90), count: videoCount },
      { type: 'image', emissions: rand(20, 45), count: imageCount },
      { type: 'audio', emissions: rand(5, 15), count: audioCount },
      { type: 'text', emissions: rand(2, 8), count: textCount },
    ],
    userRank: Math.floor(Math.random() * 5000) + 500,
    totalUsers: 150000,
    achievements,
    recentContent: [
      { postId: '1', postType: 'video', createdAt: '2025-10-20', emissions: rand(1, 4), offset: rand(0.5, 1.5), netEmissions: rand(0.5, 2.5), sustainabilityScore: Math.floor(Math.random() * 20) + 75 },
      { postId: '2', postType: 'image', createdAt: '2025-10-18', emissions: rand(0.005, 0.03), offset: rand(0.002, 0.012), netEmissions: rand(0.003, 0.018), sustainabilityScore: Math.floor(Math.random() * 10) + 90 },
      { postId: '3', postType: 'video', createdAt: '2025-10-15', emissions: rand(1, 3), offset: rand(0.4, 1.2), netEmissions: rand(0.6, 1.8), sustainabilityScore: Math.floor(Math.random() * 15) + 80 },
      { postId: '4', postType: 'text', createdAt: '2025-10-12', emissions: rand(0.0005, 0.002), offset: rand(0.0002, 0.0008), netEmissions: rand(0.0003, 0.0012), sustainabilityScore: Math.floor(Math.random() * 5) + 95 },
    ],
  };
}

const formatTooltipValue = (value: number | string | readonly (number | string)[] | undefined) => {
  if (typeof value === 'number') {
    return [`${value.toFixed(1)} kg CO2e`];
  }

  if (typeof value === 'string') {
    return [`${value} kg CO2e`];
  }

  if (Array.isArray(value) && value.length > 0) {
    const firstValue = value[0];
    return [typeof firstValue === 'number' ? `${firstValue.toFixed(1)} kg CO2e` : `${firstValue} kg CO2e`];
  }

  return ['0 kg CO2e'];
};

export const SustainabilityPage = () => {
  const [sustainabilityData, setSustainabilityData] = useState<UserSustainabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'demo'>('demo');
  const platformMetrics = getPlatformSustainabilityMetrics();

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/analytics/sustainability');
        if (cancelled) return;
        setSustainabilityData(res.data);
        setDataSource('api');
      } catch {
        // No real API endpoint yet -- fall back to dynamic demo data
        if (!cancelled) {
          setSustainabilityData(generateDemoSustainabilityData());
          setDataSource('demo');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const data = sustainabilityData ?? EMPTY_SUSTAINABILITY_DATA;

  if (loading) {
    return (
      <PageShell title="Sustainability Dashboard">
        <div className="space-y-8">
          {/* Skeleton: platform impact cards */}
          <div>
            <div className="h-7 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
          {/* Skeleton: personal impact cards */}
          <div>
            <div className="h-7 w-56 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-8 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-3 w-36 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
          {/* Skeleton: chart area */}
          <Card>
            <div className="p-6 space-y-4">
              <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-80 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </div>
          </Card>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Sustainability Dashboard">
        <div className="text-center py-16 space-y-4">
          <p className="text-sm text-dark-600 dark:text-dark-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm underline opacity-70 hover:opacity-100"
          >
            Retry
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Sustainability Dashboard">
      <div className="space-y-8">
        {dataSource === 'demo' && (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
            Showing demo data for illustration. Real sustainability tracking will be available soon.
          </div>
        )}
        {/* Platform Impact Overview */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Platform Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Globe className="h-4 w-4 text-green-600" />
                  Renewable Energy
                </div>
                <p className="text-3xl font-bold">{platformMetrics.renewableEnergyPercentage}%</p>
                <p className="text-sm text-gray-500">of energy from renewables</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Recycle className="h-4 w-4 text-blue-600" />
                  Emissions Offset
                </div>
                <p className="text-3xl font-bold">{(platformMetrics.totalEmissionsOffsetToDate / 1000).toFixed(0)}k</p>
                <p className="text-sm text-gray-500">tonnes of CO2e offset to date</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <TreeDeciduous className="h-4 w-4 text-green-700" />
                  Trees Planted
                </div>
                <p className="text-3xl font-bold">{(platformMetrics.treesPlanted / 1000).toFixed(0)}k</p>
                <p className="text-sm text-gray-500">through reforestation programs</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  User Emissions Saved
                </div>
                <p className="text-3xl font-bold">{(platformMetrics.usersCarbonSaved / 1000).toFixed(0)}k</p>
                <p className="text-sm text-gray-500">tonnes saved by sustainable choices</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Your Personal Impact */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Personal Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-6">
                <div className="mb-3 text-sm font-semibold">Total Emissions</div>
                <p className="text-3xl font-bold">{formatCarbonEmissions(data.totalEmissions * 1000)}</p>
                <p className="text-sm text-gray-500">lifetime from your content</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="mb-3 text-sm font-semibold">Platform Offset</div>
                <p className="text-3xl font-bold">{formatCarbonEmissions(data.totalOffset * 1000)}</p>
                <p className="text-sm text-gray-500">offset through platform initiatives</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="mb-3 text-sm font-semibold">Your Net Emissions</div>
                <p className="text-3xl font-bold">{formatCarbonEmissions(data.netEmissions * 1000)}</p>
                <p className="text-sm text-gray-500">after platform offsets</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="mb-3 text-sm font-semibold">Avg. Sustainability Score</div>
                <p className="text-3xl font-bold">{data.averageSustainabilityScore}/100</p>
                <p className="text-sm text-gray-500">across all your content</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Monthly Emissions Trend */}
        <Card>
          <div className="p-6">
            <div className="mb-4 text-lg font-semibold">Monthly Emissions Trend</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyEmissions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'kg CO2e', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => formatTooltipValue(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="emissions" stroke="#ef4444" name="Gross Emissions" strokeWidth={2} />
                  <Line type="monotone" dataKey="offset" stroke="#22c55e" name="Offset by Platform" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Content Breakdown */}
        <Card>
          <div className="p-6">
            <div className="mb-4 text-lg font-semibold">Emissions by Content Type</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.contentBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis label={{ value: 'kg CO2e', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => formatTooltipValue(value)} />
                  <Bar dataKey="emissions" fill="#3b82f6" name="Emissions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Achievements */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.achievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.unlockedAt ? '' : 'opacity-50'}>
                <div className="p-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Award className={`h-4 w-4 ${achievement.unlockedAt ? 'text-yellow-500' : 'text-gray-400'}`} />
                    {achievement.name}
                    {achievement.unlockedAt && (
                      <Badge className="ml-2 bg-green-100 text-green-800">Unlocked</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                  {achievement.unlockedAt && (
                    <p className="text-xs text-gray-400 mt-1">Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard Position */}
        <Card>
          <div className="p-6">
            <div className="mb-4 text-lg font-semibold">Your Sustainability Ranking</div>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full">
                <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">Top {((data.userRank / data.totalUsers) * 100).toFixed(1)}%</p>
                <p className="text-sm text-gray-500">You're ranked #{data.userRank} out of {data.totalUsers.toLocaleString()} users</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
};