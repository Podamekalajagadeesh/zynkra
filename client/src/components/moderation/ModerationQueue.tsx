import { useState, useEffect } from 'react';
import { Shield, Check, Trash2, Clock, AlertTriangle, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/useToast';
import { 
  getModerationQueue, 
  approveContent, 
  removeContent,
  startCommunityVote,
  ModerationQueueItem 
} from '../../services/contentModerationService';

export function ModerationQueue() {
  const { addToast } = useToast();
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await getModerationQueue(filter);
      setQueue(data);
    } catch (error) {
      addToast('Failed to load moderation queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const handleApprove = async (itemId: string) => {
    setProcessingIds(prev => new Set(prev).add(itemId));
    try {
      await approveContent(itemId);
      addToast('Content approved successfully', 'success');
      setQueue(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      addToast('Failed to approve content', 'error');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    setProcessingIds(prev => new Set(prev).add(itemId));
    try {
      await removeContent(itemId);
      addToast('Content removed successfully', 'success');
      setQueue(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      addToast('Failed to remove content', 'error');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleStartCommunityVote = async (itemId: string) => {
    setProcessingIds(prev => new Set(prev).add(itemId));
    try {
      await startCommunityVote(itemId);
      addToast('Community vote started successfully! All users can now participate in moderating this content.', 'success');
      setQueue(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      addToast('Failed to start community vote', 'error');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'removed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><Trash2 className="h-3 w-3 mr-1" /> Removed</Badge>;
      case 'appealed':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800"><AlertTriangle className="h-3 w-3 mr-1" /> Appealed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'auto_remove':
        return <Badge className="bg-red-500">Auto-remove</Badge>;
      case 'review':
        return <Badge className="bg-yellow-500">Needs review</Badge>;
      case 'approve':
        return <Badge className="bg-green-500">Approve</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Content Moderation Queue</h2>
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <Card key={i} className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Content Moderation Queue</h2>
          <Badge variant="secondary">{queue.length}</Badge>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'removed', 'appealed'].map(status => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {queue.length === 0 ? (
        <Card className="p-8 text-center">
          <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium">All caught up!</h3>
          <p className="text-gray-500 mt-1">No {filter} items in the moderation queue.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map(item => (
            <Card key={item.id} className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.authorName}</span>
                    <span className="text-sm text-gray-500">• {item.contentType}</span>
                    {getStatusBadge(item.status)}
                    {getActionBadge(item.analysisResult.recommendedAction)}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3">{item.contentPreview}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.analysisResult.flags.map(flag => (
                      <Badge 
                        key={flag.id} 
                        variant="outline" 
                        className={`text-xs ${flag.type === 'deepfake' ? 'bg-red-100 border-red-500 text-red-700' : ''} ${flag.type === 'synthetic_content' ? 'bg-orange-100 border-orange-500 text-orange-700' : ''}`}
                      >
                        {flag.type.replace('_', ' ')} ({Math.round(flag.confidence * 100)}%)
                        {flag.deepfakeAnalysis && (
                          <span className="ml-1 text-[10px]">
                            [Model: {flag.deepfakeAnalysis.aiModelUsed}]
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                {item.status === 'pending' && (
                  <div className="flex gap-2 sm:flex-col">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item.id)}
                      disabled={processingIds.has(item.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStartCommunityVote(item.id)}
                      disabled={processingIds.has(item.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Users className="h-4 w-4 mr-1" /> Start Community Vote
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemove(item.id)}
                      disabled={processingIds.has(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}