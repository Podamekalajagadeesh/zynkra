import { useEffect, useState } from 'react';
import { getShortsFeed } from '../lib/api';
import { Post } from '../lib/types';
import ShortsPlayer from '../components/shorts/ShortsPlayer';
import ShortsEditor from '../components/shorts/ShortsEditor';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';

const ShortsPage = () => {
  const [shorts, setShorts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const shortsData = await getShortsFeed();
        setShorts(shortsData);
      } catch (err) {
        setError('Failed to fetch shorts. Please try again later.');
        console.error(err);
      }
    };

    fetchShorts();
  }, []);

  if (error) {
    return <PageShell><div className="text-center text-red-500">{error}</div></PageShell>;
  }

  if (isCreating) {
    return <ShortsEditor />;
  }

  return (
    <PageShell>
      <div className="h-full w-full relative">
        <ShortsPlayer shorts={shorts} />
        <div className="absolute top-4 right-4 z-10">
          <Button onClick={() => setIsCreating(true)} variant="primary" size="lg">
            <Plus className="mr-2" /> Create
          </Button>
        </div>
      </div>
    </PageShell>
  );
};

export default ShortsPage;