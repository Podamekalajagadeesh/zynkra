import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { Mic, Play, Clock, Eye, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';

interface Podcast {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string | null;
  audioUrl: string;
  durationSeconds: number;
  author: { id: string; username: string; displayName: string };
  tags: string[];
  playCount: number;
  createdAt: string;
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

const PodcastFeed: React.FC = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => { loadPodcasts(); }, [selectedTag]);

  const loadPodcasts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTag) params.set('tag', selectedTag);
      const response = await api.get(`/podcasts/feed?${params.toString()}`);
      setPodcasts(response.data.podcasts || []);
    } catch (error) {
      addToast('Failed to load podcasts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const allTags = Array.from(new Set(podcasts.flatMap(p => p.tags)));

  return (
    <PageShell eyebrow="Podcasts" title="Podcast Episodes" description="Listen to stories, tutorials, and conversations from creators.">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {allTags.slice(0, 6).map(tag => (
              <button key={tag} onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm ${selectedTag === tag ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                {tag}
              </button>
            ))}
          </div>
          <Link to="/podcasts/new"><Button icon={<Plus size={16} />}>New Episode</Button></Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6 h-32" />)}
          </div>
        ) : podcasts.length === 0 ? (
          <div className="text-center py-12">
            <Mic size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No podcasts yet.</p>
            <Link to="/podcasts/new"><Button className="mt-4" icon={<Plus size={16} />}>Create First Episode</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {podcasts.map(podcast => (
              <Link key={podcast.id} to={`/podcasts/${podcast.slug}`}
                className="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  {podcast.coverImage ? (
                    <img src={podcast.coverImage} alt={podcast.title} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <Mic size={24} className="text-primary-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark-900 dark:text-white truncate">{podcast.title}</h3>
                    <p className="text-sm text-dark-500 truncate">{podcast.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
                      <span>{podcast.author.displayName || podcast.author.username}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(podcast.durationSeconds)}</span>
                      <span className="flex items-center gap-1"><Play size={12} />{podcast.playCount} plays</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon"><Play size={20} /></Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default PodcastFeed;
