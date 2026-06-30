
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Collection } from '../lib/types';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';

const CollectionsPage = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await api.get('/collections');
        setCollections(response.data);
      } catch (error) {
        addToast('Failed to fetch collections', 'error');
      }
    };

    fetchCollections();
  }, [addToast]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Your Collections</h1>
        <Button as={Link} to="/collections/new">
          New Collection
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {collections.map((collection) => (
          <Link to={`/collections/${collection.id}`} key={collection.id}>
            <div className="border rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-800">
              <h2 className="text-lg font-semibold">{collection.name}</h2>
              <p className="text-sm text-gray-500">{collection.bookmarks?.length || 0} items</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CollectionsPage;