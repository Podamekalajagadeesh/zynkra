import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { search } from '../lib/api';
import { User, Post, Tag, Place, Event, Group, Product } from '../lib/types';
import { PageShell } from '../components/PageShell';
import { PostList } from '../components/post-list';
import { Avatar } from '../components/Avatar';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<{ 
    users: User[]; 
    posts: Post[];
    hashtags: Tag[];
    places: Place[];
    groups: Group[];
    events: Event[];
    products: Product[];
    imageSearchResults?: Post[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageSearchLoading, setIsImageSearchLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const data = await search(query);
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleDelete = (postId: string) => {
    if (results) {
      setResults({
        ...results,
        posts: results.posts.filter((p) => p.id !== postId),
      });
    }
  };

  const handleImageSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImageSearchLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/search/reverse-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
        credentials: 'include',
      });
      const imageResults = await response.json();
      setResults(prev => prev ? { ...prev, imageSearchResults: imageResults } : { 
        users: [], posts: [], hashtags: [], places: [], groups: [], events: [], products: [], imageSearchResults: imageResults 
      });
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

  return (
    <PageShell
      eyebrow="Search Results"
      title={`Results for "${query}"`}
      description={`Searching for users, posts, hashtags, locations, products and more matching your query.`}
    >
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search again..."
          defaultValue={query}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
              setSearchParams({ q: (e.target as HTMLInputElement).value.trim() });
            }
          }}
        />
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
          className="flex items-center gap-2"
          disabled={isImageSearchLoading}
        >
          {isImageSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          Reverse Image Search
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}
      {results && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="users">Users ({results.users.length})</TabsTrigger>
            <TabsTrigger value="posts">Posts ({results.posts.length})</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags ({results.hashtags?.length || 0})</TabsTrigger>
            <TabsTrigger value="places">Locations ({results.places?.length || 0})</TabsTrigger>
            <TabsTrigger value="groups">Groups ({results.groups?.length || 0})</TabsTrigger>
            <TabsTrigger value="events">Events ({results.events?.length || 0})</TabsTrigger>
            <TabsTrigger value="products">Products ({results.products?.length || 0})</TabsTrigger>
            {results.imageSearchResults && (
              <TabsTrigger value="reverse-image">Image Matches ({results.imageSearchResults.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {results.users.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Users</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.id}`}
                      className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors flex items-center gap-4"
                    >
                      <Avatar src={user.profile.avatarUrl} alt={user.username} className="h-12 w-12" />
                      <div>
                        <p className="font-bold">{user.profile.displayName}</p>
                        <p className="text-sm text-dark-500 dark:text-dark-400">@{user.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.hashtags?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Hashtags</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {results.hashtags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/hashtag/${tag.name}`}
                      className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      <p className="font-bold text-primary-600">#{tag.name}</p>
                      <p className="text-sm text-dark-500 dark:text-dark-400">{tag.postCount?.toLocaleString() || 0} posts</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.places?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Locations</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.places.map((place) => (
                    <Link
                      key={place.id}
                      to={`/place/${place.id}`}
                      className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      <p className="font-bold">{place.name}</p>
                      <p className="text-sm text-dark-500 dark:text-dark-400">{place.address}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.groups?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Groups</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.groups.map((group) => (
                    <Link
                      key={group.id}
                      to={`/groups/${group.id}`}
                      className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      <p className="font-bold">{group.name}</p>
                      <p className="text-sm text-dark-500 dark:text-dark-400">{group.memberCount?.toLocaleString() || 0} members</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.events?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Events</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.events.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      <p className="font-bold">{event.title}</p>
                      <p className="text-sm text-dark-500 dark:text-dark-400">{new Date(event.date).toLocaleDateString()}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.products?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {results.products.map((product) => (
                    <Link
                      key={product.id}
                      to={`/marketplace/listings/${product.id}`}
                      className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      {product.imageUrls?.[0] && (
                        <img src={product.imageUrls[0]} alt={product.title} className="w-full h-40 object-cover rounded-md mb-2" />
                      )}
                      <p className="font-bold">{product.title}</p>
                      <p className="text-sm text-primary-600">${product.price?.toLocaleString()}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.posts.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Posts</h2>
                <PostList posts={results.posts} onDelete={handleDelete} />
              </div>
            )}

            {results.imageSearchResults?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Reverse Image Search Matches</h2>
                <PostList posts={results.imageSearchResults} onDelete={handleDelete} />
              </div>
            )}

            {results.users.length === 0 && results.posts.length === 0 && (results.hashtags?.length || 0) === 0 && (results.places?.length || 0) === 0 && (results.groups?.length || 0) === 0 && (results.events?.length || 0) === 0 && (results.products?.length || 0) === 0 && (results.imageSearchResults?.length || 0) === 0 && (
              <p className="text-dark-500 dark:text-dark-400">No results found for your search query.</p>
            )}
          </TabsContent>

          <TabsContent value="users">
            {results.users.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors flex items-center gap-4"
                  >
                    <Avatar src={user.profile.avatarUrl} alt={user.username} className="h-12 w-12" />
                    <div>
                      <p className="font-bold">{user.profile.displayName}</p>
                      <p className="text-sm text-dark-500 dark:text-dark-400">@{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-dark-500 dark:text-dark-400">No users found.</p>
            )}
          </TabsContent>

          <TabsContent value="posts">
            {results.posts.length > 0 ? (
              <PostList posts={results.posts} onDelete={handleDelete} />
            ) : (
              <p className="text-dark-500 dark:text-dark-400">No posts found.</p>
            )}
          </TabsContent>

          <TabsContent value="hashtags">
            {results.hashtags?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.hashtags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/hashtag/${tag.name}`}
                    className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                  >
                    <p className="font-bold text-primary-600">#{tag.name}</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">{tag.postCount?.toLocaleString() || 0} posts</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-dark-500 dark:text-dark-400">No hashtags found.</p>
            )}
          </TabsContent>

          <TabsContent value="places">
            {results.places?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.places.map((place) => (
                  <Link
                    key={place.id}
                    to={`/place/${place.id}`}
                    className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                  >
                    <p className="font-bold">{place.name}</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">{place.address}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-dark-500 dark:text-dark-400">No locations found.</p>
            )}
          </TabsContent>

          <TabsContent value="groups">
            {results.groups?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                  >
                    <p className="font-bold">{group.name}</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">{group.memberCount?.toLocaleString() || 0} members</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-dark-500 dark:text-dark-400">No groups found.</p>
            )}
          </TabsContent>

          <TabsContent value="events">
            {results.events?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.events.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                  >
                    <p className="font-bold">{event.title}</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">{new Date(event.date).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-dark-500 dark:text-dark-400">No events found.</p>
            )}
          </TabsContent>

          <TabsContent value="products">
            {results.products?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/marketplace/listings/${product.id}`}
                    className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                  >
                    {product.imageUrls?.[0] && (
                      <img src={product.imageUrls[0]} alt={product.title} className="w-full h-40 object-cover rounded-md mb-2" />
                    )}
                    <p className="font-bold">{product.title}</p>
                    <p className="text-sm text-primary-600">${product.price?.toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-dark-500 dark:text-dark-400">No products found.</p>
            )}
          </TabsContent>

          {results.imageSearchResults && (
            <TabsContent value="reverse-image">
              {results.imageSearchResults.length > 0 ? (
                <PostList posts={results.imageSearchResults} onDelete={handleDelete} />
              ) : (
                <p className="text-dark-500 dark:text-dark-400">No matching images found.</p>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}
    </PageShell>
  );
}

export default SearchResultsPage;