// @ts-nocheck
import { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { PostList } from '../components/post-list';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { Compass, TrendingUp, Map, Users, Sparkles, Image, Film, Music, Code, Heart, Briefcase, TreePine } from 'lucide-react';
import { getTrendingFeed, getExploreFeed, getExploreCategories } from '../lib/api';
import { LiveTrending } from '../components/LiveTrending';
import type { Post } from '../lib/types';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const defaultCategories: Category[] = [
  { id: 'trending', name: 'Trending', icon: <TrendingUp className="h-4 w-4" />, description: 'Popular posts across the platform' },
  { id: 'trending-heatmap', name: 'Trending Heatmap', icon: <Map className="h-4 w-4" />, description: 'Explore popular local content tracked by geographic region' },
  { id: 'new-creators', name: 'New Creators', icon: <Users className="h-4 w-4" />, description: 'Discover emerging creators' },
  { id: 'art', name: 'Art & Design', icon: <Image className="h-4 w-4" />, description: 'Creative artwork and designs' },
  { id: 'film', name: 'Film & Video', icon: <Film className="h-4 w-4" />, description: 'Video content and filmmaking' },
  { id: 'music', name: 'Music', icon: <Music className="h-4 w-4" />, description: 'Music production and artists' },
  { id: 'tech', name: 'Technology', icon: <Code className="h-4 w-4" />, description: 'Tech innovations and discussions' },
  { id: 'lifestyle', name: 'Lifestyle', icon: <Heart className="h-4 w-4" />, description: 'Daily life and wellness' },
  { id: 'business', name: 'Business', icon: <Briefcase className="h-4 w-4" />, description: 'Entrepreneurship and careers' },
  { id: 'nature', name: 'Nature', icon: <TreePine className="h-4 w-4" />, description: 'Outdoors and environment' },
];

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [activeCategory, setActiveCategory] = useState<string>('trending');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Fetch categories from API first
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getExploreCategories();
        if (response.categories && response.categories.length > 0) {
          // Map API categories with icons
          const apiCategories = response.categories.map((cat: any) => {
            const defaultCat = defaultCategories.find(c => c.id === cat.id);
            return defaultCat ? { ...defaultCat, ...cat } : cat;
          });
          setCategories(apiCategories);
        }
      } catch (error) {
        console.error('Failed to fetch explore categories:', error);
        // Fallback to default categories
      }
    };

    fetchCategories();
  }, []);

  // Import the trending heatmap component dynamically or when needed
  const [HeatmapComponent, setHeatmapComponent] = useState<React.ComponentType | null>(null);

  // Load the heatmap component only when needed
  useEffect(() => {
    if (activeCategory === 'trending-heatmap' && !HeatmapComponent) {
      import('../components/trending-heatmap/TrendingHeatmapPage')
        .then(module => {
          setHeatmapComponent(() => module.default);
        })
        .catch(err => console.error('Failed to load heatmap component:', err));
    }
  }, [activeCategory, HeatmapComponent]);

  // Fetch posts when category changes (except for heatmap which handles its own data)
  useEffect(() => {
    if (activeCategory === 'trending-heatmap') {
      setLoading(false);
      return;
    }

    const fetchExplorePosts = async () => {
      setLoading(true);
      try {
        const response = activeCategory === 'trending'
          ? await getTrendingFeed(20)
          : await getExploreFeed(activeCategory);

        const nextPosts = Array.isArray(response) ? response : response.posts || [];
        setPosts(nextPosts);
        setHasMore(!Array.isArray(response) ? response.hasMore || false : false);
      } catch (error) {
        console.error('Failed to fetch explore posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExplorePosts();
  }, [activeCategory]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const response = activeCategory === 'trending'
      ? await getTrendingFeed(20)
      : await getExploreFeed(activeCategory);
    const nextPosts = Array.isArray(response) ? response : response.posts || [];
      setPosts(prev => [...prev, ...nextPosts]);
      setHasMore(!Array.isArray(response) ? response.hasMore || false : false);
    } catch (error) {
      console.error('Failed to load more explore posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <PageShell 
      eyebrow="Discover" 
      title="Explore" 
      description="Curated content for new topics and creators to help you discover what's next"
    >
      <div className="space-y-6">
        <LiveTrending />
        {/* Header with compass icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30">
            <Compass className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Explore</h1>
            <p className="text-sm text-dark-600 dark:text-dark-400">
              {categories.find(c => c.id === activeCategory)?.description}
            </p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="border-b border-dark-200 dark:border-dark-700 pb-4">
          <Tabs defaultValue="trending" value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=inactive]:bg-dark-100 dark:data-[state=inactive]:bg-dark-800 data-[state=inactive]:text-dark-700 dark:data-[state=inactive]:text-dark-300"
                >
                  {category.icon}
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Featured creators section when on new-creators */}
        {activeCategory === 'new-creators' && !loading && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent-500" />
              Featured New Creators
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {posts.slice(0, 4).map((post) => (
                post.author && (
                  <div key={post.author.id} className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 text-center">
                    <img 
                      src={post.author.avatarUrl || '/default-avatar.png'} 
                      alt={post.author.username}
                      className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                    />
                    <h3 className="font-semibold text-dark-900 dark:text-white truncate">{post.author.username}</h3>
                    <p className="text-xs text-dark-500 dark:text-dark-400 mb-3">
                      {post.author.followerCount?.toLocaleString() || 0} followers
                    </p>
                    <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors">
                      Follow
                    </button>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Render heatmap component if selected, otherwise render regular posts */}
        {activeCategory === 'trending-heatmap' ? (
          HeatmapComponent ? <HeatmapComponent /> : (
            <div className="text-center py-16">
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          )
        ) : loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : posts.length > 0 ? (
          <PostList 
            posts={posts} 
            onLoadMore={loadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
          />
        ) : (
          <div className="text-center py-16">
            <Compass className="h-12 w-12 mx-auto text-dark-400 dark:text-dark-500 mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">No posts found</h3>
            <p className="text-dark-600 dark:text-dark-400">Check back later for new content in this category</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}