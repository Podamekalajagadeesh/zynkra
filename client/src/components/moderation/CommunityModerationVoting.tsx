import { useState, useEffect } from 'react';
import { Users, ThumbsUp, ThumbsDown, Clock, AlertCircle, CheckCircle, XCircle, Vote as VoteIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../../hooks/useToast';
import {
  getActiveCommunityVotes,
  getCommunityVoteResults,
  submitCommunityVote,
  CommunityVote
} from '../../services/contentModerationService';

export function CommunityModerationVoting() {
  const { addToast } = useToast();
  const [activeVotes, setActiveVotes] = useState<CommunityVote[]>([]);
  const [completedVotes, setCompletedVotes] = useState<CommunityVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set());
  const [userVotes, setUserVotes] = useState<Record<string, 'approve' | 'remove'>>({});

  const fetchVotes = async () => {
    try {
      setLoading(true);
      const [active, completed] = await Promise.all([
        getActiveCommunityVotes(),
        getCommunityVoteResults()
      ]);
      setActiveVotes(active);
      setCompletedVotes(completed);
    } catch (error) {
      addToast('Failed to load community moderation votes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();
    // Refresh votes every 30 seconds
    const interval = setInterval(fetchVotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (voteId: string, vote: 'approve' | 'remove') => {
    setVotingIds(prev => new Set(prev).add(voteId));
    try {
      await submitCommunityVote(voteId, vote);
      setUserVotes(prev => ({ ...prev, [voteId]: vote }));
      addToast('Your vote has been submitted successfully', 'success');
      // Refresh votes to update counts
      fetchVotes();
    } catch (error) {
      addToast('Failed to submit your vote', 'error');
    } finally {
      setVotingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(voteId);
        return newSet;
      });
    }
  };

  const calculateTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = end - now;
    
    if (diff <= 0) return 'Vote ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const calculateVotePercentages = (vote: CommunityVote) => {
    const total = vote.votes.approve + vote.votes.remove;
    if (total === 0) return { approve: 0, remove: 0 };
    return {
      approve: Math.round((vote.votes.approve / total) * 100),
      remove: Math.round((vote.votes.remove / total) * 100)
    };
  };

  const getStatusBadge = (status: CommunityVote['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Community Moderation</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Community Moderation</h2>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <VoteIcon className="h-3 w-3" />
          {activeVotes.length} active votes
        </Badge>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Votes ({activeVotes.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed Votes ({completedVotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeVotes.length === 0 ? (
            <Card className="p-6 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No active community moderation votes at this time</p>
            </Card>
          ) : (
            activeVotes.map(vote => {
              const percentages = calculateVotePercentages(vote);
              const hasVoted = userVotes[vote.id];
              const isProcessing = votingIds.has(vote.id);
              
              return (
                <Card key={vote.id} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(vote.status)}
                          <span className="text-sm text-gray-500">{calculateTimeRemaining(vote.endTime)}</span>
                        </div>
                        <h3 className="font-semibold text-lg">Content Review: {vote.contentType}</h3>
                        <p className="text-gray-600 mt-1">{vote.contentPreview}</p>
                        <p className="text-sm text-gray-500 mt-1">Submitted by: {vote.authorName}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Approve ({vote.votes.approve})</span>
                        <span>Remove ({vote.votes.remove})</span>
                      </div>
                      <Progress value={percentages.approve} className="h-2" />
                    </div>

                    {!hasVoted ? (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleVote(vote.id, 'approve')}
                          disabled={isProcessing}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleVote(vote.id, 'remove')}
                          disabled={isProcessing}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-100 rounded-md text-center">
                        <p className="text-sm text-gray-600">
                          You voted to <span className={userVotes[vote.id] === 'approve' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {userVotes[vote.id]}
                          </span> this content
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{vote.votes.voters.length} community members have voted</span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedVotes.length === 0 ? (
            <Card className="p-6 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No completed community moderation votes yet</p>
            </Card>
          ) : (
            completedVotes.map(vote => {
              const percentages = calculateVotePercentages(vote);
              return (
                <Card key={vote.id} className="p-6 opacity-80">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(vote.status)}
                          {vote.result && (
                            <Badge className={vote.result === 'approved' ? 'bg-green-600' : 'bg-red-600'}>
                              Result: {vote.result}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg">Content Review: {vote.contentType}</h3>
                        <p className="text-gray-600 mt-1">{vote.contentPreview}</p>
                        <p className="text-sm text-gray-500 mt-1">Final vote count: {vote.votes.voters.length} votes</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Approve: {percentages.approve}%</span>
                        <span>Remove: {percentages.remove}%</span>
                      </div>
                      <Progress value={percentages.approve} className="h-2" />
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}