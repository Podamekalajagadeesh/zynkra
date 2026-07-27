import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/useToast';
import {
  BookOpen,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Plus,
  Bookmark,
  Search,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../lib/api';

interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  coverImage: string | null;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  publishedAt: string;
  readingTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
  isGated: boolean;
}

interface FeedResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
}

const ArticleFeed: React.FC = () => {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { addToast } = useToast();

  useEffect(() => {
    loadFeed();
  }, [page, selectedTag]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (selectedTag) params.set('tag', selectedTag);

      const response = await api.get(`/articles/feed?${params.toString()}`);
      setFeed(response.data);
    } catch (error) {
      addToast('Failed to load articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const allTags = Array.from(
    new Set(feed?.articles.flatMap((a) => a.tags) || [])
  );

  return (
    <PageShell
      eyebrow="Articles"
      title="Long-Form Stories"
      description="Read and write in-depth stories, tutorials, and insights."
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <Link to="/articles/new">
            <Button icon={<Plus size={16} />}>
              Write Article
            </Button>
          </Link>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                !selectedTag
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {allTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTag === tag
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Articles List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : feed?.articles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No articles yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Be the first to share a story!
            </p>
            <Link to="/articles/new">
              <Button icon={<Plus size={16} />}>
                Write First Article
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {feed?.articles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className="block bg-white dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {article.coverImage && (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {article.title}
                      {article.isGated && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          <BookOpen size={10} className="inline mr-1" />
                          Gated
                        </span>
                      )}
                    </h2>
                    {article.subtitle && (
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {article.subtitle}
                      </p>
                    )}
                    <p className="text-gray-500 dark:text-gray-500 text-sm mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <img
                          src={article.author.avatar || `https://ui-avatars.com/api/?name=${article.author.username}`}
                          alt={article.author.username}
                          className="w-5 h-5 rounded-full"
                        />
                        {article.author.displayName || article.author.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {article.readingTime} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {formatNumber(article.viewCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={14} />
                        {formatNumber(article.likeCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        {article.commentCount}
                      </span>
                    </div>
                  </div>
                </div>
                {article.tags.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {article.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs text-gray-500 dark:text-gray-500"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {feed && feed.total > feed.limit && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {Math.ceil(feed.total / feed.limit)}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(feed.total / feed.limit)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default ArticleFeed;
