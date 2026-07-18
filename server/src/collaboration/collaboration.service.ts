import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

interface ActiveCollaborator {
  userId: string;
  displayName: string;
  lastActive: Date;
}

interface DraftVersion {
  postId: string;
  content: any;
  userId: string;
  timestamp: number;
  versionNumber: number;
}

export type CollectiveExperienceTheme = 'virtual-trip' | 'event' | 'story';
export type CollectiveExperienceContributionType = 'travel-note' | 'event-step' | 'story-beat' | 'sensory-cue';

export interface CollectiveExperienceParticipant {
  userId: string;
  displayName: string;
  joinedAt: number;
}

export interface CollectiveExperienceContribution {
  id: string;
  userId: string;
  displayName: string;
  type: CollectiveExperienceContributionType;
  text: string;
  intensity: number;
  timestamp: number;
}

export interface CollectiveExperienceScene {
  prompt: string;
  location: string;
  sensoryMood: string;
  highlights: string[];
}

export interface CollectiveExperienceSession {
  id: string;
  title: string;
  theme: CollectiveExperienceTheme;
  hostId: string;
  hostName: string;
  participants: CollectiveExperienceParticipant[];
  scene: CollectiveExperienceScene;
  contributions: CollectiveExperienceContribution[];
  createdAt: number;
  updatedAt: number;
  isLive: boolean;
}

export type NeuralLiveStreamParticipantRole = 'host' | 'co-host' | 'viewer';
export type NeuralLiveStreamSignalType = 'reaction' | 'question' | 'spotlight-request' | 'sensory-feedback';
export type NeuralLiveStreamThoughtType = 'observation' | 'thought' | 'memory' | 'sensory-input';

export interface NeuralLiveStreamParticipant {
  userId: string;
  displayName: string;
  role: NeuralLiveStreamParticipantRole;
  joinedAt: number;
  isSpeaking: boolean;
}

export interface NeuralLiveStreamThought {
  id: string;
  userId: string;
  displayName: string;
  type: NeuralLiveStreamThoughtType;
  content: string;
  intensity: number;
  sensoryTags: string[];
  timestamp: number;
}

export interface NeuralLiveStreamAudienceSignal {
  id: string;
  userId: string;
  displayName: string;
  type: NeuralLiveStreamSignalType;
  content: string;
  reaction?: string;
  timestamp: number;
}

export interface NeuralLiveStreamBroadcast {
  headline: string;
  description: string;
  currentScene: string;
  sensoryPalette: string[];
  thoughtPrompt: string;
  broadcastIntensity: number;
}

