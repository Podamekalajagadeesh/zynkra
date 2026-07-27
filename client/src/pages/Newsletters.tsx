import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { Mail, Send, Users, Plus, Clock, Eye } from 'lucide-react';
import { api } from '../lib/api';

interface Newsletter {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  author: { id: string; username: string; displayName: string };
  subscriberCount: number;
  openCount: number;
  sentAt: string | null;
  createdAt: string;
}

const NewslettersPage: React.FC = () => {
  const { user } = useAuth();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subEmail, setSubEmail] = useState('');
  const { addToast } = useToast();

  useEffect(() => { loadNewsletters(); }, []);

  const loadNewsletters = async () => {
    try {
      const response = await api.get('/newsletters/feed');
      setNewsletters(response.data || []);
      if (user?.id) {
        const subRes = await api.get(`/newsletters/feed?authorId=${user.id}`);
        setSubscriberCount(subRes.data?.[0]?.subscriberCount || 0);
      }
    } catch (error) {
      addToast('Failed to load newsletters', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell eyebrow="Newsletters" title="Newsletter Inbox" description="Subscribe to creators and never miss an update.">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            {user && (
              <p className="text-sm text-dark-500">{subscriberCount} subscribers</p>
            )}
          </div>
          <Link to="/newsletters/new">
            <Button icon={<Plus size={16} />}>New Newsletter</Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6 h-24" />)}
          </div>
        ) : newsletters.length === 0 ? (
          <div className="text-center py-12">
            <Mail size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No newsletters yet.</p>
            <Link to="/newsletters/new"><Button className="mt-4" icon={<Send size={16} />}>Send First Newsletter</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {newsletters.map(newsletter => (
              <Link key={newsletter.id} to={`/newsletters/${newsletter.slug}`}
                className="block bg-white dark:bg-gray-800 rounded-lg p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-dark-900 dark:text-white">{newsletter.title}</h3>
                    {newsletter.excerpt && (
                      <p className="text-sm text-dark-500 mt-1 line-clamp-2">{newsletter.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-dark-500">
                      <span>{newsletter.author.displayName || newsletter.author.username}</span>
                      {newsletter.sentAt && (
                        <span className="flex items-center gap-1">
                          <Send size={12} />Sent {new Date(newsletter.sentAt).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Users size={12} />{newsletter.subscriberCount} subscribers</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default NewslettersPage;
