import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Message } from '../dms/entities/message.entity';
import { Conversation } from '../dms/entities/conversation.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PostReaction } from '../posts/entities/post-reaction.entity';
import { Follow } from '../users/entities/follow.entity';
import { Bookmark } from '../bookmarks/entities/bookmark.entity';
import { Story } from '../stories/entities/story.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Order } from '../marketplace/entities/order.entity';
import { LedgerEntry } from '../wallet/entities/ledger-entry.entity';
import { Article } from '../articles/article.entity';
import { Podcast } from '../podcasts/podcast.entity';
import { Course, CourseEnrollment } from '../courses/course.entity';
import { Media } from '../media/entities/media.entity';

export interface ExportData {
  user: any;
  posts: any[];
  comments: any[];
  reactions: any[];
  follows: { following: any[]; followers: any[] };
  bookmarks: any[];
  stories: any[];
  reels: any[];
  messages: any[];
  articles: any[];
  podcasts: any[];
  courses: any[];
  enrollments: any[];
  groupMemberships: any[];
  notifications: any[];
  orders: any[];
  wallet: any[];
  settings: any;
  exportedAt: string;
  version: string;
}

/**
 * Portable export of a user's account. Covers every content type the platform
 * stores so exports are a genuine GDPR/CCPA data copy and can feed account
 * migration (see POST /data-export/import).
 */
