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
import { DataExport } from './entities/data-export.entity';
import { DataPermission } from '../features/account-management/dto/data-permissions.dto';
import { DEFAULT_DATA_PERMISSIONS } from '../common/data-permissions/data-permissions.service';

type ExportCategory =
  | 'profile'
  | 'posts'
  | 'messages'
  | 'personalization'
  | 'analytics'
  | 'connected_services'
  | 'settings';

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
  personalization: any;
  analytics: any;
  exportManifest: {
    enabledCategories: ExportCategory[];
    omittedCategories: ExportCategory[];
  };
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
    @InjectRepository(DataExport) private readonly dataExportsRepo: Repository<DataExport>,
  ) {}

  async exportUserData(userId: string): Promise<ExportData> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const enabledCategories = Array.from(new Set(
      user.accountDataPermissions === null || user.accountDataPermissions === undefined
        ? DEFAULT_DATA_PERMISSIONS
        : user.accountDataPermissions,
    )) as ExportCategory[];
    const hasCategory = (category: ExportCategory) => enabledCategories.includes(category);
    const canExportPosts = hasCategory('posts');
    const canExportMessages = hasCategory('messages');
    const canExportProfile = hasCategory('profile');
    const canExportSettings = hasCategory('settings');
    const canExportConnectedServices = hasCategory('connected_services');
    const canExportPersonalization = hasCategory('personalization');
    const canExportAnalytics = hasCategory('analytics');

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
      canExportPosts ? this.postsRepo.find({
        where: { user: { id: userId } },
        relations: ['media', 'reelEffect'],
      }) : Promise.resolve([]),
      canExportMessages ? this.messagesRepo.find({ where: { sender: { id: userId } } as any, relations: ['conversation'] }) : Promise.resolve([]),
      canExportPosts ? this.commentsRepo.find({ where: { user: { id: userId } } as any, relations: ['post', 'parent'] }) : Promise.resolve([]),
      canExportPosts ? this.reactionsRepo.find({ where: { user: { id: userId } } as any, relations: ['post'] }) : Promise.resolve([]),
      canExportPosts ? this.storiesRepo.find({ where: { user: { id: userId } } as any, relations: ['elements'] }) : Promise.resolve([]),
      canExportProfile ? this.groupMembersRepo.find({
        where: { user: { id: userId } },
        relations: ['group'],
      }) : Promise.resolve([]),
      canExportSettings ? this.notificationsRepo.find({ where: { user: { id: userId } } as any }) : Promise.resolve([]),
      canExportConnectedServices ? this.ordersRepo.find({ where: { customerId: userId }, relations: ['items'] }) : Promise.resolve([]),
      canExportConnectedServices ? this.ledgerRepo.find({ where: { user: { id: userId } } as any }) : Promise.resolve([]),
      canExportPosts ? this.articlesRepo.find({ where: { authorId: userId } }) : Promise.resolve([]),
      canExportPosts ? this.podcastsRepo.find({ where: { authorId: userId } }) : Promise.resolve([]),
      canExportPosts ? this.coursesRepo.find({ where: { authorId: userId } }) : Promise.resolve([]),
      canExportPosts ? this.enrollmentsRepo.find({ where: { userId } }) : Promise.resolve([]),
      canExportPosts ? this.bookmarksRepo.find({ where: { user: { id: userId } } as any, relations: ['post'] }) : Promise.resolve([]),
    ]);

    const follows = canExportProfile ? await Promise.all([
      this.followsRepo.find({
        where: { followerId: userId },
        relations: ['following'],
      }),
      this.followsRepo.find({
        where: { followingId: userId },
        relations: ['follower'],
      }),
    ]) : [[], []];

    // DMs received: messages in conversations the user is part of, excluding
    // their own sent messages (already captured above).
    const conversations = canExportMessages ? await this.conversationsRepo.find({
      where: { participants: { id: userId } },
    }) : [];
    const conversationIds = conversations.map((c) => c.id);
    let receivedMessages: Message[] = [];
    if (canExportMessages && conversationIds.length > 0) {
      receivedMessages = await this.messagesRepo
        .createQueryBuilder('m')
        .where('m.conversationId IN (:...ids)', { ids: conversationIds })
        .andWhere('m.senderId != :userId', { userId })
        .getMany();
    }

    return {
      user: canExportProfile ? {
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
      } : {
        id: user.id,
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
      follows: canExportProfile ? {
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
      } : { following: [], followers: [] },
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
        backgroundOptions: (s as any).backgroundOptions,
        arFilterName: (s as any).arFilterName,
        music: (s as any).music,
        elements: ((s as any).elements || []).map((element: any) => ({ ...element, id: undefined, story: undefined })),
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
      settings: canExportSettings ? {
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
      } : {},
      personalization: canExportPersonalization ? {
        accountPreferences: user.accountPreferences ?? {},
        privacy: {
          personalization: (user as any).personalization ?? null,
          adPersonalization: (user as any).adPersonalization ?? null,
          personalizationControls: (user as any).personalizationControls ?? {},
        },
      } : {},
      analytics: canExportAnalytics ? {
        posts: {
          count: posts.length,
          comments: comments.length,
          reactions: reactions.length,
        },
        audience: {
          following: follows[0].length,
          followers: follows[1].length,
        },
        content: {
          stories: stories.length,
          articles: articles.length,
          podcasts: podcasts.length,
          courses: courses.length,
        },
        messaging: {
          messages: messages.length + receivedMessages.length,
          conversations: conversations.length,
        },
        commerce: {
          orders: orders.length,
          walletEntries: wallet.length,
        },
      } : {},
      exportManifest: {
        enabledCategories,
        omittedCategories: (['profile', 'posts', 'messages', 'personalization', 'analytics', 'connected_services', 'settings'] as ExportCategory[])
          .filter((category) => !hasCategory(category)),
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
  ): Promise<{ imported: boolean; posts: number; comments: number; reactions: number; bookmarks: number; stories: number; follows: number; articles: number; podcasts: number; courses: number; enrollments: number }> {
    this.validateImportPayload(data);

    let importedPosts = 0;
    let importedComments = 0;
    let importedReactions = 0;
    let importedBookmarks = 0;
    let importedStories = 0;
    let importedFollows = 0;
    let importedArticles = 0;
    let importedPodcasts = 0;
    let importedCourses = 0;
    let importedEnrollments = 0;

    await this.postsRepo.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const enabledCategories = new Set<DataPermission>(
        user.accountDataPermissions === null || user.accountDataPermissions === undefined
          ? DEFAULT_DATA_PERMISSIONS
          : user.accountDataPermissions as DataPermission[],
      );
      const canImport = (permission: DataPermission) => enabledCategories.has(permission);

      if (canImport(DataPermission.PROFILE)) {
        if (data.user.displayName !== undefined) user.displayName = data.user.displayName;
        if (data.user.bio !== undefined) user.bio = data.user.bio;
        if (data.user.pronouns !== undefined) user.pronouns = data.user.pronouns;
        if (data.user.avatar !== undefined) user.avatar = data.user.avatar;
        if (data.user.header !== undefined) user.header = data.user.header;
        if (data.user.accountType) (user as any).accountType = data.user.accountType;
      }
      const settings = data.settings || {};
      if (canImport(DataPermission.SETTINGS)) {
        for (const key of ['postVisibility', 'commentPrivacy', 'messagePrivacy', 'profileTheme', 'profileThemeColor', 'notificationSettings', 'followedHashtags', 'blockedKeywords', 'blockedHashtags', 'blockedContentTypes']) {
          if (settings[key] !== undefined) (user as any)[key] = settings[key];
        }
      }
      await manager.save(User, user);

      const postIdMap = new Map<string, Post>();
      if (canImport(DataPermission.POSTS) && Array.isArray(data.posts)) {
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
          if (p.id) postIdMap.set(p.id, post);
          importedPosts++;
        }
      }

      if (canImport(DataPermission.POSTS) && Array.isArray(data.comments)) {
        for (const commentData of data.comments) {
          const post = postIdMap.get(commentData.postId);
          if (!post || !commentData.content) continue;
          const comment = manager.create(Comment, {
            content: commentData.content,
            sentiment: commentData.sentiment,
            user,
            post,
          } as Partial<Comment>);
          await manager.save(Comment, comment);
          importedComments++;
        }
      }

      if (canImport(DataPermission.POSTS) && Array.isArray(data.reactions)) {
        for (const reactionData of data.reactions) {
          const post = postIdMap.get(reactionData.postId);
          if (!post || !reactionData.reaction) continue;
          await manager.save(PostReaction, manager.create(PostReaction, { reaction: reactionData.reaction, user, post }));
          importedReactions++;
        }
      }

      if (canImport(DataPermission.POSTS) && Array.isArray(data.bookmarks)) {
        for (const bookmarkData of data.bookmarks) {
          const post = postIdMap.get(bookmarkData.postId);
          if (!post) continue;
          await manager.save(Bookmark, manager.create(Bookmark, { user, post }));
          importedBookmarks++;
        }
      }

      if (canImport(DataPermission.POSTS) && Array.isArray(data.stories)) {
        for (const storyData of data.stories) {
          const story = manager.create(Story, {
            user,
            textContent: storyData.textContent,
            mediaUrl: storyData.mediaUrl,
            audience: storyData.audience,
            expiresAt: storyData.expiresAt ? new Date(storyData.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
            backgroundOptions: storyData.backgroundOptions,
            arFilterName: storyData.arFilterName,
            music: storyData.music,
          } as Partial<Story>);
          await manager.save(Story, story);
          importedStories++;
        }
      }

      const importedCourseIds = new Map<string, Course>();
      const createSlug = (title: string, sourceId: string | undefined) => {
        const base = String(title || 'untitled')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'untitled';
        return `${base}-${sourceId || Date.now()}`;
      };

      if (canImport(DataPermission.POSTS) && Array.isArray(data.articles)) {
        for (const articleData of data.articles) {
          if (!articleData.title || !articleData.content) continue;
          const article = manager.create(Article, {
            slug: createSlug(articleData.title, articleData.id),
            title: articleData.title,
            content: articleData.content,
            publishedAt: articleData.publishedAt ? new Date(articleData.publishedAt) : null,
            authorId: user.id,
          });
          await manager.save(Article, article);
          importedArticles++;
        }
      }

      if (canImport(DataPermission.POSTS) && Array.isArray(data.podcasts)) {
        for (const podcastData of data.podcasts) {
          if (!podcastData.title || !podcastData.description) continue;
          const podcast = manager.create(Podcast, {
            slug: createSlug(podcastData.title, podcastData.id),
            title: podcastData.title,
            description: podcastData.description,
            audioUrl: podcastData.audioUrl,
            createdAt: podcastData.createdAt ? new Date(podcastData.createdAt) : undefined,
            authorId: user.id,
          });
          await manager.save(Podcast, podcast);
          importedPodcasts++;
        }
      }

      if (canImport(DataPermission.POSTS) && Array.isArray(data.courses)) {
        for (const courseData of data.courses) {
          if (!courseData.title || !courseData.description) continue;
          const course = manager.create(Course, {
            slug: createSlug(courseData.title, courseData.id),
            title: courseData.title,
            description: courseData.description,
            createdAt: courseData.createdAt ? new Date(courseData.createdAt) : undefined,
            authorId: user.id,
          });
          await manager.save(Course, course);
          if (courseData.id) importedCourseIds.set(courseData.id, course);
          importedCourses++;
        }
      }

      if (canImport(DataPermission.POSTS) && Array.isArray(data.enrollments)) {
        for (const enrollmentData of data.enrollments) {
          const course = importedCourseIds.get(enrollmentData.courseId);
          if (!course) continue;
          const enrollment = manager.create(CourseEnrollment, {
            courseId: course.id,
            userId: user.id,
            progress: enrollmentData.progress ?? 0,
            isCompleted: enrollmentData.isCompleted ?? false,
            createdAt: enrollmentData.enrolledAt ? new Date(enrollmentData.enrolledAt) : undefined,
          });
          await manager.save(CourseEnrollment, enrollment);
          importedEnrollments++;
        }
      }

      const followingUsernames = (canImport(DataPermission.PROFILE) ? data.follows?.following : [])
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

    return { imported: true, posts: importedPosts, comments: importedComments, reactions: importedReactions, bookmarks: importedBookmarks, stories: importedStories, follows: importedFollows, articles: importedArticles, podcasts: importedPodcasts, courses: importedCourses, enrollments: importedEnrollments };
  }

  private validateImportPayload(data: ExportData): void {
    if (!data || typeof data !== 'object' || Array.isArray(data) || !data.user || typeof data.user !== 'object' || Array.isArray(data.user)) {
      throw new BadRequestException('Invalid export data: missing user object');
    }

    if (data.version && !/^2\./.test(String(data.version))) {
      throw new BadRequestException('Unsupported export version. Expected version 2.x.');
    }

    const collections = ['posts', 'comments', 'reactions', 'bookmarks', 'stories', 'articles', 'podcasts', 'courses', 'enrollments'] as const;
    for (const collection of collections) {
      if (data[collection] !== undefined && !Array.isArray(data[collection])) {
        throw new BadRequestException(`Invalid export data: ${collection} must be an array`);
      }
      if (Array.isArray(data[collection]) && data[collection].length > 10000) {
        throw new BadRequestException(`Invalid export data: ${collection} exceeds the 10,000 item limit`);
      }
    }

    if (data.follows !== undefined && (
      typeof data.follows !== 'object' ||
      !Array.isArray(data.follows.following) ||
      !Array.isArray(data.follows.followers)
    )) {
      throw new BadRequestException('Invalid export data: follows must contain following and followers arrays');
    }
  }

  async getExportInfo(userId: string): Promise<{
    userId: string;
    dataTypes: string[];
    estimatedSize: string;
    lastExport: string | null;
    canExport: boolean;
  }> {
    const lastExport = await this.dataExportsRepo.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
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
      lastExport: lastExport?.createdAt?.toISOString() ?? null,
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
    const remove = async (name: string, repository: Repository<any>, criteria: any) => {
      const rows = await repository.find({ where: criteria });
      deletedCounts[name] = rows.length;
      if (rows.length) await repository.remove(rows);
    };

    await remove('comments', this.commentsRepo, { user: { id: userId } });
    await remove('reactions', this.reactionsRepo, { user: { id: userId } });
    await remove('bookmarks', this.bookmarksRepo, { user: { id: userId } });
    await remove('stories', this.storiesRepo, { user: { id: userId } });
    await remove('groupMemberships', this.groupMembersRepo, { user: { id: userId } });
    await remove('notifications', this.notificationsRepo, { user: { id: userId } });
    await remove('messages', this.messagesRepo, { sender: { id: userId } });
    await remove('orders', this.ordersRepo, { customerId: userId });
    await remove('wallet', this.ledgerRepo, { user: { id: userId } });
    await remove('articles', this.articlesRepo, { authorId: userId });
    await remove('podcasts', this.podcastsRepo, { authorId: userId });
    await remove('enrollments', this.enrollmentsRepo, { userId });
    await remove('posts', this.postsRepo, { user: { id: userId } });

    const follows = await this.followsRepo.find({ where: [{ followerId: userId }, { followingId: userId }] });
    deletedCounts.follows = follows.length;
    if (follows.length) await this.followsRepo.remove(follows);

    user.username = `deleted_${user.id.slice(0, 8)}`;
    user.email = `deleted_${user.id.slice(0, 8)}@zynkra.deleted`;
    user.bio = null;
    user.avatar = null;
    await this.usersRepo.save(user);

    this.logger.log(`User data deleted for ${userId}`);

    return { success: true, deletedCounts };
  }
}
