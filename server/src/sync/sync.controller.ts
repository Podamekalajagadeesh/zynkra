import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * Get all data the user needs for initial offline sync.
   * Returns posts, messages, user profile, and metadata.
   */
  @Get('initial')
  @UseGuards(JwtAuthGuard)
  async getInitialSync(@Req() req, @Query('since') since?: string) {
    return this.syncService.getInitialSync(
      req.user.userId || req.user.id,
      since ? new Date(since) : undefined,
    );
  }

  /**
   * Push batch of offline changes (posts, messages, reactions, etc.)
   * Server resolves conflicts using last-write-wins with timestamps.
   */
  @Post('push')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async pushChanges(
    @Req() req,
    @Body() body: {
      posts?: Array<{
        id: string;
        content: string;
        action: 'create' | 'update' | 'delete';
        createdAt: string;
        updatedAt: string;
      }>;
      messages?: Array<{
        id: string;
        conversationId: string;
        content: string;
        action: 'create' | 'update' | 'delete';
        createdAt: string;
      }>;
      reactions?: Array<{
        postId: string;
        reaction: string;
        action: 'add' | 'remove';
      }>;
    },
  ) {
    return this.syncService.pushChanges(
      req.user.userId || req.user.id,
      body,
    );
  }

  /**
   * Pull latest changes since a timestamp (delta sync).
   */
  @Get('pull')
  @UseGuards(JwtAuthGuard)
  async pullChanges(
    @Req() req,
    @Query('since') since: string,
  ) {
    return this.syncService.pullChanges(
      req.user.userId || req.user.id,
      new Date(since),
    );
  }

  /**
   * Get sync status (last sync time, pending changes, etc.)
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getSyncStatus(@Req() req) {
    return this.syncService.getSyncStatus(req.user.userId || req.user.id);
  }

  /**
   * Resolve a sync conflict (manual resolution by user).
   */
  @Post('resolve')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resolveConflict(
    @Req() req,
    @Body() body: {
      entityType: 'post' | 'message';
      entityId: string;
      resolution: 'local' | 'remote';
      remoteData?: any;
    },
  ) {
    return this.syncService.resolveConflict(
      req.user.userId || req.user.id,
      body,
    );
  }
}
