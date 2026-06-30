import React, { useState, useEffect } from 'react';
import { MemoryCard } from './MemoryCard';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { CreateMemoryForm } from './CreateMemoryForm';
import api from '../../lib/api';
import type { Post } from '../../lib/types';
import { Plus } from 'lucide-react';

export const MemoriesList: React.FC = () => {
  const [memories, setMemories] = useState<Post[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/memories/feed');
      setMemories(response.data);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchMemories();
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Memories</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share and experience personal memories with full sensory context
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Share Memory
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <CreateMemoryForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-96 animate-pulse" />
          ))}
        </div>
      ) : memories.length > 0 ? (
        <div className="space-y-8">
          {memories.map((memory) => (
            <MemoryCard key={memory.id} post={memory} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <span className="text-4xl">🧠</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">No memories yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Share your first memory with friends and family
          </p>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Share Your First Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <CreateMemoryForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};