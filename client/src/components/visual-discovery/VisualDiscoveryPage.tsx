import { useState, useEffect, useRef, useCallback } from 'react';
import { PageShell } from '../PageShell';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Image as ImageIcon, Loader2, Search, X, Grid3X3, Sparkles, Layers, TrendingUp } from 'lucide-react';
import { getVisualDiscoveryFeed, reverseImageSearch, getVisualCategories } from '../../lib/api';
import type { Post } from '../../lib/types';

interface VisualCategory {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  postCount: number;
}

interface MasonryPost {
  id: string;
  mediaUrl: string;
  height: number;
  width: number;
  author: {
    username: string;
    avatarUrl: string;
  };
  likes: number;
  saves: number;
}

export default function VisualDiscoveryPage() {
  const [posts, setPosts] = useState<MasonryPost[]>([]);
  const [categories, setCategories] = useState<VisualCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('for-you');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isImageSearchLoading, setIsImageSearchLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fetch visual discovery categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getVisualCategories();
        if (response.categories) {
          setCategories(response.categories);
        }
      } catch (error) {
        console.error('Failed to fetch visual categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch posts when category changes
  useEffect(() => {
    const fetchVisualPosts = async () => {
      setLoading(true);
      try {
        const response = await getVisualDiscoveryFeed(activeCategory);
        // Add random heights for masonry layout simulation
        const masonryPosts = (response.posts || []).map((post: any) => ({
          ...post,
          height: 200 + Math.floor(Math.random() * 200), // Random height between 200-400px
          width: 300,
          likes: post.reactions?.length || 0,
          saves: 0,
        }));
        setPosts(masonryPosts);
        setHasMore(response.hasMore || false);
      } catch (error) {
        console.error('Failed to fetch visual discovery posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVisualPosts();
  }, [activeCategory]);

  // Infinite scroll setup
  useEffect(() => {
    if (loadingMore || !hasMore) return;

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loadingMore, hasMore]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const response = await getVisualDiscoveryFeed(activeCategory, posts.length);
      const newMasonryPosts = (response.posts || []).map((post: any) => ({
          ...post,
          height: 200 + Math.floor(Math.random() * 200),
          width: 300,
          likes: post.reactions?.length || 0,
          saves: 0,
        }));
      setPosts(prev => [...prev, ...newMasonryPosts]);
      setHasMore(response.hasMore || false);
    } catch (error) {
      console.error('Failed to load more visual posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, activeCategory, posts.length]);

  const handleImageSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImageSearchLoading(true);
    try {
      const similarPosts = await reverseImageSearch(file);
      const masonryPosts = similarPosts.map((post: any) => ({
        ...post,
        height: 200 + Math.floor(Math.random() * 200),
        width: 300,
        likes: post.reactions?.length || 0,
        saves: 0,
      }));
      setPosts(masonryPosts);
      setActiveCategory('similar-images');
    } catch (error) {
      console.error('Reverse image search failed:', error);
    } finally {
      setIsImageSearchLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  // Split posts into columns for masonry layout
  const columns = [[], [], []] as MasonryPost[][];
  posts.forEach((post, index) => {
    columns[index % 3].push(post);
  });

  return (
    <PageShell 
      eyebrow="Discover" 
      title="Visual Discovery" 
      description="Explore beautiful images and find similar content with Pinterest-style visual search"
    >
      <div className="space-y-6">
        {/* Header with visual discovery icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/30">
            <Grid3X3 className="h-6 w-6 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Visual Discovery</h1>
            <p className="text-sm text-dark-600 dark:text-dark-400">
              Discover stunning visuals and find similar content with image-based search
            </p>
          </div>
        </div>

        {/* Search and image upload bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-dark-500" size={20} />
            <Input
              type="text"
              placeholder="Search by keyword or upload an image to find similar content..."
              className="w-full pl-10 pr-4 py-2 rounded-full border-dark-200 dark:border-dark-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSearch}
            className="hidden"
          />
          <Button 
            onClick={triggerImageUpload}
            variant="secondary"
            className="flex items-center gap-2 rounded-full"
            disabled={isImageSearchLoading}
          >
            {isImageSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            Search by Image
          </Button>
        </div>

        {/* Category tabs */}
        <div className="border-b border-dark-200 dark:border-dark-700 pb-4">
          <Tabs defaultValue="for-you" value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0">
              <TabsTrigger
                value="for-you"
                className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=inactive]:bg-dark-100 dark:data-[state=inactive]:bg-dark-800 data-[state=inactive]:text-dark-700 dark:data-[state=inactive]:text-dark-300"
              >
                <Sparkles className="h-4 w-4" />
                For You
              </TabsTrigger>
              <TabsTrigger
                value="trending"
                className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=inactive]:bg-dark-100 dark:data-[state=inactive]:bg-dark-800 data-[state=inactive]:text-dark-700 dark:data-[state=inactive]:text-dark-300"
              >
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=inactive]:bg-dark-100 dark:data-[state=inactive]:bg-dark-800 data-[state=inactive]:text-dark-700 dark:data-[state=inactive]:text-dark-300"
                >
                  <Layers className="h-4 w-4" />
                  {category.name}
                </TabsTrigger>
              ))}
              {activeCategory === 'similar-images' && (
                <TabsTrigger
                  value="similar-images"
                  className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=inactive]:bg-dark-100 dark:data-[state=inactive]:bg-dark-800 data-[state=inactive]:text-dark-700 dark:data-[state=inactive]:text-dark-300"
                >
                  <ImageIcon className="h-4 w-4" />
                  Similar Images
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Category showcase if not viewing similar images */}
        {activeCategory !== 'similar-images' && !loading && categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-4">Explore Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 4).map((category) => (
                <div
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className="relative h-40 rounded-xl overflow-hidden cursor-pointer group"
                >
                  <img 
                    src={category.imageUrl} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="font-semibold text-white">{category.name}</h3>
                    <p className="text-xs text-white/80">{category.postCount?.toLocaleString() || 0} posts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pinterest-style masonry grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((colIndex) => (
              <div key={colIndex} className="space-y-4">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-80 w-full rounded-2xl" />
                <Skeleton className="h-52 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="space-y-4">
                {column.map((post) => (
                  <div key={post.id} className="relative group rounded-2xl overflow-hidden bg-dark-100 dark:bg-dark-800">
                    <img
                        src={post.imageUrls?.[0] || 'https://picsum.photos/400/600'}
                        alt="Visual discovery post"
                        className="w-full object-cover"
                        style={{ height: `${post.height}px` }}
                      />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                    {/* Hover actions */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={post.author?.avatarUrl || '/default-avatar.png'} 
                            alt={post.author?.username || 'User'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-white text-sm font-medium truncate max-w-[100px]">
                            {post.author?.username || 'anonymous'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-white">
                          <span className="text-xs flex items-center gap-1">
                            <HeartIcon className="h-4 w-4" />
                            {post.likes}
                          </span>
                          <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                            <SaveIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ImageIcon className="h-12 w-12 mx-auto text-dark-400 dark:text-dark-500 mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">No visual content found</h3>
            <p className="text-dark-600 dark:text-dark-400">Upload an image to discover similar visual content</p>
          </div>
        )}

        {/* Load more trigger */}
        {hasMore && !loading && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && <Loader2 className="h-8 w-8 animate-spin text-pink-500" />}
          </div>
        )}
      </div>
    </PageShell>
  );
}

// Helper icons
function HeartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function SaveIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}