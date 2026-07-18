import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { getProposals, createProposal, createDao, vote } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../hooks/useAuth';

export const DaoPage = () => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const { user } = useAuth();
  const [dao, setDao] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (groupId) {
      createDao(groupId)
        .then((newDao) => {
          setDao(newDao);
          return getProposals(newDao.id);
        })
        .then(setProposals)
        .catch((err) => console.error('Failed to fetch DAO data:', err))
        .finally(() => setLoading(false));
    }
  }, [groupId]);

  const handleCreateProposal = async () => {
    if (dao) {
      try {
        const newProposal = await createProposal(dao.id, title, description);
        setProposals([...proposals, newProposal]);
        setTitle('');
        setDescription('');
      } catch (error) {
        console.error('Failed to create proposal:', error);
      }
    }
  };

  const handleVote = async (proposalId: string, support: boolean) => {
    if (user) {
      try {
        await vote(proposalId, user.id, support);
        // Refresh proposals to show new vote
        const updatedProposals = await getProposals(dao.id);
        setProposals(updatedProposals);
      } catch (error) {
        console.error('Failed to vote:', error);
      }
    }
  };

  return (
    <PageShell title="DAO">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <div>
            <h2>Create Proposal</h2>
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button onClick={handleCreateProposal}>Create Proposal</Button>
          </div>
          <div>
            <h2>Proposals</h2>
            {proposals.map((proposal) => (
              <div key={proposal.id}>
                <h3>{proposal.title}</h3>
                <p>{proposal.description}</p>
                <div>
                  <Button onClick={() => handleVote(proposal.id, true)}>Yes</Button>
                  <Button onClick={() => handleVote(proposal.id, false)}>No</Button>
                </div>
                <div>
                  <p>Yes votes: {proposal.votes.filter((v) => v.support).length}</p>
                  <p>No votes: {proposal.votes.filter((v) => !v.support).length}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
};