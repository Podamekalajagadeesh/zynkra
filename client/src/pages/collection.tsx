
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { PostList } from '../components/post-list';
import { Post } from '../lib/types';

interface Collection {
  id: string;
  name: string;
  bookmarks: { post: Post }[];
}

const CollectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const response = await api.get(`/collections/${id}`);
        setCollection(response.data);
      } catch (error) {
        console.error('Failed to fetch collection', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!collection) {
    return <div>Collection not found</div>;
  }

  const posts = collection.bookmarks.map((bookmark) => bookmark.post);

  return (
    <div>
      <h1>{collection.name}</h1>
      <PostList posts={posts} />
    </div>
  );
};

export default CollectionPage;