import { useState } from 'react';
import { MessageSquare, Plus, Pin, ChevronDown, Search, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../Avatar';
import { Thread, PostAuthor } from '../../lib/types';

// Mock forum posts for demonstration
const mockForumPosts: {
  id: string;
  title: string;
  content: string;
  author: PostAuthor;
  createdAt: string;
  replies: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
}[] = [
  {
    id: '1',
    title: 'Welcome to the hardware discussion forum! Read this first',
    content: 'This is our community guidelines post for all hardware discussions.',
    author: { id: 'admin', email: null, walletAddress: null },
    createdAt: new Date('2024-01-01').toISOString(),
    replies: 45,
    views: 1250,
    isPinned: true,
    isLocked: false,
  },
  {
    id: '2',
    title: 'RTX 5090 owners - what are your impressions?',
    content: 'I just got my RTX 5090 and I am blown away by the performance...',
    author: { id: 'user1', email: null, walletAddress: null },
    createdAt: new Date('2024-06-01').toISOString(),
    replies: 128,
    views: 3400,
    isPinned: false,
    isLocked: false,
  },
  {
    id: '3',
    title: 'Best laptop for programming in 2024',
    content: 'Looking to upgrade my work laptop. What are everyone\'s recommendations?',
    author: { id: 'user2', email: null, walletAddress: null },
    createdAt: new Date('2024-05-28').toISOString(),
    replies: 89,
    views: 2100,
    isPinned: false,
    isLocked: false,
  },
];

interface ForumChannelViewProps {
  channelName: string;
}

export const ForumChannelView = ({ channelName }: ForumChannelViewProps) => {
  const [posts, setPosts] = useState(mockForumPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const pinnedPosts = posts.filter(post => post.isPinned);
  const regularPosts = posts.filter(post => !post.isPinned);

  const filteredPosts = [...pinnedPosts, ...regularPosts].filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPostTitle.trim() && newPostContent.trim()) {
      const newPost = {
        id: Date.now().toString(),
        title: newPostTitle,
        content: newPostContent,
        author: { id: 'current-user', email: null, walletAddress: null },
        createdAt: new Date().toISOString(),
        replies: 0,
        views: 1,
        isPinned: false,
        isLocked: false,
      };
      setPosts([newPost, ...posts]);
      setNewPostTitle('');
      setNewPostContent('');
      setShowCreatePost(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-50 dark:bg-dark-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-200 dark:border-dark-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FileText size={20} className="text-purple-500" />
            #{channelName}
          </h3>
          <Button onClick={() => setShowCreatePost(true)} className="gap-2">
            <Plus size={16} />
            New Post
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={16} />
          <Input
            placeholder="Search forum posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Create post form */}
      {showCreatePost && (
        <div className="p-4 border-b border-dark-200 dark:border-dark-800 bg-dark-100 dark:bg-dark-800">
          <h4 className="font-semibold mb-3">Create New Post</h4>
          <form onSubmit={handleCreatePost} className="space-y-3">
            <Input
              placeholder="Post title"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Post content..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full p-3 rounded-md border border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-900 min-h-[100px]"
              required
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowCreatePost(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Post</Button>
            </div>
          </form>
        </div>
      )}

      {/* Posts list */}
      <div className="flex-1 overflow-y-auto">
        {filteredPosts.map(post => (
          <div
            key={post.id}
            className={`p-4 border-b border-dark-200 dark:border-dark-800 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors cursor-pointer ${
              post.isPinned ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {post.isPinned && (
                    <Pin size={14} className="text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                  )}
                  <h4 className="font-medium truncate">{post.title}</h4>
                  {post.isLocked && (
                    <svg className="w-4 h-4 text-dark-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-dark-500 dark:text-dark-400 line-clamp-2 mb-2">{post.content}</p>
                <div className="flex items-center gap-4 text-xs text-dark-500 dark:text-dark-400">
                  <span>u/{post.author.id}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    {post.replies} replies
                  </span>
                  <span>{post.views} views</span>
                </div>
              </div>
              <ChevronDown className="text-dark-400 flex-shrink-0" size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};