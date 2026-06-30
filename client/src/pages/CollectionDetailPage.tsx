
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Collection } from '../lib/types';
import { PostCard } from '../components/post-card';

const CollectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const response = await api.get(`/collections/${id}`);
        setCollection(response.data);
      } catch (error) {
        console.error('Failed to fetch collection', error);
      }
    };

    fetchCollection();
  }, [id]);

  if (!collection) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{collection.name}</h1>
      <div className="space-y-4">
        {collection.bookmarks.map((bookmark) => (
          <PostCard key={bookmark.post.id} post={bookmark.post} />
        ))}
      </div>
    </div>
  );
};

export default CollectionDetailPage;