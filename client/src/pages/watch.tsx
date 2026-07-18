
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWatchLaterList, removeFromWatchLater } from '../lib/api';
import { Button } from '../components/ui/button';
import { Trash2, Clock, BookOpen } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const WatchLaterPage = () => {
  const [watchLaterPosts, setWatchLaterPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchWatchLaterPosts = async () => {
    try {
      const posts = await getWatchLaterList();
      setWatchLaterPosts(posts);
    } catch (error) {
      console.error('Error fetching watch later posts:', error);
      addToast('Failed to load watch later list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchLaterPosts();
  }, []);

  const handleRemoveFromWatchLater = async (postId: string) => {
    try {
      await removeFromWatchLater(postId);
      setWatchLaterPosts(watchLaterPosts.filter(post => post.id !== postId));
      addToast('Removed from watch later', 'success');
    } catch (error) {
      console.error('Failed to remove post from watch later:', error);
      addToast('Failed to remove post', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Watch Later</h1>
        <p>Loading your watch later list...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Watch Later</h1>
        <span className="text-sm text-gray-500">({watchLaterPosts.length} videos saved)</span>
      </div>

      {watchLaterPosts.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Your watch later list is empty</h2>
          <p className="text-gray-500 mb-4">Save videos to watch later by clicking the "Add to Watch Later" button on any post.</p>
          <Link to="/">
            <Button>Browse videos</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {watchLaterPosts.map((item: any) => (
            <div key={item.id} className="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden">
              <Link to={`/posts/${item.post.id}`}>
                {item.post.media && item.post.media.length > 0 && item.post.media[0].type === 'video' && (
                  <video 
                    src={item.post.media[0].url} 
                    controls 
                    className="w-full h-48 object-cover"
                  />
                )}
              </Link>
              <div className="p-4">
                <Link to={`/posts/${item.post.id}`}>
                  <h3 className="font-semibold mb-2 line-clamp-2">{item.post.content}</h3>
                </Link>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-500">
                    Saved on {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemoveFromWatchLater(item.post.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchLaterPage;