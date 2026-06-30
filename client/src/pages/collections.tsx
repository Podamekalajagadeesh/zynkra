
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CreateCollectionForm } from '../components/CreateCollectionForm';
import { Button } from '../components/ui/button';
import * as apiFunctions from '../lib/api';

interface Collection {
  id: string;
  name: string;
}

const CollectionsPage = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await api.get('/collections');
        setCollections(response.data);
      } catch (error) {
        console.error('Failed to fetch collections', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const handleCreateCollection = async (name: string) => {
    try {
      const newCollection = await apiFunctions.createCollection(name);
      setCollections([...collections, newCollection]);
    } catch (error) {
      console.error('Failed to create collection', error);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await apiFunctions.deleteCollection(id);
      setCollections(collections.filter((collection) => collection.id !== id));
    } catch (error) {
      console.error('Failed to delete collection', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Your Collections</h1>
      <CreateCollectionForm onCreate={handleCreateCollection} />
      {collections.map((collection) => (
        <div key={collection.id} className="flex items-center gap-2 mt-2">
          <Link to={`/collections/${collection.id}`}>{collection.name}</Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteCollection(collection.id)}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
};

export default CollectionsPage;