@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
    @InjectRepository(Message) private readonly messagesRepo: Repository<Message>,
    @InjectRepository(Conversation) private readonly conversationsRepo: Repository<Conversation>,
    @InjectRepository(Comment) private readonly commentsRepo: Repository<Comment>,
    @InjectRepository(PostReaction) private readonly reactionsRepo: Repository<PostReaction>,
    @InjectRepository(Follow) private readonly followsRepo: Repository<Follow>,
    @InjectRepository(Bookmark) private readonly bookmarksRepo: Repository<Bookmark>,
    @InjectRepository(Story) private readonly storiesRepo: Repository<Story>,
    @InjectRepository(GroupMember) private readonly groupMembersRepo: Repository<GroupMember>,
    @InjectRepository(Notification) private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(LedgerEntry) private readonly ledgerRepo: Repository<LedgerEntry>,
    @InjectRepository(Article) private readonly articlesRepo: Repository<Article>,
    @InjectRepository(Podcast) private readonly podcastsRepo: Repository<Podcast>,
    @InjectRepository(Course) private readonly coursesRepo: Repository<Course>,
    @InjectRepository(CourseEnrollment) private readonly enrollmentsRepo: Repository<CourseEnrollment>,
  ) {}

  async exportUserData(userId: string): Promise<ExportData> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const [
      posts,
      messages,
      comments,
      reactions,
      stories,
      groupMemberships,
      notifications,
      orders,
      wallet,
      articles,
      podcasts,
      courses,
      enrollments,
      bookmarks,
    ] = await Promise.all([
      this.postsRepo.find({
        where: { user: { id: userId } },
        relations: ['media', 'reelEffect'],
      }),
      this.messagesRepo.find({ where: { sender: { id: userId } } as any }),
      this.commentsRepo.find({ where: { user: { id: userId } } as any }),
      this.reactionsRepo.find({ where: { user: { id: userId } } as any }),
      this.storiesRepo.find({ where: { user: { id: userId } } as any }),
      this.groupMembersRepo.find({
        where: { user: { id: userId } },
        relations: ['group'],
      }),
      this.notificationsRepo.find({ where: { user: { id: userId } } as any }),
      this.ordersRepo.find({ where: { customerId: userId }, relations: ['items'] }),
      this.ledgerRepo.find({ where: { user: { id: userId } } as any }),
      this.articlesRepo.find({ where: { authorId: userId } }),
      this.podcastsRepo.find({ where: { authorId: userId } }),
      this.coursesRepo.find({ where: { authorId: userId } }),
      this.enrollmentsRepo.find({ where: { userId } }),
      this.bookmarksRepo.find({ where: { user: { id: userId } } as any }),
    ]);

    const follows = await Promise.all([
      this.followsRepo.find({
        where: { followerId: userId },
        relations: ['following'],
      }),
      this.followsRepo.find({
        where: { followingId: userId },
        relations: ['follower'],
      }),
    ]);

    // DMs received: messages in conversations the user is part of, excluding
    // their own sent messages (already captured above).
    const conversations = await this.conversationsRepo.find({
      where: { participants: { id: userId } },
    });
    const conversationIds = conversations.map((c) => c.id);
    let receivedMessages: Message[] = [];
    if (conversationIds.length > 0) {
      receivedMessages = await this.messagesRepo
        .createQueryBuilder('m')
        .where('m.conversationId IN (:...ids)', { ids: conversationIds })
        .andWhere('m.senderId != :userId', { userId })
        .getMany();
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        header: user.header,
        pronouns: user.pronouns,
        createdAt: user.createdAt,
        accountType: (user as any).accountType,
        verified: user.verified,
        walletAddress: user.walletAddress,
      },
      posts: posts.map((p) => ({
        id: p.id,
        content: (p as any).content,
        postType: (p as any).postType,
        visibility: (p as any).visibility,
        createdAt: p.createdAt,
        isReel: Boolean((p as any).reelEffect),
        media: ((p as any).media || []).map((m: any) => ({
          url: m.url,
          type: m.type,
          sortOrder: m.sortOrder,
          altText: m.altText,
        })),
      })),
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        postId: (c.post as any)?.id,
        parentId: (c.parent as any)?.id ?? null,
        sentiment: c.sentiment,
        createdAt: c.createdAt,
      })),
      reactions: reactions.map((r) => ({
        id: r.id,
        reaction: r.reaction,
        postId: (r.post as any)?.id,
      })),
      follows: {
        following: follows[0].map((f) => ({
          username: (f.following as any)?.username,
          userId: (f.following as any)?.id,
          followedAt: f.followedAt,
        })),
        followers: follows[1].map((f) => ({
          username: (f.follower as any)?.username,
          userId: (f.follower as any)?.id,
          followedAt: f.followedAt,
        })),
      },
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        postId: (b.post as any)?.id,
        createdAt: b.createdAt,
      })),
      stories: stories.map((s) => ({
        id: s.id,
        textContent: s.textContent,
        mediaUrl: s.mediaUrl,
        audience: (s as any).audience,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
      reels: posts.filter((p) => (p as any).reelEffect).map((p) => ({
        id: p.id,
        mediaUrl: ((p as any).media || [])[0]?.url ?? null,
        caption: (p as any).content,
      })),
      messages: [
        ...messages.map((m) => ({
          id: m.id,
          content: m.content,
          direction: 'sent' as const,
          conversationId: (m.conversation as any)?.id,
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl,
          createdAt: m.createdAt,
        })),
        ...receivedMessages.map((m) => ({
          id: m.id,
          content: m.content,
          direction: 'received' as const,
          conversationId: (m.conversation as any)?.id,
          senderId: (m.sender as any)?.id,
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl,
          createdAt: m.createdAt,
        })),
      ],
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        publishedAt: a.publishedAt,
      })),
      podcasts: podcasts.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        audioUrl: p.audioUrl,
        createdAt: p.createdAt,
      })),
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        createdAt: c.createdAt,
      })),
      enrollments: enrollments.map((e) => ({
        courseId: e.courseId,
        progress: e.progress,
        isCompleted: e.isCompleted,
        enrolledAt: e.createdAt,
      })),
      groupMemberships: groupMemberships.map((gm) => ({
        groupId: (gm.group as any)?.id,
        groupName: (gm.group as any)?.name,
        role: (gm as any).role,
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        type: (n as any).type,
        data: n.data,
        read: n.read,
        createdAt: n.createdAt,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        total: o.total,
        status: o.status,
        itemCount: (o.items || []).length,
        createdAt: o.createdAt,
      })),
      wallet: wallet.map((l) => ({
        id: l.id,
        type: l.type,
        amount: l.amount,
        balanceAfter: l.balanceAfter,
        currency: l.currency,
        reference: l.reference,
        purpose: l.purpose,
        createdAt: l.createdAt,
      })),
      settings: {
        postVisibility: (user as any).postVisibility,
        commentPrivacy: (user as any).commentPrivacy,
        messagePrivacy: (user as any).messagePrivacy,
        profileTheme: user.profileTheme,
        profileThemeColor: user.profileThemeColor,
        notificationSettings: (user as any).notificationSettings,
        followedHashtags: (user as any).followedHashtags,
        blockedKeywords: (user as any).blockedKeywords,
        blockedHashtags: (user as any).blockedHashtags,
        blockedContentTypes: (user as any).blockedContentTypes,
        closeFriends: user.closeFriends?.map((cf) => cf.username),
      },
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
    };
  }

  async exportAsJson(userId: string): Promise<string> {
    const data = await this.exportUserData(userId);
    return JSON.stringify(data, null, 2);
  }

  // Recreates profile, posts, and follows from a Zynkra export payload
  // (the JSON produced by exportAsJson / GET /data-export/download).
  // Identity fields (email, wallet, verified) are intentionally not imported.
  async importFromJson(
    userId: string,
    data: ExportData,
  ): Promise<{ imported: boolean; posts: number; follows: number }> {
    if (!data || typeof data !== 'object' || !data.user) {
      throw new BadRequestException('Invalid export data: missing user object');
    }

    let importedPosts = 0;
    let importedFollows = 0;

    await this.postsRepo.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (data.user.displayName) user.displayName = data.user.displayName;
      if (data.user.bio) user.bio = data.user.bio;
      if (data.user.pronouns) user.pronouns = data.user.pronouns;
      if (data.user.header) user.header = data.user.header;
      if (data.user.accountType) (user as any).accountType = data.user.accountType;
      await manager.save(User, user);

      if (Array.isArray(data.posts)) {
        for (const p of data.posts) {
          if (p.isReel) continue;
          const post = new Post();
          post.content = p.content ?? null;
          post.postType = p.postType ?? 'feed';
          post.visibility = p.visibility ?? null;
          post.user = user;
          if (Array.isArray(p.media)) {
            post.media = (p.media as any[]).map((m, index) => {
              const media = new Media();
              media.url = m.url;
              media.type = m.type ?? 'image';
              media.sortOrder = m.sortOrder ?? index;
              media.altText = m.altText ?? null;
              media.post = post;
              return media;
            });
          }
          await manager.save(Post, post);
          importedPosts++;
        }
      }

      const followingUsernames = (data.follows?.following ?? [])
        .map((f: any) => f.username)
        .filter(Boolean) as string[];
      if (followingUsernames.length > 0) {
        const targets = await manager.find(User, {
          where: { username: In(followingUsernames) },
        });
        const existing = await manager.find(Follow, {
          where: { followerId: userId },
        });
        const existingIds = new Set(existing.map((f) => f.followingId));
        for (const target of targets) {
          if (target.id === userId || existingIds.has(target.id)) continue;
          await manager.save(
            Follow,
            manager.create(Follow, {
              followerId: userId,
              followingId: target.id,
            } as Partial<Follow>),
          );
          importedFollows++;
        }
      }
    });

    return { imported: true, posts: importedPosts, follows: importedFollows };
  }

  async getExportInfo(userId: string): Promise<{
    userId: string;
    dataTypes: string[];
    estimatedSize: string;
    lastExport: string | null;
    canExport: boolean;
  }> {
    return {
      userId,
      dataTypes: [
        'profile',
        'posts',
        'comments',
        'reactions',
        'follows',
        'bookmarks',
        'stories',
        'reels',
        'messages',
        'articles',
        'podcasts',
        'courses',
        'enrollments',
        'groupMemberships',
        'notifications',
        'orders',
        'wallet',
        'settings',
      ],
      estimatedSize: 'Unknown',
      lastExport: null,
      canExport: true,
    };
  }

  async deleteAllUserData(userId: string): Promise<{
    success: boolean;
    deletedCounts: Record<string, number>;
  }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const deletedCounts: Record<string, number> = {};

    const posts = await this.postsRepo.find({ where: { user: { id: userId } } as any });
    deletedCounts.posts = posts.length;
    await this.postsRepo.remove(posts);

    const articles = await this.articlesRepo.find({ where: { authorId: userId } });
    deletedCounts.articles = articles.length;
    await this.articlesRepo.remove(articles);

    const podcasts = await this.podcastsRepo.find({ where: { authorId: userId } });
    deletedCounts.podcasts = podcasts.length;
    await this.podcastsRepo.remove(podcasts);

    user.username = `deleted_${user.id.slice(0, 8)}`;
    user.email = `deleted_${user.id.slice(0, 8)}@zynkra.deleted`;
    user.bio = null;
    user.avatar = null;
    await this.usersRepo.save(user);

    this.logger.log(`User data deleted for ${userId}`);

    return { success: true, deletedCounts };
  }
}
