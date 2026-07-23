import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../contexts/ToastContext';
import { 
  Github, GitBranch, GitMerge, Code, FileText, Bug, Layout, Zap, Shield,
  Plus, Clock, Search, CheckCircle, XCircle, Loader2, Trash2, Eye
} from 'lucide-react';
import { 
  getContributions, 
  getContributionStats, 
  createContribution, 
  deleteContribution,
  updateContribution,
  Contribution,
  ContributionType,
  ContributionStatus,
  CreateContributionDto,
  ContributionStats
} from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const contributionTypeIcons: Record<ContributionType, React.ReactNode> = {
  [ContributionType.FEATURE]: <Zap className="w-4 h-4" />,
  [ContributionType.BUGFIX]: <Bug className="w-4 h-4" />,
  [ContributionType.DOCUMENTATION]: <FileText className="w-4 h-4" />,
  [ContributionType.UI_IMPROVEMENT]: <Layout className="w-4 h-4" />,
  [ContributionType.PERFORMANCE]: <Zap className="w-4 h-4" />,
  [ContributionType.SECURITY]: <Shield className="w-4 h-4" />,
};

const contributionTypeLabels: Record<ContributionType, string> = {
  [ContributionType.FEATURE]: 'Feature',
  [ContributionType.BUGFIX]: 'Bug Fix',
  [ContributionType.DOCUMENTATION]: 'Documentation',
  [ContributionType.UI_IMPROVEMENT]: 'UI Improvement',
  [ContributionType.PERFORMANCE]: 'Performance',
  [ContributionType.SECURITY]: 'Security',
};

const statusLabels: Record<ContributionStatus, string> = {
  [ContributionStatus.PENDING]: 'Pending',
  [ContributionStatus.IN_REVIEW]: 'In Review',
  [ContributionStatus.APPROVED]: 'Approved',
  [ContributionStatus.REJECTED]: 'Rejected',
  [ContributionStatus.MERGED]: 'Merged',
};

const statusColors: Record<ContributionStatus, string> = {
  [ContributionStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ContributionStatus.IN_REVIEW]: 'bg-blue-100 text-blue-800',
  [ContributionStatus.APPROVED]: 'bg-green-100 text-green-800',
  [ContributionStatus.REJECTED]: 'bg-red-100 text-red-800',
  [ContributionStatus.MERGED]: 'bg-purple-100 text-purple-800',
};

export function OpenSourcePlatformPage() {
  const { activeAccount } = useAuth();
  const { showToast } = useToast();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [stats, setStats] = useState<ContributionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newContribution, setNewContribution] = useState<CreateContributionDto>({
    title: '',
    description: '',
    type: ContributionType.FEATURE,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contribs, statsData] = await Promise.all([
        getContributions(),
        getContributionStats(),
      ]);
      setContributions(contribs);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load open source data:', error);
      showToast('Failed to load contributions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContribution = async () => {
    if (!newContribution.title || !newContribution.description) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await createContribution(newContribution);
      showToast('Contribution created successfully', 'success');
      setCreateDialogOpen(false);
      setNewContribution({
        title: '',
        description: '',
        type: ContributionType.FEATURE,
      });
      loadData();
    } catch (error) {
      console.error('Failed to create contribution:', error);
      showToast('Failed to create contribution', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContribution = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contribution?')) return;
    
    try {
      await deleteContribution(id);
      showToast('Contribution deleted', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to delete contribution:', error);
      showToast('Failed to delete contribution', 'error');
    }
  };

  const canModify = (contribution: Contribution) => {
    return (
      activeAccount?.user?.id === contribution.authorId ||
      (activeAccount?.user as { isAdmin?: boolean } | undefined)?.isAdmin
    );
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Github className="w-8 h-8" />
              Open Source Platform
            </h1>
            <p className="text-gray-600 mt-2">
              All platform code is public. Contribute to feature development, fix bugs, and help improve the platform together.
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Submit Contribution
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Contribution</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title *</label>
                  <Input
                    value={newContribution.title}
                    onChange={(e) => setNewContribution({ ...newContribution, title: e.target.value })}
                    placeholder="Brief description of your contribution"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type *</label>
                  <Select
                    value={newContribution.type}
                    onValueChange={(value: string) =>
                      setNewContribution({ ...newContribution, type: value as ContributionType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ContributionType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {contributionTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description *</label>
                  <Textarea
                    value={newContribution.description}
                    onChange={(e) => setNewContribution({ ...newContribution, description: e.target.value })}
                    placeholder="Detailed description of your changes"
                    rows={5}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Pull Request URL</label>
                  <Input
                    value={newContribution.pullRequestUrl || ''}
                    onChange={(e) => setNewContribution({ ...newContribution, pullRequestUrl: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={handleCreateContribution}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit Contribution
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Code className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-gray-500">Total Contributions</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <div className="text-sm text-gray-500">Pending Review</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <GitBranch className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.inReview}</div>
                  <div className="text-sm text-gray-500">In Review</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <GitMerge className="w-8 h-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.merged}</div>
                  <div className="text-sm text-gray-500">Merged</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Contributions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Contributions</h2>
          {contributions.length === 0 ? (
            <Card className="p-8 text-center">
              <Code className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No contributions yet. Be the first to contribute!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {contributions.map((contribution) => (
                <Card key={contribution.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {contributionTypeIcons[contribution.type]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{contribution.title}</h3>
                          <Badge className={statusColors[contribution.status]}>
                            {statusLabels[contribution.status]}
                          </Badge>
                          <Badge variant="outline">{contributionTypeLabels[contribution.type]}</Badge>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{contribution.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>by {contribution.author?.username || 'Unknown'}</span>
                          <span>{new Date(contribution.createdAt).toLocaleDateString()}</span>
                          {contribution.pullRequestUrl && (
                            <a 
                              href={contribution.pullRequestUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                            >
                              <Github className="w-3 h-3" /> View PR
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canModify(contribution) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContribution(contribution.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Repository Info */}
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Contributing Guidelines</h3>
          <div className="space-y-2 text-gray-600">
            <p>1. Fork the repository on GitHub</p>
            <p>2. Create a feature branch for your changes</p>
            <p>3. Submit a pull request with detailed description</p>
            <p>4. Add your contribution to the platform for tracking</p>
            <p>5. Work with maintainers to get your changes merged</p>
          </div>
          <Button className="mt-4" variant="secondary">
            <Github className="w-4 h-4 mr-2" />
            View GitHub Repository
          </Button>
        </Card>
      </div>
    </PageShell>
  );
}