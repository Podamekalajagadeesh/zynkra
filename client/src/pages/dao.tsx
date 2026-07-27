import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import {
  getProposals,
  createProposal,
  createDao,
  vote,
  getDaoStats,
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  Vote,
  Plus,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
  Shield,
} from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED' | 'EXPIRED';
  votes: Array<{ id: string; support: boolean; voter: { id: string; username: string } }>;
  createdAt: string;
  votingEndsAt?: string;
}

interface DaoStats {
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  executedProposals: number;
  totalVotes: number;
}

export function DaoPage() {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const { activeAccount } = useAuth();
  const { addToast } = useToast();
  const [dao, setDao] = useState<{ id: string } | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<DaoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load DAO and proposals
  useEffect(() => {
    const loadDao = async () => {
      if (!groupId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Create or get DAO for this group
        const newDao = await createDao(groupId);
        setDao(newDao);

        // Load proposals and stats in parallel
        const [proposalsData, statsData] = await Promise.all([
          getProposals(newDao.id),
          getDaoStats(newDao.id).catch(() => null),
        ]);

        setProposals(proposalsData || []);
        if (statsData) setStats(statsData);
      } catch (err) {
        console.error('Failed to load DAO:', err);
        setError('Failed to load DAO data');
      } finally {
        setLoading(false);
      }
    };

    loadDao();
  }, [groupId]);

  // Create proposal
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dao || !title.trim()) return;

    try {
      const newProposal = await createProposal(dao.id, title, description);
      setProposals([newProposal, ...proposals]);
      setTitle('');
      setDescription('');
      setShowCreateForm(false);
      addToast('Proposal created successfully', 'success');

      // Refresh stats
      if (dao) {
        const statsData = await getDaoStats(dao.id).catch(() => null);
        if (statsData) setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to create proposal:', err);
      addToast('Failed to create proposal', 'error');
    }
  };

  // Cast vote
  const handleVote = async (proposalId: string, support: boolean) => {
    if (!activeAccount) {
      addToast('Please log in to vote', 'error');
      return;
    }

    try {
      await vote(proposalId, activeAccount.user.id, support);

      // Refresh proposals
      if (dao) {
        const updatedProposals = await getProposals(dao.id);
        setProposals(updatedProposals);

        const statsData = await getDaoStats(dao.id).catch(() => null);
        if (statsData) setStats(statsData);
      }

      addToast(support ? 'Voted in favor' : 'Voted against', 'success');

      // Update selected proposal if viewing details
      if (selectedProposal?.id === proposalId) {
        const updated = proposals.find((p) => p.id === proposalId);
        if (updated) {
          setSelectedProposal({
            ...updated,
            votes: [
              ...updated.votes,
              { id: 'new', support, voter: { id: activeAccount.user.id, username: activeAccount.user.username } },
            ],
          });
        }
      }
    } catch (err) {
      console.error('Failed to vote:', err);
      addToast('Failed to cast vote', 'error');
    }
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'PASSED':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'REJECTED':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'EXECUTED':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'EXPIRED':
        return 'text-dark-400 bg-dark-500/10 border-dark-500/20';
      default:
        return 'text-dark-400 bg-dark-500/10';
    }
  };

  const getStatusIcon = (status: Proposal['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock size={12} />;
      case 'PASSED':
        return <CheckCircle2 size={12} />;
      case 'REJECTED':
        return <XCircle size={12} />;
      case 'EXECUTED':
        return <Shield size={12} />;
      default:
        return <Clock size={12} />;
    }
  };

  if (!groupId) {
    return (
      <PageShell title="DAO Governance">
        <div className="text-center py-16">
          <Shield size={48} className="mx-auto text-dark-300 dark:text-dark-600 mb-4" />
          <h2 className="text-xl font-semibold text-dark-900 dark:text-light-100 mb-2">
            Select a Group
          </h2>
          <p className="text-dark-500 dark:text-dark-400">
            Navigate to a group to access its DAO governance
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Governance"
      title="DAO Governance"
      description="Participate in group decision-making through proposals and voting"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-primary-500" />
          <span className="ml-2 text-dark-500">Loading DAO...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-dark-900 dark:text-light-100 mb-2">
            Error Loading DAO
          </h2>
          <p className="text-dark-500 dark:text-dark-400 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Proposals', value: stats.totalProposals, icon: BarChart3 },
                { label: 'Active', value: stats.activeProposals, icon: Clock },
                { label: 'Passed', value: stats.passedProposals, icon: CheckCircle2 },
                { label: 'Total Votes', value: stats.totalVotes, icon: Vote },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700"
                >
                  <div className="flex items-center gap-2 text-dark-400 dark:text-dark-500 text-sm mb-1">
                    <Icon size={14} />
                    {label}
                  </div>
                  <p className="text-2xl font-bold text-dark-900 dark:text-light-100">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Create proposal section */}
          <div className="rounded-2xl border border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <Plus size={20} className="text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark-900 dark:text-light-100">
                    Create New Proposal
                  </h3>
                  <p className="text-sm text-dark-500 dark:text-dark-400">
                    Submit a proposal for the community to vote on
                  </p>
                </div>
              </div>
              <ChevronRight
                size={20}
                className={`text-dark-400 transition-transform ${showCreateForm ? 'rotate-90' : ''}`}
              />
            </button>

            {showCreateForm && (
              <form onSubmit={handleCreateProposal} className="p-4 pt-0 border-t border-dark-100 dark:border-dark-700">
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                      Title *
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Proposal title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                      Description
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the proposal in detail..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Submit Proposal
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Proposals list */}
          <div>
            <h2 className="text-lg font-semibold text-dark-900 dark:text-light-100 mb-4">
              Proposals ({proposals.length})
            </h2>

            {proposals.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-dark-200 dark:border-dark-700">
                <Vote size={32} className="mx-auto text-dark-300 dark:text-dark-600 mb-3" />
                <p className="text-dark-500 dark:text-dark-400">No proposals yet</p>
                <p className="text-xs text-dark-400 dark:text-dark-500 mt-1">
                  Be the first to create a proposal
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((proposal) => {
                  const yesVotes = proposal.votes.filter((v) => v.support).length;
                  const noVotes = proposal.votes.filter((v) => !v.support).length;
                  const totalVotes = yesVotes + noVotes;
                  const yesPercent = totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0;
                  const noPercent = totalVotes > 0 ? 100 - yesPercent : 0;
                  const isSelected = selectedProposal?.id === proposal.id;

                  return (
                    <div
                      key={proposal.id}
                      className={`rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20'
                          : 'border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedProposal(isSelected ? null : proposal)}
                        className="w-full text-left p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-dark-900 dark:text-light-100 truncate">
                                {proposal.title}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}
                              >
                                {getStatusIcon(proposal.status)}
                                {proposal.status}
                              </span>
                            </div>
                            {proposal.description && (
                              <p className="text-sm text-dark-500 dark:text-dark-400 line-clamp-2">
                                {proposal.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-dark-400 dark:text-dark-500">
                              <span>{totalVotes} votes</span>
                              {proposal.votingEndsAt && (
                                <span>
                                  Ends {new Date(proposal.votingEndsAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className={`text-dark-400 mt-1 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                          />
                        </div>

                        {/* Vote bar preview */}
                        {totalVotes > 0 && (
                          <div className="mt-3">
                            <div className="flex h-2 rounded-full overflow-hidden bg-dark-100 dark:bg-dark-700">
                              <div
                                className="bg-green-500 transition-all"
                                style={{ width: `${yesPercent}%` }}
                              />
                              <div
                                className="bg-red-500 transition-all"
                                style={{ width: `${noPercent}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-dark-400">
                              <span className="text-green-500">{yesPercent}% Yes</span>
                              <span className="text-red-500">{noPercent}% No</span>
                            </div>
                          </div>
                        )}
                      </button>

                      {/* Expanded details */}
                      {isSelected && (
                        <div className="px-4 pb-4 border-t border-dark-100 dark:border-dark-700 pt-4">
                          {proposal.description && (
                            <p className="text-sm text-dark-600 dark:text-dark-300 mb-4 whitespace-pre-wrap">
                              {proposal.description}
                            </p>
                          )}

                          {/* Voting buttons */}
                          {proposal.status === 'ACTIVE' && activeAccount && (
                            <div className="flex gap-2 mb-4">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(proposal.id, true);
                                }}
                                className="flex-1"
                              >
                                <CheckCircle2 size={14} className="mr-1.5 text-green-400" />
                                Vote Yes
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(proposal.id, false);
                                }}
                                className="flex-1"
                              >
                                <XCircle size={14} className="mr-1.5 text-red-400" />
                                Vote No
                              </Button>
                            </div>
                          )}

                          {/* Voters list */}
                          {proposal.votes.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-2">
                                Voters
                              </p>
                              {proposal.votes.map((vote) => (
                                <div
                                  key={vote.id}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  {vote.support ? (
                                    <CheckCircle2 size={12} className="text-green-400" />
                                  ) : (
                                    <XCircle size={12} className="text-red-400" />
                                  )}
                                  <span className="text-dark-600 dark:text-dark-300">
                                    @{vote.voter.username}
                                  </span>
                                  <span className="text-dark-400 dark:text-dark-500">
                                    voted {vote.support ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
