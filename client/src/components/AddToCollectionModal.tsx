
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from './ui/alert-dialog';
import { CreateCollectionForm } from './CreateCollectionForm';
import * as apiFunctions from '../lib/api';

interface Collection {
  id: string;
  name: string;
}

interface AddToCollectionModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToCollectionModal = ({
  postId,
  isOpen,
  onClose,
}: AddToCollectionModalProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchCollections = async () => {
        try {
          const response = await apiFunctions.getCollections();
          setCollections(response);
        } catch (error) {
          console.error('Failed to fetch collections', error);
        }
      };
      fetchCollections();
    }
  }, [isOpen]);

  const handleCreateCollection = async (name: string) => {
    try {
      const newCollection = await apiFunctions.createCollection(name);
      setCollections([...collections, newCollection]);
    } catch (error) {
      console.error('Failed to create collection', error);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    try {
      await apiFunctions.addBookmarkToCollection(postId, collectionId);
      onClose();
    } catch (error) {
      console.error('Failed to add to collection', error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add to Collection</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4">
          <CreateCollectionForm onCreate={handleCreateCollection} />
          <div className="flex flex-col gap-2">
            {collections.map((collection) => (
              <Button
                key={collection.id}
                variant="outline"
                onClick={() => handleAddToCollection(collection.id)}
              >
                {collection.name}
              </Button>
            ))}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};