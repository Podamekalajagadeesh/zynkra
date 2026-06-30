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

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);
  private activeEditingRooms: Map<string, Map<string, ActiveCollaborator>> = new Map();
  private draftVersions: Map<string, DraftVersion[]> = new Map();
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
}