import React, { useState, useEffect } from 'react';
import { MemoryCard } from './MemoryCard';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { CreateMemoryForm } from './CreateMemoryForm';
import api, { createMemoryDocumentary, createMemoryProject, getMemoryProjects } from '../../lib/api';
import type { Post } from '../../lib/types';
import { Badge } from '../ui/badge';
import { Plus, Film } from 'lucide-react';

export const MemoriesList: React.FC = () => {
  const [memories, setMemories] = useState<Post[]>([]);
  const [timeCapsules, setTimeCapsules] = useState<Post[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [documentaryTitle, setDocumentaryTitle] = useState('');
  const [documentaryEvent, setDocumentaryEvent] = useState('');
  const [documentaryParticipants, setDocumentaryParticipants] = useState('');
  const [documentaryResult, setDocumentaryResult] = useState<null | { title: string; summary: string; memoryCount: number; highlights: string[] }>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectTopic, setProjectTopic] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectResult, setProjectResult] = useState<null | { title: string; summary: string; memoryCount: number; contributorNames: string[] }>(null);
  const [projects, setProjects] = useState<any[]>([]);

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const [feedResponse, capsuleResponse] = await Promise.all([
        api.get('/memories/feed'),
        api.get('/memories/capsules'),
      ]);
      setMemories(feedResponse.data);
      setTimeCapsules(capsuleResponse.data);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
    void loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getMemoryProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load memory projects:', error);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchMemories();
  };

  const handleCreateDocumentary = async () => {
    try {
      const result = await createMemoryDocumentary({
        title: documentaryTitle || undefined,
        eventName: documentaryEvent || 'shared memory event',
        memoryIds: memories.slice(0, 6).map((memory) => memory.id),
        participantNames: documentaryParticipants.split(',').map((name) => name.trim()).filter(Boolean),
      });
      setDocumentaryResult(result);
    } catch (error) {
      console.error('Failed to create documentary', error);
    }
  };

  const handleCreateProject = async () => {
    try {
      const result = await createMemoryProject({
        title: projectTitle || 'Collaborative memory archive',
        topic: projectTopic || 'shared memories',
        description: projectDescription || 'A curated archive of memories built by multiple contributors.',
        memoryIds: memories.slice(0, 6).map((memory) => memory.id),
        contributorNames: ['You', 'Community'].filter(Boolean),
      });
      setProjectResult(result);
      await loadProjects();
    } catch (error) {
      console.error('Failed to create memory project', error);
    }
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

      <div className="mb-8 rounded-2xl border border-violet-200 bg-violet-50/80 p-5 shadow-sm dark:border-violet-900/60 dark:bg-violet-950/30">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">Collaborative memory projects</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Curate a shared archive around a person, place, or event and invite contributors.</p>
          </div>
          <Badge variant="secondary">New</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-md border border-violet-300 bg-white px-3 py-2 text-sm"
            placeholder="Project title"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
          />
          <input
            className="rounded-md border border-violet-300 bg-white px-3 py-2 text-sm"
            placeholder="Topic or focus"
            value={projectTopic}
            onChange={(e) => setProjectTopic(e.target.value)}
          />
          <input
            className="rounded-md border border-violet-300 bg-white px-3 py-2 text-sm"
            placeholder="Short description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button onClick={handleCreateProject} variant="secondary">
            <Plus className="mr-2 h-4 w-4" />
            Create project
          </Button>
          {projectResult && (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold">{projectResult.title}</p>
              <p>{projectResult.summary}</p>
            </div>
          )}
        </div>
        {projects.length > 0 && (
          <div className="mt-4 space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="rounded-lg border border-violet-200 bg-white/80 p-3 text-sm dark:border-violet-900/50 dark:bg-gray-950/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{project.title}</p>
                    <p className="text-gray-600 dark:text-gray-400">{project.summary}</p>
                  </div>
                  <Badge variant="outline">{project.memoryIds?.length ?? 0} memories</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8 rounded-2xl border border-violet-200 bg-violet-50/80 p-5 shadow-sm dark:border-violet-900/60 dark:bg-violet-950/30">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">Neural documentaries</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Compile memories from multiple contributors into a shared full-sensory documentary.</p>
          </div>
          <Badge variant="secondary">New</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-md border border-violet-300 bg-white px-3 py-2 text-sm"
            placeholder="Documentary title"
            value={documentaryTitle}
            onChange={(e) => setDocumentaryTitle(e.target.value)}
          />
          <input
            className="rounded-md border border-violet-300 bg-white px-3 py-2 text-sm"
            placeholder="Event or occasion"
            value={documentaryEvent}
            onChange={(e) => setDocumentaryEvent(e.target.value)}
          />
          <input
            className="rounded-md border border-violet-300 bg-white px-3 py-2 text-sm"
            placeholder="Participant names"
            value={documentaryParticipants}
            onChange={(e) => setDocumentaryParticipants(e.target.value)}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button onClick={handleCreateDocumentary} variant="secondary">
            <Film className="mr-2 h-4 w-4" />
            Build documentary
          </Button>
          {documentaryResult && (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold">{documentaryResult.title}</p>
              <p>{documentaryResult.summary}</p>
            </div>
          )}
        </div>
      </div>

      {!isLoading && timeCapsules.length > 0 && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold">Time Capsules</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Future-unlock memories waiting for their scheduled release.</p>
            </div>
            <Badge variant="secondary">{timeCapsules.length} scheduled</Badge>
          </div>
          <div className="space-y-3">
            {timeCapsules.map((capsule) => (
              <div key={capsule.id} className="rounded-xl border border-amber-200 bg-white p-4 dark:border-amber-900/50 dark:bg-gray-950">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{capsule.content.substring(0, 120)}{capsule.content.length > 120 ? '...' : ''}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Unlocks at {capsule.timeCapsuleUnlockAt ? new Date(capsule.timeCapsuleUnlockAt).toLocaleString() : 'an unscheduled future time'}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">{capsule.realityContext ?? 'neural'}</Badge>
                </div>
                {capsule.timeCapsuleMessage && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">{capsule.timeCapsuleMessage}</p>
                )}
                {capsule.timeCapsuleRecipients && capsule.timeCapsuleRecipients.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">Recipients: {capsule.timeCapsuleRecipients.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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