export interface NeuralLiveStreamSession {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  participants: NeuralLiveStreamParticipant[];
  broadcast: NeuralLiveStreamBroadcast;
  thoughts: NeuralLiveStreamThought[];
  audienceSignals: NeuralLiveStreamAudienceSignal[];
  createdAt: number;
  updatedAt: number;
  isLive: boolean;
  maxAudience: number;
}

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);
  private activeEditingRooms: Map<string, Map<string, ActiveCollaborator>> = new Map();
  private draftVersions: Map<string, DraftVersion[]> = new Map();
  private collectiveExperienceSessions: Map<string, CollectiveExperienceSession> = new Map();
  private neuralLiveStreamSessions: Map<string, NeuralLiveStreamSession> = new Map();
  private readonly MAX_VERSIONS_TO_KEEP = 50;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  addCollaboratorToRoom(postId: string, userId: string, displayName: string): void {
    if (!this.activeEditingRooms.has(postId)) {
      this.activeEditingRooms.set(postId, new Map());
    }
    
    const room = this.activeEditingRooms.get(postId)!;
    room.set(userId, {
      userId,
      displayName,
      lastActive: new Date()
    });
    
    this.logger.log(`User ${userId} joined editing room for post ${postId}`);
  }

  removeCollaboratorFromRoom(postId: string, userId: string): void {
    const room = this.activeEditingRooms.get(postId);
    if (room) {
      room.delete(userId);
      this.logger.log(`User ${userId} left editing room for post ${postId}`);
      
      // Clean up empty rooms
      if (room.size === 0) {
        this.activeEditingRooms.delete(postId);
        this.logger.log(`Cleaned up empty editing room for post ${postId}`);
      }
    }
  }

  getActiveCollaborators(postId: string): ActiveCollaborator[] {
    const room = this.activeEditingRooms.get(postId);
    return room ? Array.from(room.values()) : [];
  }

  async saveDraftVersion(postId: string, content: any, userId: string): Promise<void> {
    if (!this.draftVersions.has(postId)) {
      this.draftVersions.set(postId, []);
    }
    
    const versions = this.draftVersions.get(postId)!;
    const newVersion: DraftVersion = {
      postId,
      content,
      userId,
      timestamp: Date.now(),
      versionNumber: versions.length + 1
    };
    
    versions.push(newVersion);
    
    // Keep only the last N versions
    if (versions.length > this.MAX_VERSIONS_TO_KEEP) {
      versions.shift();
    }
    
    // Update the post's draft content in the database
    await this.postRepository.update(postId, {
      content: JSON.stringify(content),
      isDraft: true
    });
  }

  async addPermanentCollaborator(postId: string, collaboratorId: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['collaborators']
    });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    const user = await this.userRepository.findOneBy({ id: collaboratorId });
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is already a collaborator
    const isAlreadyCollaborator = post.collaborators.some(c => c.id === collaboratorId);
    if (!isAlreadyCollaborator) {
      post.collaborators.push(user);
      return this.postRepository.save(post);
    }
    
    return post;
  }

  async removePermanentCollaborator(postId: string, collaboratorId: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['collaborators', 'user']
    });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    // Remove the collaborator from the list
    post.collaborators = post.collaborators.filter(c => c.id !== collaboratorId);
    return this.postRepository.save(post);
  }

  async canUserEdit(postId: string, userId: string): Promise<boolean> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['collaborators', 'user']
    });
    
    if (!post) {
      return false;
    }
    
    // Owner can always edit
    if (post.user.id === userId) {
      return true;
    }
    
    // Collaborators can edit
    return post.collaborators.some(c => c.id === userId);
  }

  async getDraftHistory(postId: string): Promise<DraftVersion[]> {
    return this.draftVersions.get(postId) || [];
  }

  async restoreVersion(postId: string, versionNumber: number): Promise<any> {
    const versions = this.draftVersions.get(postId);
    if (!versions) {
      throw new Error('No draft versions found');
    }
    
    const version = versions.find(v => v.versionNumber === versionNumber);
    if (!version) {
      throw new Error('Version not found');
    }
    
    // Update the post with the restored version
    await this.postRepository.update(postId, {
      content: JSON.stringify(version.content)
    });
    
    return version.content;
  }

  async publishDraft(postId: string, userId: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['collaborators']
    });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (!(await this.canUserEdit(postId, userId))) {
      throw new UnauthorizedException('You are not authorized to publish this post');
    }
    
    post.isDraft = false;
    return this.postRepository.save(post);
  }

  createCollectiveExperienceSession(input: {
    hostId: string;
    hostName: string;
    title: string;
    theme: CollectiveExperienceTheme;
    prompt: string;
    location?: string;
    sensoryMood?: string;
  }): CollectiveExperienceSession {
    const sessionId = `collective-${Date.now()}`;
    const session: CollectiveExperienceSession = {
      id: sessionId,
      title: input.title,
      theme: input.theme,
      hostId: input.hostId,
      hostName: input.hostName,
      participants: [
        {
          userId: input.hostId,
          displayName: input.hostName,
          joinedAt: Date.now(),
        },
      ],
      scene: {
        prompt: input.prompt,
        location: input.location || 'Shared imaginative space',
        sensoryMood: input.sensoryMood || 'curious, collaborative, and immersive',
        highlights: [],
      },
      contributions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLive: true,
    };

    this.collectiveExperienceSessions.set(sessionId, session);
    this.logger.log(`Created collective experience session ${sessionId}`);
    return this.cloneCollectiveExperienceSession(session);
  }

  joinCollectiveExperienceSession(sessionId: string, userId: string, displayName: string): CollectiveExperienceSession {
    const session = this.collectiveExperienceSessions.get(sessionId);
    if (!session) {
      throw new Error('Collective experience session not found');
    }

    const participantExists = session.participants.some((participant) => participant.userId === userId);
    if (!participantExists) {
      session.participants.push({
        userId,
        displayName,
        joinedAt: Date.now(),
      });
      session.updatedAt = Date.now();
    }

    return this.cloneCollectiveExperienceSession(session);
  }

  leaveCollectiveExperienceSession(sessionId: string, userId: string): CollectiveExperienceSession | null {
    const session = this.collectiveExperienceSessions.get(sessionId);
    if (!session) {
      throw new Error('Collective experience session not found');
    }

    session.participants = session.participants.filter((participant) => participant.userId !== userId);
    session.updatedAt = Date.now();

    if (session.participants.length === 0) {
      this.collectiveExperienceSessions.delete(sessionId);
      return null;
    }

    this.collectiveExperienceSessions.set(sessionId, session);
    return this.cloneCollectiveExperienceSession(session);
  }

  updateCollectiveExperienceScene(sessionId: string, updates: Partial<CollectiveExperienceScene>): CollectiveExperienceSession {
    const session = this.collectiveExperienceSessions.get(sessionId);
    if (!session) {
      throw new Error('Collective experience session not found');
    }

    session.scene = {
      ...session.scene,
      ...updates,
    };
    session.updatedAt = Date.now();
    this.collectiveExperienceSessions.set(sessionId, session);
    return this.cloneCollectiveExperienceSession(session);
  }

  addCollectiveExperienceContribution(sessionId: string, contribution: Omit<CollectiveExperienceContribution, 'id' | 'timestamp'>): CollectiveExperienceSession {
    const session = this.collectiveExperienceSessions.get(sessionId);
    if (!session) {
      throw new Error('Collective experience session not found');
    }

    session.contributions.push({
      ...contribution,
      id: `contribution-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
    });
    session.updatedAt = Date.now();
    this.collectiveExperienceSessions.set(sessionId, session);
    return this.cloneCollectiveExperienceSession(session);
  }

  getCollectiveExperienceSession(sessionId: string): CollectiveExperienceSession | null {
    const session = this.collectiveExperienceSessions.get(sessionId);
    return session ? this.cloneCollectiveExperienceSession(session) : null;
  }

  getCollectiveExperienceSessions(): CollectiveExperienceSession[] {
    return Array.from(this.collectiveExperienceSessions.values()).map((session) => this.cloneCollectiveExperienceSession(session));
  }

  createNeuralLiveStreamSession(input: {
    hostId: string;
    hostName: string;
    title: string;
    headline: string;
    description?: string;
    currentScene?: string;
    sensoryPalette?: string[];
    thoughtPrompt?: string;
    broadcastIntensity?: number;
    maxAudience?: number;
  }): NeuralLiveStreamSession {
    const sessionId = `neural-stream-${Date.now()}`;
    const session: NeuralLiveStreamSession = {
      id: sessionId,
      title: input.title,
      hostId: input.hostId,
      hostName: input.hostName,
      participants: [
        {
          userId: input.hostId,
          displayName: input.hostName,
          role: 'host',
          joinedAt: Date.now(),
          isSpeaking: true,
        },
      ],
      broadcast: {
        headline: input.headline,
        description: input.description || 'A live neural stream combining thoughts, sensations, and shared attention.',
        currentScene: input.currentScene || 'Live sensory panorama',
        sensoryPalette: input.sensoryPalette || ['visual', 'auditory', 'emotional'],
        thoughtPrompt: input.thoughtPrompt || 'Share what the audience should feel or understand in this moment.',
        broadcastIntensity: input.broadcastIntensity ?? 72,
      },
      thoughts: [],
      audienceSignals: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLive: true,
      maxAudience: input.maxAudience ?? 500,
    };

    this.neuralLiveStreamSessions.set(sessionId, session);
    this.logger.log(`Created neural live stream session ${sessionId}`);
    return this.cloneNeuralLiveStreamSession(session);
  }

  joinNeuralLiveStreamSession(sessionId: string, userId: string, displayName: string, role: NeuralLiveStreamParticipantRole = 'viewer'): NeuralLiveStreamSession {
    const session = this.neuralLiveStreamSessions.get(sessionId);
    if (!session) {
      throw new Error('Neural live stream session not found');
    }

    const participantExists = session.participants.some((participant) => participant.userId === userId);
    if (!participantExists) {
      session.participants.push({
        userId,
        displayName,
        role,
        joinedAt: Date.now(),
        isSpeaking: false,
      });
      session.updatedAt = Date.now();
    }

    return this.cloneNeuralLiveStreamSession(session);
  }

  leaveNeuralLiveStreamSession(sessionId: string, userId: string): NeuralLiveStreamSession | null {
    const session = this.neuralLiveStreamSessions.get(sessionId);
    if (!session) {
      throw new Error('Neural live stream session not found');
    }

    session.participants = session.participants.filter((participant) => participant.userId !== userId);
    session.updatedAt = Date.now();

    if (session.participants.length === 0) {
      this.neuralLiveStreamSessions.delete(sessionId);
      return null;
    }

    this.neuralLiveStreamSessions.set(sessionId, session);
    return this.cloneNeuralLiveStreamSession(session);
  }

  updateNeuralLiveStreamBroadcast(sessionId: string, updates: Partial<NeuralLiveStreamBroadcast>): NeuralLiveStreamSession {
    const session = this.neuralLiveStreamSessions.get(sessionId);
    if (!session) {
      throw new Error('Neural live stream session not found');
    }

    session.broadcast = {
      ...session.broadcast,
      ...updates,
    };
    session.updatedAt = Date.now();
    this.neuralLiveStreamSessions.set(sessionId, session);
    return this.cloneNeuralLiveStreamSession(session);
  }

  addNeuralLiveStreamThought(sessionId: string, thought: Omit<NeuralLiveStreamThought, 'id' | 'timestamp'>): NeuralLiveStreamSession {
    const session = this.neuralLiveStreamSessions.get(sessionId);
    if (!session) {
      throw new Error('Neural live stream session not found');
    }

    session.thoughts.push({
      ...thought,
      id: `thought-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
    });
    session.updatedAt = Date.now();
    this.neuralLiveStreamSessions.set(sessionId, session);
    return this.cloneNeuralLiveStreamSession(session);
  }

  addNeuralLiveStreamAudienceSignal(sessionId: string, signal: Omit<NeuralLiveStreamAudienceSignal, 'id' | 'timestamp'>): NeuralLiveStreamSession {
    const session = this.neuralLiveStreamSessions.get(sessionId);
    if (!session) {
      throw new Error('Neural live stream session not found');
    }

    session.audienceSignals.push({
      ...signal,
      id: `signal-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
    });
    session.updatedAt = Date.now();
    this.neuralLiveStreamSessions.set(sessionId, session);
    return this.cloneNeuralLiveStreamSession(session);
  }

  endNeuralLiveStreamSession(sessionId: string): boolean {
    return this.neuralLiveStreamSessions.delete(sessionId);
  }

  getNeuralLiveStreamSession(sessionId: string): NeuralLiveStreamSession | null {
    const session = this.neuralLiveStreamSessions.get(sessionId);
    return session ? this.cloneNeuralLiveStreamSession(session) : null;
  }

  getNeuralLiveStreamSessions(): NeuralLiveStreamSession[] {
    return Array.from(this.neuralLiveStreamSessions.values()).map((session) => this.cloneNeuralLiveStreamSession(session));
  }

  private cloneCollectiveExperienceSession(session: CollectiveExperienceSession): CollectiveExperienceSession {
    return {
      ...session,
      participants: session.participants.map((participant) => ({ ...participant })),
      scene: {
        ...session.scene,
        highlights: [...session.scene.highlights],
      },
      contributions: session.contributions.map((contribution) => ({ ...contribution })),
    };
  }

  private cloneNeuralLiveStreamSession(session: NeuralLiveStreamSession): NeuralLiveStreamSession {
    return {
      ...session,
      participants: session.participants.map((participant) => ({ ...participant })),
      broadcast: {
        ...session.broadcast,
        sensoryPalette: [...session.broadcast.sensoryPalette],
      },
      thoughts: session.thoughts.map((thought) => ({ ...thought })),
      audienceSignals: session.audienceSignals.map((signal) => ({ ...signal })),
    };
  }
}