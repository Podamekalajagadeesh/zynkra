// @ts-nocheck
import { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { get } from '../lib/api';
import {
  TrendingUp,
  FileText,
  Mic,
  BookOpen,
  Send,
  Users,
  Eye,
  Play,
  GraduationCap,
  Loader2,
} from 'lucide-react';

interface DashboardData {
  overview: {
    totalPosts: number;
    totalArticles: number;
    totalViews: number;
    totalSubscribers: number;
    newslettersSent: number;
    totalPlays: number;
    coursesCreated: number;
    totalEnrollments: number;
  };
  topContent: {
    posts: any[];
    articles: any[];
    podcasts: any[];
  };
}

const CreatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await get<DashboardData>('/creator-analytics/dashboard');
      setData(response);
    } catch (error) {
      addToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell eyebrow="Creator Dashboard" title="Your Analytics">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </PageShell>
    );
  }

  const overview = data?.overview;

  const stats = [
    {
      label: 'Total Posts',
      value: overview?.totalPosts || 0,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Total Views',
      value: overview?.totalViews || 0,
      icon: Eye,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Articles',
      value: overview?.totalArticles || 0,
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: 'Podcast Plays',
      value: overview?.totalPlays || 0,
      icon: Play,
      color: 'text-pink-600',
      bg: 'bg-pink-100 dark:bg-pink-900/30',
    },
    {
      label: 'Newsletter Subscribers',
      value: overview?.totalSubscribers || 0,
      icon: Send,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      label: 'Newsletters Sent',
      value: overview?.newslettersSent || 0,
      icon: Send,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      label: 'Courses',
      value: overview?.coursesCreated || 0,
      icon: GraduationCap,
      color: 'text-teal-600',
      bg: 'bg-teal-100 dark:bg-teal-900/30',
    },
    {
      label: 'Course Enrollments',
      value: overview?.totalEnrollments || 0,
      icon: Users,
      color: 'text-cyan-600',
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    },
  ];

  return (
    <PageShell
      eyebrow="Creator Dashboard"
      title="Your Analytics"
      description="Track your content performance across all platforms."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="surface p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Content */}
      {data?.topContent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Posts */}
          <div className="surface p-6">
            <h3 className="section-title flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-blue-500" />
              Top Posts
            </h3>
            {data.topContent.posts.length > 0 ? (
              <ul className="space-y-3">
                {data.topContent.posts.map((post) => (
                  <li key={post.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                        {post.content?.slice(0, 60) || 'Untitled'}
                      </p>
                      <p className="text-xs text-dark-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="ml-3 text-sm font-semibold text-dark-600 dark:text-dark-300">
                      {post.viewCount || 0} views
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-dark-500">No posts yet.</p>
            )}
          </div>

          {/* Top Articles */}
          <div className="surface p-6">
            <h3 className="section-title flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-purple-500" />
              Top Articles
            </h3>
            {data.topContent.articles.length > 0 ? (
              <ul className="space-y-3">
                {data.topContent.articles.map((article) => (
                  <li key={article.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                        {article.title}
                      </p>
                      <p className="text-xs text-dark-500">
                        {article.readingTime || 1} min read · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Draft'}
                      </p>
                    </div>
                    <span className="ml-3 text-sm font-semibold text-dark-600 dark:text-dark-300">
                      {article.viewCount || 0} views
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-dark-500">No articles yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 surface p-6">
        <h3 className="section-title mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/articles/new'}>
            Write Article
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/explore'}>
            View Explore
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/earnings'}>
            Check Earnings
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/settings'}>
            Settings
          </Button>
        </div>
      </div>
    </PageShell>
  );
};

export default CreatorDashboard;
