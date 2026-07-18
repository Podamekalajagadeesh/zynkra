import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getReadLaterList, removeFromReadLater } from '../lib/api';
import { Button } from '../components/ui/button';
import { Trash2, BookOpen } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const ReadLaterPage = () => {
  const [readLaterPosts, setReadLaterPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchReadLaterPosts = async () => {
    try {
      const posts = await getReadLaterList();
      setReadLaterPosts(posts);
    } catch (error) {
      console.error('Error fetching read later posts:', error);
      addToast('Failed to load read later list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadLaterPosts();
  }, []);

  const handleRemoveFromReadLater = async (postId: string) => {
    try {
      await removeFromReadLater(postId);
      setReadLaterPosts(readLaterPosts.filter(post => post.id !== postId));
      addToast('Removed from read later', 'success');
    } catch (error) {
      console.error('Failed to remove post from read later:', error);
      addToast('Failed to remove post', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Read Later</h1>
        <p>Loading your read later list...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Read Later</h1>
        <span className="text-sm text-gray-500">({readLaterPosts.length} articles saved)</span>
      </div>

      {readLaterPosts.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Your read later list is empty</h2>
          <p className="text-gray-500 mb-4">Save articles to read later by clicking the "Add to Read Later" button on any post.</p>
          <Link to="/">
            <Button>Browse posts</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readLaterPosts.map((item: any) => (
            <div key={item.id} className="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden">
              <Link to={`/posts/${item.post.id}`}>
                {item.post.media && item.post.media.length > 0 && item.post.media[0].type === 'image' && (
                  <img 
                    src={item.post.media[0].url} 
                    alt={item.post.altText || 'Post content'}
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
                    onClick={() => handleRemoveFromReadLater(item.post.id)}
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

export default ReadLaterPage;