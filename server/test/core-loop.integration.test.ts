/**
 * Phase 1 exit criterion: full Core loop over HTTP —
 * signup → profile → post → feed → follow → comment → react → DM → notify.
 *
 * One Nest app, many controllers, shared in-memory store so each step
 * sees the previous step's writes. Services are mocked at the boundary
 * (repos/DB) but exercise real controllers + ValidationPipe + JWT auth.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { CaptchaService } from '../src/auth/captcha.service';
import { WebauthnService } from '../src/auth/webauthn.service';
import { BiometricAuthService } from '../src/auth/biometric-auth.service';
import { AccountLinkingService } from '../src/features/account-management/account-linking.service';
import { AccountManagementService } from '../src/features/account-management/account-management.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { User } from '../src/users/entities/user.entity';

import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { PagesService } from '../src/pages/pages.service';
import { VisibilityService } from '../src/common/visibility/visibility.service';

import { PostsController } from '../src/posts/posts.controller';
import { PostsService } from '../src/posts/posts.service';

import { FeedController } from '../src/feed/feed.controller';
import { FeedService } from '../src/feed/feed.service';

import { CommentsController } from '../src/comments/comments.controller';
import { CommentsService } from '../src/comments/comments.service';

import { ReactionsController } from '../src/reactions/reactions.controller';
import { ReactionsService } from '../src/reactions/reactions.service';

import { DmsController } from '../src/dms/dms.controller';
import { DmsService } from '../src/dms/dms.service';

import { NotificationsController } from '../src/notifications/notifications.controller';
import { NotificationsService } from '../src/notifications/notifications.service';
import { AiNotificationsService } from '../src/notifications/ai-notifications.service';
import { NotificationType } from '../src/notifications/entities/notification.entity';

type Id = string;

interface StoreUser {
  id: Id;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  status?: string;
  banned?: boolean;
  emailVerified?: boolean;
  password_hash?: string;
  following?: StoreUser[];
  followers?: StoreUser[];
  commentPrivacy?: string;
  messagePrivacy?: string;
  readReceipts?: boolean;
}

interface StorePost {
  id: Id;
  content: string;
  user: StoreUser;
  visibility: string;
  createdAt: Date;
  tags?: { id: string; name: string }[];
  reactions?: { id: Id; user: StoreUser; reaction: string }[];
  comments?: { id: Id; content: string; user: StoreUser }[];
  repostCount?: number;
  shareCount?: number;
  viewCount?: number;
}

interface StoreConversation {
  id: Id;
  participants: StoreUser[];
  type: string;
  isEncrypted: boolean;
  messages: StoreMessage[];
}

interface StoreMessage {
  id: Id;
  content: string;
  sender: StoreUser;
  conversation: StoreConversation;
  createdAt: Date;
  deletedAt?: Date | null;
}

interface StoreNotification {
  id: Id;
  user: { id: Id };
  type: NotificationType | string;
  data: any;
  read: boolean;
  createdAt: Date;
}

function createStore() {
  const users = new Map<Id, StoreUser>();
  const usersByUsername = new Map<string, Id>();
  const usersByEmail = new Map<string, Id>();
  const posts: StorePost[] = [];
  const follows: { followerId: Id; followingId: Id }[] = [];
  const comments: {
    id: Id;
    content: string;
    user: StoreUser;
    post: StorePost;
    parentId?: Id;
    createdAt: Date;
  }[] = [];
  const reactions: { id: Id; post: StorePost; user: StoreUser; reaction: string }[] = [];
  const conversations: StoreConversation[] = [];
  const notifications: StoreNotification[] = [];
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}-${++seq}`;

  return {
    users,
    usersByUsername,
    usersByEmail,
    posts,
    follows,
    comments,
    reactions,
    conversations,
    notifications,
    nextId,
    reset() {
      users.clear();
      usersByUsername.clear();
      usersByEmail.clear();
      posts.length = 0;
      follows.length = 0;
      comments.length = 0;
      reactions.length = 0;
      conversations.length = 0;
      notifications.length = 0;
      seq = 0;
    },
    addUser(partial: Partial<StoreUser> & { username: string; email: string }): StoreUser {
      const user: StoreUser = {
        id: partial.id ?? this.nextId('user'),
        username: partial.username,
        email: partial.email,
        displayName: partial.displayName ?? partial.username,
        status: 'active',
        banned: false,
        emailVerified: partial.emailVerified ?? false,
        password_hash: partial.password_hash ?? 'hashed',
        following: [],
        followers: [],
        commentPrivacy: 'everyone',
        messagePrivacy: 'everyone',
        readReceipts: true,
        ...partial,
      };
      users.set(user.id, user);
      usersByUsername.set(user.username, user.id);
      usersByEmail.set(user.email, user.id);
      return user;
    },
    getUser(id: Id): StoreUser | undefined {
      return users.get(id);
    },
    getUserByUsername(username: string): StoreUser | undefined {
      const id = usersByUsername.get(username);
      return id ? users.get(id) : undefined;
    },
    getUserByEmail(email: string): StoreUser | undefined {
      const id = usersByEmail.get(email);
      return id ? users.get(id) : undefined;
    },
    isFollowing(followerId: Id, followingId: Id): boolean {
      return follows.some(
        (f) => f.followerId === followerId && f.followingId === followingId,
      );
    },
    followingIds(userId: Id): Id[] {
      return follows.filter((f) => f.followerId === userId).map((f) => f.followingId);
    },
    notify(userId: Id, type: NotificationType | string, data: any): StoreNotification {
      const n: StoreNotification = {
        id: this.nextId('notif'),
        user: { id: userId },
        type,
        data,
        read: false,
        createdAt: new Date(),
      };
      notifications.push(n);
      return n;
    },
    notificationsFor(userId: Id): StoreNotification[] {
      return notifications
        .filter((n) => n.user.id === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
  };
}

type Store = ReturnType<typeof createStore>;

function buildAuthMock(store: Store, signJwt?: (userId: Id) => string) {
  const tokenFor = (userId: Id): string =>
    signJwt ? signJwt(userId) : `token-${userId}`;

  return {
    signUp: jest.fn(async (dto: any) => {
      if (store.getUserByEmail(dto.email)) {
        const { ConflictException } = require('@nestjs/common');
        throw new ConflictException('Email already in use');
      }
      if (dto.username && store.getUserByUsername(dto.username)) {
        const { ConflictException } = require('@nestjs/common');
        throw new ConflictException('Username already in use');
      }
      store.addUser({
        username: dto.username,
        email: dto.email,
        password_hash: 'hashed',
        emailVerified: false,
      });
      return {
        message: 'Signup successful. A 6-digit verification code has been sent to your email.',
      };
    }),
    verifyByCode: jest.fn(async (email: string) => {
      const user = store.getUserByEmail(email);
      if (!user) {
        const { UnauthorizedException } = require('@nestjs/common');
        throw new UnauthorizedException('Invalid email or code');
      }
      user.emailVerified = true;
      return { access_token: tokenFor(user.id) };
    }),
    signIn: jest.fn(async (dto: any) => {
      const user = dto.email
        ? store.getUserByEmail(dto.email)
        : store.getUserByUsername(dto.username);
      if (!user || !user.emailVerified) {
        const { UnauthorizedException } = require('@nestjs/common');
        throw new UnauthorizedException('Invalid credentials');
      }
      return { access_token: tokenFor(user.id) };
    }),
    resendVerification: jest.fn(async () => ({
      message: 'If a user with that email exists, a verification email has been sent.',
    })),
    getLoginSessions: jest.fn(async () => []),
    getPendingLoginSessions: jest.fn(async () => []),
    approveLoginSession: jest.fn(async () => ({ message: 'ok' })),
    revokeLoginSession: jest.fn(async () => ({ message: 'ok' })),
    revokeAllOtherSessions: jest.fn(async () => ({ message: 'ok' })),
    socialLogin: jest.fn(),
    validateUser: jest.fn(),
    login: jest.fn(),
    setup2FA: jest.fn(),
    enable2FA: jest.fn(),
    verify2FALogin: jest.fn(),
    get2FAStatus: jest.fn(),
    disable2FA: jest.fn(),
    generateRecoveryCodes: jest.fn(),
    recoverAccount: jest.fn(),
    getRecoveryOptions: jest.fn(),
    getTrustedRecoveryContacts: jest.fn(),
    setTrustedRecoveryContacts: jest.fn(),
    requestTrustedContactRecovery: jest.fn(),
    verifyTrustedContactRecovery: jest.fn(),
    refreshToken: jest.fn(),
    signOut: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    requestMagicLink: jest.fn(),
    verifyMagicLink: jest.fn(),
    verifyEmail: jest.fn(),
    guestSignIn: jest.fn(),
    anonymousSignIn: jest.fn(),
    reactivateAndSignIn: jest.fn(),
    getBrainwaveDevices: jest.fn(),
    registerBrainwaveDevice: jest.fn(),
    removeBrainwaveDevice: jest.fn(),
  };
}

function buildUsersMock(store: Store) {
  return {
    findOneById: jest.fn(async (id: Id) => store.getUser(id) as any),
    findByEmail: jest.fn(async (email: string) => store.getUserByEmail(email) as any),
    findByUsername: jest.fn(async (username: string) => store.getUserByUsername(username) as any),
    createUser: jest.fn(async (dto: any) => store.addUser(dto) as any),
    update: jest.fn(async (id: Id, dto: any) => {
      const user = store.getUser(id);
      if (!user) throw new NotFoundException('User not found');
      Object.assign(user, dto);
      return user as any;
    }),
    updateProfile: jest.fn(async (id: Id, dto: any) => {
      const user = store.getUser(id);
      if (!user) throw new NotFoundException('User not found');
      Object.assign(user, dto);
      return user as any;
    }),
    follow: jest.fn(async (followerId: Id, targetId: Id) => {
      const follower = store.getUser(followerId);
      const target = store.getUser(targetId);
      if (!target) throw new NotFoundException('User not found');
      if (!store.isFollowing(followerId, targetId)) {
        store.follows.push({ followerId, followingId: targetId });
        follower?.following?.push(target);
        target.followers?.push(follower as StoreUser);
        store.notify(targetId, NotificationType.FOLLOW, { userId: followerId });
      }
      return undefined;
    }),
    unfollow: jest.fn(async (followerId: Id, targetId: Id) => {
      const idx = store.follows.findIndex(
        (f) => f.followerId === followerId && f.followingId === targetId,
      );
      if (idx >= 0) store.follows.splice(idx, 1);
      return undefined;
    }),
    findFollowingIds: jest.fn(async (userId: Id) => store.followingIds(userId)),
    getFollowing: jest.fn(async (userId: Id) =>
      store
        .followingIds(userId)
        .map((id) => store.getUser(id))
        .filter(Boolean) as any,
    ),
    getFollowers: jest.fn(async (userId: Id) =>
      store.follows
        .filter((f) => f.followingId === userId)
        .map((f) => store.getUser(f.followerId))
        .filter(Boolean) as any,
    ),
    getPendingFollowRequests: jest.fn(async () => []),
    cancelFollowRequest: jest.fn(),
    save: jest.fn(async (u: any) => u),
    search: jest.fn(async () => []),
    findOneWithPosts: jest.fn(async (id: Id) => store.getUser(id) as any),
    updatePrivacy: jest.fn(),
    updateAvatar: jest.fn(),
    restrict: jest.fn(),
    unrestrict: jest.fn(),
    getRestrictedUsers: jest.fn(async () => []),
    block: jest.fn(),
    unblock: jest.fn(),
    getBlockedUsers: jest.fn(async () => []),
    mute: jest.fn(),
    unmute: jest.fn(),
    getMutedUsers: jest.fn(async () => []),
    getBlockedKeywords: jest.fn(async () => []),
    getBlockedHashtags: jest.fn(async () => []),
    getBlockedContentTypes: jest.fn(async () => []),
    blockKeyword: jest.fn(),
    unblockKeyword: jest.fn(),
    blockHashtag: jest.fn(),
    unblockHashtag: jest.fn(),
    blockContentType: jest.fn(),
    unblockContentType: jest.fn(),
    followHashtag: jest.fn(),
    unfollowHashtag: jest.fn(),
    createFollowRequest: jest.fn(),
    removeFollower: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    findFollowSuggestions: jest.fn(async () => []),
    setBirthDate: jest.fn(),
    getAgeVerificationStatus: jest.fn(),
    deactivate: jest.fn(),
    reactivate: jest.fn(),
    delete: jest.fn(),
    updateFaceRecognition: jest.fn(),
    createGuestUser: jest.fn(),
    createAnonymousUser: jest.fn(),
    isAgeVerified: jest.fn(async () => true),
    findOrCreate: jest.fn(),
    setPasswordResetToken: jest.fn(),
    findByPasswordResetToken: jest.fn(),
    findByMagicLinkTokenHash: jest.fn(),
    findByEmailVerificationToken: jest.fn(),
  };
}

function buildPostsMock(store: Store) {
  return {
    create: jest.fn(async (userPayload: { userId: string }, dto: any) => {
      const user = store.getUser(userPayload.userId);
      if (!user) throw new Error('User not found');
      const post: StorePost = {
        id: store.nextId('post'),
        content: dto.content,
        user,
        visibility: dto.visibility ?? 'public',
        createdAt: new Date(),
        tags: [],
        reactions: [],
        comments: [],
        repostCount: 0,
        shareCount: 0,
        viewCount: 0,
      };
      store.posts.unshift(post);
      return post as any;
    }),
    findAll: jest.fn(async () => store.posts as any),
    findOne: jest.fn(async (id: Id) => {
      const post = store.posts.find((p) => p.id === id);
      if (!post) throw new NotFoundException('Post not found');
      return post as any;
    }),
    findPostsByUserId: jest.fn(async (userId: Id) =>
      store.posts.filter((p) => p.user.id === userId) as any,
    ),
    like: jest.fn(async (postId: Id, userPayload: { userId: string }) => {
      const post = store.posts.find((p) => p.id === postId);
      const user = store.getUser(userPayload.userId);
      if (!post || !user) throw new Error('Post not found');
      const existing = store.reactions.find(
        (r) => r.post.id === postId && r.user.id === user.id,
      );
      if (!existing) {
        const reaction = {
          id: store.nextId('rx'),
          post,
          user,
          reaction: 'like',
        };
        store.reactions.push(reaction);
        post.reactions?.push({ id: reaction.id, user, reaction: 'like' });
        if (post.user.id !== user.id) {
          store.notify(post.user.id, NotificationType.LIKE, {
            userId: user.id,
            postId: post.id,
          });
        }
      }
      return post as any;
    }),
    unlike: jest.fn(async (postId: Id, userPayload: { userId: string }) => {
      const idx = store.reactions.findIndex(
        (r) => r.post.id === postId && r.user.id === userPayload.userId,
      );
      if (idx >= 0) {
        const [removed] = store.reactions.splice(idx, 1);
        const postRx = removed.post.reactions?.findIndex((r) => r.id === removed.id);
        if (postRx != null && postRx >= 0) removed.post.reactions?.splice(postRx, 1);
      }
      const post = store.posts.find((p) => p.id === postId);
      return post as any;
    }),
    update: jest.fn(),
    remove: jest.fn(),
    share: jest.fn(),
    repost: jest.fn(),
    undoRepost: jest.fn(),
    togglePin: jest.fn(),
    archive: jest.fn(),
    feature: jest.fn(),
    unfeature: jest.fn(),
    createDraft: jest.fn(),
    findDrafts: jest.fn(async () => []),
    findDraft: jest.fn(),
    updateDraft: jest.fn(),
    publishDraft: jest.fn(),
    deleteDraft: jest.fn(),
    setCollaborators: jest.fn(),
    getPostAnalytics: jest.fn(),
    findSimilarPosts: jest.fn(async () => []),
    getOEmbed: jest.fn(),
    findPostsByHashtag: jest.fn(async () => []),
  };
}

function buildFeedMock(store: Store) {
  const viewerIdOf = (user?: any): string | null =>
    user?.userId ?? user?.id ?? null;

  return {
    getForYouFeed: jest.fn(async (user?: any) => {
      void viewerIdOf(user);
      return store.posts as any;
    }),
    getChronologicalFeed: jest.fn(async () => store.posts as any),
    getRecommendedFeed: jest.fn(async () => store.posts as any),
    getFeed: jest.fn(async () => store.posts as any),
    getShortsFeed: jest.fn(async () => []),
    getStoryFeed: jest.fn(async () => []),
    getFavoritesFeed: jest.fn(async () => []),
    getFriendsFeed: jest.fn(async (user: any) => {
      const viewerId = viewerIdOf(user);
      if (!viewerId) return [] as any;
      const following = new Set(store.followingIds(viewerId));
      return store.posts.filter((p) => following.has(p.user.id)) as any;
    }),
    getSubscriptionsFeed: jest.fn(async () => []),
    getLocalFeed: jest.fn(async () => []),
    getTrendingFeed: jest.fn(async () => store.posts as any),
    getExploreFeed: jest.fn(async () => ({ posts: store.posts, hasMore: false })),
    getExploreCategories: jest.fn(async () => ({ categories: [] })),
    getVisualDiscoveryFeed: jest.fn(async () => ({ posts: [], hasMore: false })),
    getVisualCategories: jest.fn(async () => ({ categories: [] })),
  };
}

function buildCommentsMock(store: Store) {
  return {
    create: jest.fn(async (content: string, user: any, post: any, parentId?: string) => {
      const comment = {
        id: store.nextId('comment'),
        content,
        user,
        post,
        parentId,
        createdAt: new Date(),
      };
      store.comments.push(comment);
      post.comments?.push({ id: comment.id, content, user });
      if (post.user.id !== user.id) {
        store.notify(post.user.id, NotificationType.COMMENT, {
          userId: user.id,
          postId: post.id,
          commentId: comment.id,
        });
      }
      return comment as any;
    }),
    findByPost: jest.fn(async (postId: Id) =>
      store.comments.filter((c) => c.post.id === postId && !c.parentId) as any,
    ),
    findOne: jest.fn(async (id: Id) => store.comments.find((c) => c.id === id) as any),
    delete: jest.fn(async (commentId: Id) => {
      const idx = store.comments.findIndex((c) => c.id === commentId);
      if (idx >= 0) store.comments.splice(idx, 1);
    }),
    togglePin: jest.fn(),
    toggleLock: jest.fn(),
  };
}

function buildReactionsMock(store: Store) {
  return {
    addReaction: jest.fn(async (userId: Id, postId: Id, reaction: string) => {
      const post = store.posts.find((p) => p.id === postId);
      if (!post) throw new NotFoundException('Post not found');
      const user = store.getUser(userId);
      if (!user) throw new NotFoundException('User not found');

      const existingIdx = store.reactions.findIndex(
        (r) => r.post.id === postId && r.user.id === userId && r.reaction === reaction,
      );
      if (existingIdx >= 0) {
        const [removed] = store.reactions.splice(existingIdx, 1);
        const postIdx = post.reactions?.findIndex((r) => r.id === removed.id);
        if (postIdx != null && postIdx >= 0) post.reactions?.splice(postIdx, 1);
        return removed as any;
      }

      const saved = {
        id: store.nextId('rx'),
        post,
        user,
        reaction,
      };
      store.reactions.push(saved);
      post.reactions?.push({ id: saved.id, user, reaction });
      if (post.user.id !== userId) {
        store.notify(post.user.id, NotificationType.LIKE, {
          userId,
          postId,
          reaction,
        });
      }
      return saved as any;
    }),
  };
}

function buildDmsMock(store: Store) {
  return {
    createConversation: jest.fn(async (starter: any, recipientIds: string[], name?: string) => {
      const recipients = recipientIds
        .map((id) => store.getUser(id))
        .filter(Boolean) as StoreUser[];
      if (recipients.length !== recipientIds.length) {
        throw new NotFoundException('One or more recipients not found');
      }
      const participants = [starter, ...recipients];
      const conversation: StoreConversation = {
        id: store.nextId('conv'),
        participants,
        type: participants.length === 2 && !name ? 'one_to_one' : 'group',
        isEncrypted: false,
        messages: [],
      };
      store.conversations.push(conversation);
      return conversation as any;
    }),
    sendMessage: jest.fn(async (sender: any, conversationId: Id, dto: any) => {
      const conversation = store.conversations.find((c) => c.id === conversationId);
      if (!conversation) throw new NotFoundException('Conversation not found');
      const message: StoreMessage = {
        id: store.nextId('msg'),
        content: dto.content ?? '',
        sender,
        conversation,
        createdAt: new Date(),
        deletedAt: null,
      };
      conversation.messages.push(message);
      for (const p of conversation.participants) {
        if (p.id !== sender.id) {
          store.notify(p.id, 'message' as any, {
            conversationId,
            messageId: message.id,
            from: sender.id,
          });
        }
      }
      return message as any;
    }),
    getConversations: jest.fn(async (user: any) =>
      store.conversations
        .filter((c) => c.participants.some((p) => p.id === user.id))
        .map((c) => ({
          ...c,
          lastMessage: c.messages.at(-1),
          unreadCount: c.messages.filter((m) => m.sender.id !== user.id).length,
        })) as any,
    ),
    getMessages: jest.fn(async (user: any, conversationId: Id) => {
      const conversation = store.conversations.find((c) => c.id === conversationId);
      if (!conversation) throw new NotFoundException('Conversation not found');
      if (!conversation.participants.some((p) => p.id === user.id)) {
        const { UnauthorizedException } = require('@nestjs/common');
        throw new UnauthorizedException('You are not a participant of this conversation.');
      }
      return conversation.messages.filter((m) => !m.deletedAt) as any;
    }),
    markConversationAsRead: jest.fn(async () => ({ conversationId: '', markedCount: 0 })),
    markMessageAsRead: jest.fn(async () => null),
    addReaction: jest.fn(),
    updateMessage: jest.fn(),
    deleteMessage: jest.fn(),
    forwardMessage: jest.fn(),
    setVanishMode: jest.fn(),
    setMessageTtl: jest.fn(),
  };
}

function buildNotificationsMock(store: Store) {
  return {
    create: jest.fn(async (user: any, type: any, data: any) =>
      store.notify(user.id, type, data) as any,
    ),
    createNotification: jest.fn(async (user: any, type: any, data: any) =>
      store.notify(user.id, type, data) as any,
    ),
    getNotifications: jest.fn(async (userId: Id) => store.notificationsFor(userId) as any),
    getUnreadCount: jest.fn(async (userId: Id) => ({
      count: store.notificationsFor(userId).filter((n) => !n.read).length,
    })),
    markAsRead: jest.fn(async (notificationId: Id, userId: Id) => {
      const n = store.notifications.find((x) => x.id === notificationId && x.user.id === userId);
      if (n) n.read = true;
      return n as any;
    }),
    markAllAsRead: jest.fn(async () => ({ success: true })),
    savePushSubscription: jest.fn(),
    removePushSubscription: jest.fn(async () => ({ success: true })),
    saveMobilePushToken: jest.fn(),
    sendBrowserPush: jest.fn(),
    sendMobilePush: jest.fn(),
  };
}

function buildVisibilityMock(store: Store) {
  return {
    isBlockedEither: jest.fn(async () => false),
    isFollowing: jest.fn(async (a: Id, b: Id) => store.isFollowing(a, b)),
    canViewAuthor: jest.fn(async (viewerId: string | null, authorId: string) => {
      if (viewerId === authorId) return true;
      return true;
    }),
    canViewActivity: jest.fn(async () => true),
    filterVisiblePostsForViewer: jest.fn(async (_v: any, posts: any) => posts),
    filterVisiblePosts: jest.fn(async (_v: any, posts: any) => posts),
    getBlockedIdSet: jest.fn(async () => new Set<string>()),
    getHiddenPrivateAuthorIds: jest.fn(async () => new Set<string>()),
  };
}

async function buildCoreLoopApp() {
  const store = createStore();

  // JwtService is available after module compile; auth mock signs real JWTs.
  let signJwt: ((userId: Id) => string) | undefined;
  const authMock = buildAuthMock(store, (userId) => signJwt!(userId));
  const usersMock = buildUsersMock(store);
  const postsMock = buildPostsMock(store);
  const feedMock = buildFeedMock(store);
  const commentsMock = buildCommentsMock(store);
  const reactionsMock = buildReactionsMock(store);
  const dmsMock = buildDmsMock(store);
  const notificationsMock = buildNotificationsMock(store);
  const visibilityMock = buildVisibilityMock(store);

  const ref = await Test.createTestingModule({
    imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'test-secret' }),
    ],
    controllers: [
      AuthController,
      UsersController,
      PostsController,
      FeedController,
      CommentsController,
      ReactionsController,
      DmsController,
      NotificationsController,
    ],
    providers: [
      { provide: AuthService, useValue: authMock },
      {
        provide: CaptchaService,
        useValue: { generate: jest.fn(), verify: jest.fn().mockReturnValue(true) },
      },
      {
        provide: WebauthnService,
        useValue: {
          getRegistrationOptions: jest.fn(),
          verifyRegistration: jest.fn(),
          getAuthenticationOptions: jest.fn(),
          verifyAuthentication: jest.fn(),
          getPasskeys: jest.fn(),
          deletePasskey: jest.fn(),
          updateAuthenticatorCounter: jest.fn(),
        },
      },
      {
        provide: BiometricAuthService,
        useValue: {
          listBiometricDevices: jest.fn(async () => []),
          registerBiometricDevice: jest.fn(),
          generateBiometricChallenge: jest.fn(),
          verifyBiometricChallenge: jest.fn(),
          deleteBiometricDevice: jest.fn(),
        },
      },
      {
        provide: AccountLinkingService,
        useValue: {
          verifyOAuthState: jest.fn(),
          linkOAuthAccount: jest.fn(),
        },
      },
      {
        provide: AccountManagementService,
        useValue: {
          switchAccount: jest.fn(),
          switchAccountProfile: jest.fn(),
          listAccountProfiles: jest.fn(async () => []),
          createAccountProfile: jest.fn(),
          setPrimaryAccountProfile: jest.fn(),
          recordSecurityAlert: jest.fn(),
          createLoginApproval: jest.fn(),
        },
      },
      { provide: UsersService, useValue: usersMock },
      {
        provide: PagesService,
        useValue: {
          findPageSuggestions: jest.fn(async () => []),
        },
      },
      { provide: PostsService, useValue: postsMock },
      { provide: FeedService, useValue: feedMock },
      { provide: CommentsService, useValue: commentsMock },
      { provide: ReactionsService, useValue: reactionsMock },
      { provide: DmsService, useValue: dmsMock },
      { provide: NotificationsService, useValue: notificationsMock },
      {
        provide: AiNotificationsService,
        useValue: {
          generateDigest: jest.fn(async () => ({ digest: [] })),
          filterNotifications: jest.fn(async (n: any) => n),
        },
      },
      { provide: VisibilityService, useValue: visibilityMock },
      {
        provide: ConfigService,
        useValue: {
          get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined),
        },
      },
      {
        provide: getRepositoryToken(LoginSession),
        useValue: {
          findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }),
          update: jest.fn(),
        },
      },
      {
        provide: getRepositoryToken(User),
        useValue: {
          findOne: jest.fn(async ({ where }: any) =>
            where?.id ? (store.getUser(where.id) as any) : null,
          ),
        },
      },
      JwtStrategy,
    ],
  }).compile();

  const app = ref.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const jwt = ref.get(JwtService);
  signJwt = (userId: Id) => jwt.sign({ sub: userId, sid: 's1' });
  const tokenFor = signJwt;

  return {
    app,
    store,
    tokenFor,
    authMock,
    usersMock,
    postsMock,
    feedMock,
    commentsMock,
    reactionsMock,
    dmsMock,
    notificationsMock,
  };
}

describe('Core loop (Phase 1 exit): signup → profile → post → feed → follow → comment → react → DM → notify', () => {
  let ctx: Awaited<ReturnType<typeof buildCoreLoopApp>>;

  beforeAll(async () => {
    ctx = await buildCoreLoopApp();
  });

  afterAll(async () => {
    if (ctx?.app) await ctx.app.close();
  });

  beforeEach(() => {
    ctx.store.reset();
  });

  it('completes the full Core loop end-to-end', async () => {
    const http = ctx.app.getHttpServer();

    // --- 1. Signup: alice ---
    const aliceSignup = await request(http)
      .post('/auth/signup')
      .send({
        username: 'alice',
        email: 'alice@example.com',
        password: 'Password123!',
        birthDate: '1990-01-01',
        captchaId: 'cap-1',
        captchaAnswer: '12',
      });
    expect(aliceSignup.status).toBe(201);
    expect(aliceSignup.body.message).toContain('Signup successful');
    const alice = ctx.store.getUserByUsername('alice');
    expect(alice).toBeDefined();
    expect(alice!.emailVerified).toBe(false);

    // --- 2. Verify email → token ---
    const aliceVerify = await request(http)
      .post('/auth/verify-code')
      .send({ email: 'alice@example.com', code: '123456' });
    expect(aliceVerify.status).toBe(200);
    const aliceToken = aliceVerify.body.access_token;
    expect(aliceToken).toBeTruthy();
    expect(ctx.store.getUserByEmail('alice@example.com')!.emailVerified).toBe(true);

    // --- 3. Profile ---
    const aliceMe = await request(http)
      .get('/users/me')
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(aliceMe.status).toBe(200);
    expect(aliceMe.body.username).toBe('alice');

    const aliceProfile = await request(http)
      .patch('/users/me')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ displayName: 'Alice A', bio: 'Hello from the Core loop' });
    expect(aliceProfile.status).toBe(200);
    expect(ctx.store.getUser(alice!.id)!.displayName).toBe('Alice A');
    expect(ctx.store.getUser(alice!.id)!.bio).toBe('Hello from the Core loop');

    // --- 4. Post ---
    const createPost = await request(http)
      .post('/posts')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ content: 'First post from the Core loop #zynkra' });
    expect(createPost.status).toBe(201);
    const postId = createPost.body.id;
    expect(postId).toBeTruthy();
    expect(ctx.store.posts).toHaveLength(1);
    expect(ctx.store.posts[0].content).toContain('Core loop');

    // --- 5. Feed sees the post ---
    const feed = await request(http)
      .get('/feed')
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(feed.status).toBe(200);
    const feedList = Array.isArray(feed.body) ? feed.body : feed.body.posts ?? [];
    expect(feedList.some((p: any) => p.id === postId)).toBe(true);

    const postsList = await request(http).get('/posts');
    expect(postsList.status).toBe(200);
    expect(postsList.body.some((p: any) => p.id === postId)).toBe(true);

    // --- 6. Signup bob + verify ---
    const bobSignup = await request(http)
      .post('/auth/signup')
      .send({
        username: 'bob',
        email: 'bob@example.com',
        password: 'Password123!',
        birthDate: '1991-02-02',
        captchaId: 'cap-2',
        captchaAnswer: '12',
      });
    expect(bobSignup.status).toBe(201);
    const bob = ctx.store.getUserByUsername('bob');
    expect(bob).toBeDefined();

    const bobVerify = await request(http)
      .post('/auth/verify-code')
      .send({ email: 'bob@example.com', code: '654321' });
    expect(bobVerify.status).toBe(200);
    const bobToken = bobVerify.body.access_token;

    // --- 7. Follow alice ---
    const follow = await request(http)
      .post(`/users/${alice!.id}/follow`)
      .set('Authorization', `Bearer ${bobToken}`);
    expect(follow.status).toBe(204);
    expect(ctx.store.isFollowing(bob!.id, alice!.id)).toBe(true);
    // Alice notified of the follow
    const followNotifs = ctx.store
      .notificationsFor(alice!.id)
      .filter((n) => n.type === NotificationType.FOLLOW);
    expect(followNotifs.length).toBeGreaterThanOrEqual(1);
    expect(followNotifs[0].data.userId).toBe(bob!.id);

    // Friends feed (following) for bob includes alice's post
    const friendsFeed = await request(http)
      .get('/feed/friends')
      .set('Authorization', `Bearer ${bobToken}`);
    expect(friendsFeed.status).toBe(200);
    expect(
      (friendsFeed.body as any[]).some((p) => p.id === postId),
    ).toBe(true);

    // --- 8. Comment on alice's post ---
    const comment = await request(http)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ content: 'Nice first post!' });
    expect(comment.status).toBe(201);
    expect(comment.body.content).toBe('Nice first post!');
    expect(ctx.store.comments).toHaveLength(1);

    const commentNotifs = ctx.store
      .notificationsFor(alice!.id)
      .filter((n) => n.type === NotificationType.COMMENT);
    expect(commentNotifs.length).toBe(1);
    expect(commentNotifs[0].data.userId).toBe(bob!.id);
    expect(commentNotifs[0].data.postId).toBe(postId);

    const listComments = await request(http).get(`/posts/${postId}/comments`);
    expect(listComments.status).toBe(200);
    expect(listComments.body).toHaveLength(1);

    // --- 9. React to the post ---
    const react = await request(http)
      .post(`/posts/${postId}/react`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ reaction: 'like' });
    expect(react.status).toBe(201);
    expect(react.body.reaction).toBe('like');
    expect(ctx.store.reactions).toHaveLength(1);

    const reactionNotifs = ctx.store
      .notificationsFor(alice!.id)
      .filter((n) => n.type === NotificationType.LIKE);
    expect(reactionNotifs.length).toBeGreaterThanOrEqual(1);
    expect(reactionNotifs[0].data.userId).toBe(bob!.id);

    // Toggle off (same reaction again removes)
    const unreact = await request(http)
      .post(`/posts/${postId}/react`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ reaction: 'like' });
    expect(unreact.status).toBe(201);
    expect(
      ctx.store.reactions.filter((r) => r.post.id === postId && r.user.id === bob!.id),
    ).toHaveLength(0);

    // Re-add for the rest of the journey
    await request(http)
      .post(`/posts/${postId}/react`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ reaction: 'heart' });
    expect(
      ctx.store.reactions.filter((r) => r.post.id === postId && r.user.id === bob!.id),
    ).toHaveLength(1);

    // --- 10. DM: bob → alice ---
    const conv = await request(http)
      .post('/dms/conversations')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ recipientIds: [alice!.id] });
    expect(conv.status).toBe(201);
    const conversationId = conv.body.id;
    expect(conversationId).toBeTruthy();
    expect(conv.body.isEncrypted).toBe(false); // honest: not E2EE yet

    const dm = await request(http)
      .post(`/dms/${conversationId}/messages`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ content: 'Hey Alice — saw your first post!' });
    expect(dm.status).toBe(201);
    expect(dm.body.content).toBe('Hey Alice — saw your first post!');

    // Alice sees the conversation + message
    const aliceConvs = await request(http)
      .get('/dms/conversations')
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(aliceConvs.status).toBe(200);
    expect(aliceConvs.body).toHaveLength(1);
    expect(aliceConvs.body[0].id).toBe(conversationId);
    expect(aliceConvs.body[0].lastMessage?.content).toContain('Hey Alice');

    const aliceMsgs = await request(http)
      .get(`/dms/${conversationId}/messages`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(aliceMsgs.status).toBe(200);
    expect(aliceMsgs.body).toHaveLength(1);
    expect(aliceMsgs.body[0].content).toBe('Hey Alice — saw your first post!');

    // DM notification for alice
    const dmNotifs = ctx.store
      .notificationsFor(alice!.id)
      .filter((n) => n.type === ('message' as any));
    expect(dmNotifs.length).toBe(1);
    expect(dmNotifs[0].data.from).toBe(bob!.id);

    // --- 11. Notify: alice reads notifications ---
    const notifs = await request(http)
      .get('/notifications')
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(notifs.status).toBe(200);
    expect(Array.isArray(notifs.body)).toBe(true);

    const types = notifs.body.map((n: any) => n.type);
    expect(types).toContain(NotificationType.FOLLOW);
    expect(types).toContain(NotificationType.COMMENT);
    expect(types).toContain(NotificationType.LIKE);
    expect(types).toContain('message');

    const unread = await request(http)
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(unread.status).toBe(200);
    expect(unread.body.count).toBeGreaterThanOrEqual(4);

    // Mark one read
    const firstNotifId = notifs.body[0].id;
    const markRead = await request(http)
      .patch(`/notifications/${firstNotifId}/read`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(markRead.status).toBe(200);
    expect(ctx.store.notifications.find((n) => n.id === firstNotifId)!.read).toBe(true);
  });

  it('rejects unauthenticated Core-loop writes with 401', async () => {
    const http = ctx.app.getHttpServer();

    const cases: { method: 'get' | 'post'; path: string; body?: object }[] = [
      { method: 'post', path: '/posts', body: { content: 'nope' } },
      { method: 'post', path: '/users/user-x/follow' },
      { method: 'post', path: '/posts/post-x/comments', body: { content: 'nope' } },
      { method: 'post', path: '/posts/post-x/react', body: { reaction: 'like' } },
      { method: 'post', path: '/dms/conversations', body: { recipientIds: ['user-x'] } },
      { method: 'get', path: '/notifications' },
      { method: 'get', path: '/users/me' },
    ];

    for (const { method, path, body } of cases) {
      const r = body !== undefined
        ? await (request(http) as any)[method](path).send(body)
        : await (request(http) as any)[method](path);
      expect({ method, path, status: r.status }).toEqual({
        method,
        path,
        status: 401,
      });
    }
  });

  it('returns 409 on duplicate signup and 400 on invalid signup body', async () => {
    const http = ctx.app.getHttpServer();

    await request(http)
      .post('/auth/signup')
      .send({
        username: 'dup',
        email: 'dup@example.com',
        password: 'Password123!',
        birthDate: '1990-01-01',
        captchaId: 'c',
        captchaAnswer: '1',
      })
      .expect(201);

    const again = await request(http)
      .post('/auth/signup')
      .send({
        username: 'dup2',
        email: 'dup@example.com',
        password: 'Password123!',
        birthDate: '1990-01-01',
        captchaId: 'c',
        captchaAnswer: '1',
      });
    expect(again.status).toBe(409);

    const invalid = await request(http)
      .post('/auth/signup')
      .send({ username: 'x', email: 'not-an-email', password: 'short' });
    expect(invalid.status).toBe(400);
  });

  it('404s when commenting or reacting to a missing post', async () => {
    const http = ctx.app.getHttpServer();

    ctx.store.addUser({ username: 'carol', email: 'carol@example.com', emailVerified: true });
    const carol = ctx.store.getUserByUsername('carol')!;
    const carolToken = ctx.tokenFor(carol.id);

    await request(http)
      .post('/posts/missing-post/comments')
      .set('Authorization', `Bearer ${carolToken}`)
      .send({ content: 'ghost' })
      .expect(404);

    await request(http)
      .post('/posts/missing-post/react')
      .set('Authorization', `Bearer ${carolToken}`)
      .send({ reaction: 'like' })
      .expect(404);
  });
});
