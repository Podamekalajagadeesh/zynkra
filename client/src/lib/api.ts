import axios from 'axios';
import { enqueueOfflineOperation } from './offlineSync';
import { AuthData, CrossRealityPort, Post, PostVisibility, RealityContext, FriendRequestPrivacy, StoryElement, UserProfile, EmailSearchPrivacy, CommentPrivacy, TagPrivacy, MessagePrivacy, MarketplaceListing, SavedListing } from './types';

export const updatePrivacy = async (privacy: { 
  postVisibility?: PostVisibility; 
  friendRequestPrivacy?: FriendRequestPrivacy;
  emailSearchPrivacy?: EmailSearchPrivacy;
  commentPrivacy?: CommentPrivacy;
  tagPrivacy?: TagPrivacy;
  messagePrivacy?: MessagePrivacy;
  profilePrivacy?: 'public' | 'private';
  screenshotProtection?: {
    enabled?: boolean;
    level?: string;
    applyToDms?: boolean;
    applyToPosts?: boolean;
    applyToStories?: boolean;
    applyToProfile?: boolean;
  };
}) => {
  // If it's just profilePrivacy, use the general user endpoint, otherwise use the privacy-specific endpoint
  const endpoint = privacy.profilePrivacy && Object.keys(privacy).length === 1 
    ? '/users/me' 
    : '/users/me/privacy';
  const response = await api.patch(endpoint, privacy);
  return response.data;
};

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Open Source Contribution Types
export enum ContributionStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MERGED = 'merged'
}

export enum ContributionType {
  FEATURE = 'feature',
  BUGFIX = 'bugfix',
  DOCUMENTATION = 'documentation',
  UI_IMPROVEMENT = 'ui_improvement',
  PERFORMANCE = 'performance',
  SECURITY = 'security'
}

export interface Contribution {
  id: string;
  title: string;
  description: string;
  type: ContributionType;
  status: ContributionStatus;
  affectedFiles?: string[];
  codeChanges?: string;
  pullRequestUrl?: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  reviewerId?: string;
  reviewer?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  reviewComments?: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
}

export interface CreateContributionDto {
  title: string;
  description: string;
  type: ContributionType;
  affectedFiles?: string[];
  codeChanges?: string;
  pullRequestUrl?: string;
}

export interface UpdateContributionDto {
  title?: string;
  description?: string;
  status?: ContributionStatus;
  reviewComments?: string;
}

export interface ContributionStats {
  total: number;
  pending: number;
  inReview: number;
  merged: number;
  byType: Array<{ type: string; count: number }>;
}

// Open Source API functions
const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const createContribution = async (data: CreateContributionDto): Promise<Contribution> => {
  const response = await axios.post(`${API_BASE_URL}/opensource/contributions`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getContributions = async (filters?: { status?: ContributionStatus; type?: ContributionType }): Promise<Contribution[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  
  const url = `${API_BASE_URL}/opensource/contributions${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await axios.get(url);
  return response.data;
};

export const getContributionStats = async (): Promise<ContributionStats> => {
  const response = await axios.get(`${API_BASE_URL}/opensource/contributions/stats`);
  return response.data;
};

export const getUserContributions = async (userId: string): Promise<Contribution[]> => {
  const response = await axios.get(`${API_BASE_URL}/opensource/contributions/user/${userId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getContribution = async (id: string): Promise<Contribution> => {
  const response = await axios.get(`${API_BASE_URL}/opensource/contributions/${id}`);
  return response.data;
};

export const updateContribution = async (id: string, data: UpdateContributionDto): Promise<Contribution> => {
  const response = await axios.put(`${API_BASE_URL}/opensource/contributions/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const assignReviewer = async (id: string, reviewerId: string): Promise<Contribution> => {
  const response = await axios.post(`${API_BASE_URL}/opensource/contributions/${id}/assign-reviewer`, { reviewerId }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteContribution = async (id: string): Promise<{ success: boolean }> => {
  await axios.delete(`${API_BASE_URL}/opensource/contributions/${id}`, {
    headers: getAuthHeaders(),
  });
  return { success: true };
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;

// Helper methods for api/notes.ts to import
export const get = api.get;
export const post = api.post;
export const del = api.delete;

export const getLocalFeed = async (radius?: number) => {
  const response = await api.get(`/feed/local${radius ? `?radius=${radius}` : ''}`);
  return response.data;
};

// Fitness segment API functions
export const getNearbyFitnessSegments = async (latitude: number, longitude: number, radius: number = 50) => {
  const response = await api.get(`/fitness/segments?lat=${latitude}&lng=${longitude}&radius=${radius}`);
  return response.data;
};

export const getSegmentLeaderboard = async (segmentId: string, radius?: number) => {
  const url = radius 
    ? `/fitness/segments/${segmentId}/leaderboard?radius=${radius}` 
    : `/fitness/segments/${segmentId}/leaderboard`;
  const response = await api.get(url);
  return response.data;
};

export const createSegmentAttempt = async (segmentId: string, duration: number, latitude?: number, longitude?: number) => {
  const response = await api.post(`/fitness/segments/${segmentId}/attempts`, { 
    duration,
    latitude,
    longitude
  });
  return response.data;
};

export const getUserSegmentPRs = async (userId?: string) => {
  const url = userId 
    ? `/fitness/users/${userId}/prs` 
    : '/fitness/users/me/prs';
  const response = await api.get(url);
  return response.data;
};

// Trending heatmap API functions for geographic trending topics
export const getTrendingHeatmapData = async (timeRange: string = '24h', region: string = 'world') => {
  const response = await api.get(`/trends/heatmap?timeRange=${timeRange}&region=${region}`);
  return response.data;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers) {
    delete config.headers.Authorization;
  }

  return config;
});

// Auto-refresh token on 401 responses
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints (signup, signin, refresh itself) to avoid loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/signin') ||
      originalRequest.url?.includes('/auth/signup') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/recover') ||
      originalRequest.url?.includes('/auth/verify-email');

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data: refreshData } = await api.post('/auth/refresh');
        const newToken = refreshData.access_token;
        setAuthToken(newToken);
        onRefreshed(newToken);
        refreshSubscribers = [];
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        setAuthToken(null);
        window.dispatchEvent(new Event('authchange'));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('access_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('access_token');
  }
};

// Set the initial token on page load
const token = localStorage.getItem('access_token');
setAuthToken(token);

// Avatars are stored as bare IPFS CIDs (e.g. "Qm…"). Resolve them through a public
// gateway so they render in <img>; leave full URLs untouched.
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const resolveAvatarUrl = (value?: string): string => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${IPFS_GATEWAY}${value}`;
};

const normalizeUserProfile = (data: any): UserProfile => {
  const rawAvatar = data?.pfp ?? data?.avatar ?? data?.profile?.avatarUrl ?? '';
  const avatarUrl = resolveAvatarUrl(rawAvatar);

  return {
    ...data,
    pfp: avatarUrl || undefined,
    profile: {
      ...(data?.profile ?? {}),
      avatarUrl,
    },
  };
};

export const signUp = async (data: AuthData) => {
  const response = await api.post('/auth/signup', data);
  return response.data;
};

export const logoutFromServer = async () => {
  const response = await api.post('/auth/signout');
  return response.data as { message: string };
};

export const login = async (data: AuthData) => {
  const response = await api.post('/auth/signin', data);
  return response.data;
};

export const refreshToken = async (): Promise<{ access_token: string }> => {
  const response = await api.post('/auth/refresh');
  return response.data;
};

export const resendVerification = async (data: { email: string }) => {
  const response = await api.post('/auth/resend-verification', data);
  return response.data as { message: string };
};

export const getAiNotificationDigest = async () => {
  const response = await api.get('/notifications/ai/digest');
  return response.data as {
    summary: string;
    criticalCount: number;
    unreadCount: number;
    topCategories: string[];
    highlights: Array<Record<string, unknown>>;
  };
};

export const getAiPrioritizedNotifications = async () => {
  const response = await api.get('/notifications/ai/prioritized');
  return response.data as {
    critical: Array<Record<string, unknown>>;
    high: Array<Record<string, unknown>>;
    medium: Array<Record<string, unknown>>;
    low: Array<Record<string, unknown>>;
    muted: Array<Record<string, unknown>>;
  };
};

export const analyzeSentimentText = async (text: string) => {
  const response = await api.post('/sentiment/analyze', { text });
  return response.data as {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
    emotions?: {
      joy?: number;
      sadness?: number;
      anger?: number;
      fear?: number;
      surprise?: number;
    };
  };
};

export const setup2FA = async () => {
  const response = await api.post('/auth/2fa/setup');
  return response.data;
};

export const enable2FA = async (data: { token: string }) => {
  const response = await api.post('/auth/2fa/enable', data);
  return response.data;
};

export const get2FAStatus = async () => {
  const response = await api.get('/auth/2fa/status');
  return response.data;
};

export const disable2FA = async (data: { token: string }) => {
  const response = await api.post('/auth/2fa/disable', data);
  return response.data;
};

export const verify2FA = async (data: { tempToken: string; token: string }) => {
  const response = await api.post('/auth/2fa/verify', data);
  return response.data;
};

export const linkWallet = async (data: {
  walletAddress: string;
  signMessage: (message: string) => Promise<string>;
}) => {
  // Prove wallet ownership: fetch a one-time challenge, sign it, submit signature.
  const challenge = await api.get('/wallet/connect/challenge', {
    params: { walletAddress: data.walletAddress },
  });
  const signature = await data.signMessage(challenge.data.message);
  const response = await api.post('/wallet/connect', {
    walletAddress: data.walletAddress,
    signature,
  });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/users/me');
  const profile = normalizeUserProfile(response.data);
  if (!profile.id) {
    profile.posts = [];
    profile.featuredPosts = [];
    return profile;
  }
  const postsResponse = await api.get(`/posts/users/${profile.id}/posts`);
  profile.posts = postsResponse.data;
  profile.featuredPosts = postsResponse.data.filter(
    (p: { isFeatured?: boolean }) => p.isFeatured,
  );
  return profile;
};

export const getUserProfile = async (
  userId: string,
  take = 10,
  skip = 0,
) => {
  const response = await api.get(`/users/${userId}`, {
    params: { take, skip },
  });
  const profile = normalizeUserProfile(response.data);
  const postsResponse = await api.get(`/posts/users/${userId}/posts`);
  profile.posts = postsResponse.data;
  profile.featuredPosts = postsResponse.data.filter(
    (p: { isFeatured?: boolean }) => p.isFeatured,
  );
  return profile;
};

export interface LoginSession {
  id: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  revokedAt: string | null;
  lastSeenAt: string | null;
  approvedAt: string | null;
  suspicious: boolean;
  createdAt: string;
  updatedAt: string;
  isCurrent?: boolean;
  isRevoked?: boolean;
  isApproved?: boolean;
}

export const generateRecoveryCodes = async () => {
  const response = await api.post('/auth/recovery-codes');
  return response.data as { codes: string[] };
};

export const recoverAccount = async (data: { identifier: string; recoveryCode: string }) => {
  const response = await api.post('/auth/recover', data);
  return response.data;
};

export const getLoginSessions = async () => {
  const response = await api.get('/auth/sessions');
  return response.data as LoginSession[];
};

export const revokeLoginSession = async (sessionId: string) => {
  const response = await api.post(`/auth/sessions/${sessionId}/revoke`);
  return response.data as { message: string };
};

export const revokeOtherSessions = async () => {
  const response = await api.post('/auth/sessions/revoke-all');
  return response.data as { message: string };
};

export const getPendingLoginSessions = async () => {
  const response = await api.get('/auth/sessions/pending');
  return response.data as LoginSession[];
};

export const approveLoginSession = async (sessionId: string) => {
  const response = await api.post(`/auth/sessions/${sessionId}/approve`);
  return response.data as { message: string };
};

// Brainwave authentication API functions
export const getBrainwaveDevices = async () => {
  const response = await api.get('/auth/brainwave/devices');
  return response.data as Array<{
    id: string;
    deviceModel: string;
    firmware: string;
    registeredAt: string;
    lastUsed: string;
    accuracy: number;
  }>;
};

export const registerBrainwaveDevice = async () => {
  const response = await api.post('/auth/brainwave/devices/register');
  return response.data as { message: string; deviceId: string };
};

export const removeBrainwaveDevice = async (deviceId: string) => {
  const response = await api.delete(`/auth/brainwave/devices/${deviceId}`);
  return response.data as { message: string };
};

export const getRecoveryOptions = async (identifier: string) => {
  const response = await api.get('/auth/recovery/options', { params: { identifier } });
  return response.data as {
    methods: {
      passwordReset: boolean;
      recoveryCodes: boolean;
      trustedContacts: string[];
    };
  };
};

export const getTrustedRecoveryContacts = async () => {
  const response = await api.get('/auth/recovery/trusted-contacts');
  return response.data as { contacts: string[] };
};

export const setTrustedRecoveryContacts = async (contacts: string[]) => {
  const response = await api.post('/auth/recovery/trusted-contacts', { contacts });
  return response.data as { contacts: string[]; message: string };
};

export const requestTrustedContactRecovery = async (data: { identifier: string; contactEmail: string }) => {
  const response = await api.post('/auth/recovery/contact/request', data);
  return response.data as { message: string };
};

export const verifyTrustedContactRecovery = async (data: { identifier: string; contactEmail: string; code: string }) => {
  const response = await api.post('/auth/recovery/contact/verify', data);
  return response.data as { access_token: string };
};

type CreatePostVisibility = 'public' | 'private' | 'unlisted';

type CreatePostPollInput = {
  question: string;
  options: string[];
};

type CreatePostPayload = {
  content: string;
  mediaFiles?: File[];
  visibility?: CreatePostVisibility;
  filter?: string;
  tokenGated?: boolean;
  contractAddress?: string;
  requiredTokenBalance?: string;
  taggedUserIds?: string[];
  poll?: CreatePostPollInput | null;
};

export const getCloseFriends = async (): Promise<UserProfile[]> => {
  const response = await api.get('/users/me/close-friends');
  return response.data.map(normalizeUserProfile);
};

export const updateCloseFriends = async (
  closeFriendIds: string[],
): Promise<UserProfile> => {
  const response = await api.put('/users/me/close-friends', {
    closeFriendIds,
  });
  return normalizeUserProfile(response.data);
};

export const snooze = async (
  snoozedId: string,
  snoozedType: 'user' | 'group' | 'page',
  snoozeEndDate: string,
) => {
  const response = await api.post('/snooze', {
    snoozedId,
    snoozedType,
    snoozeEndDate,
  });
  return response.data;
};

export const unsnooze = async (id: string) => {
  const response = await api.delete(`/snooze/${id}`);
  return response.data;
};

export const getSnoozed = async () => {
  const response = await api.get('/snooze');
  return response.data;
};

export const getMyFollowers = async (): Promise<UserProfile[]> => {
  const response = await api.get('/users/me/followers');
  return response.data.map(normalizeUserProfile);
};

export const getMyFollowing = async (): Promise<UserProfile[]> => {
  const response = await api.get('/users/me/following');
  return response.data.map(normalizeUserProfile);
};

const uploadPostMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.url as string;
};

const uploadMessageMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.url as string;
};

import { AutoTag } from '../lib/types';

export const createPost = async (
  content: string,
  media: { file: File, altText: string, captionsFile?: File }[] = [],
  visibility: CreatePostVisibility = 'public',
  filter = '',
  tokenGated = false,
  subscriptionGated = false,
  contractAddress = '',
  requiredTokenBalance = '',
  taggedUserIds: string[] = [],
  poll: CreatePostPollInput | null = null,
  location: { name: string; latitude: number; longitude: number } | null = null,
  showLikes = true,
  activity = '',
  stickers?: { url: string; x: number; y: number }[],
  productTags?: { product_id: string; x: number; y: number }[],
  eventTags?: { event_id: string; x: number; y: number }[],
  musicTags?: { music_id: string; x: number; y: number }[],
  reelEffectId?: string,
  isSensitive = false,
  requiresScreenshotProtection = false,
  autoTags?: AutoTag[], // AI-generated auto-tags for content categorization
  quotedPostId?: string,
) => {
  const mediaPayload = await Promise.all(
    media.map(async (mediaFile) => {
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read media file'));
        reader.readAsDataURL(mediaFile.file);
      });

      let captionsDataUrl: string | undefined;
      if (mediaFile.captionsFile) {
        const captionsFile = mediaFile.captionsFile;
        captionsDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read caption file'));
          reader.readAsDataURL(captionsFile);
        });
      }

      return {
        fileName: mediaFile.file.name,
        mimeType: mediaFile.file.type,
        dataUrl: fileDataUrl,
        altText: mediaFile.altText,
        captionsFileName: mediaFile.captionsFile?.name,
        captionsMimeType: mediaFile.captionsFile?.type,
        captionsDataUrl,
      };
    })
  );

  const payload = {
    content,
    media: mediaPayload,
    visibility,
    filter,
    tokenGated,
    subscriptionGated,
    contractAddress,
    requiredTokenBalance,
    taggedUsers: taggedUserIds,
    autoTags,
    isSensitive,
    enableScreenshotProtection: requiresScreenshotProtection,
    poll: poll
      ? {
          question: poll.question,
          options: poll.options.map((option) => ({ text: option })),
        }
      : undefined,
    locationName: location?.name,
    latitude: location?.latitude,
    longitude: location?.longitude,
    stickers,
    productTags,
    eventTags,
    musicTags,
    showLikes,
    activity,
    reelEffectId,
    quotedPostId,
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const queuedPost = await enqueueOfflineOperation({
      type: 'create-post',
      url: '/posts',
      method: 'POST',
      body: payload,
    });

    return {
      id: queuedPost.id,
      content,
      media: mediaPayload,
      pendingSync: true,
      queuedAt: queuedPost.createdAt,
    };
  }

  try {
    const response = await api.post('/posts', payload);
    return response.data;
  } catch (error) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const queuedPost = await enqueueOfflineOperation({
        type: 'create-post',
        url: '/posts',
        method: 'POST',
        body: payload,
      });

      return {
        id: queuedPost.id,
        content,
        media: mediaPayload,
        pendingSync: true,
        queuedAt: queuedPost.createdAt,
      };
    }

    throw error;
  }
};

export const searchUsersApi = async (query: string) => {
  const response = await api.get('/users/search', { params: { q: query } });
  return response.data;
};

// Alias for backward compatibility
export { searchUsersApi as searchUsers };


export const getPosts = async (take = 10, skip = 0) => {
  const response = await api.get('/feed/for-you', { params: { take, skip } });
  return response.data;
};

export const getForYouFeed = async (withBookmarks = false) => {
  const response = await api.get('/feed/for-you', { params: { withBookmarks } });
  return response.data;
};

export const getFavoritesFeed = async () => {
  const response = await api.get('/feed/favorites');
  return response.data;
};

export const getFriendsFeed = async () => {
  const response = await api.get('/feed/friends');
  return response.data;
};

export const getSubscriptionsFeed = async () => {
  const response = await api.get('/feed/subscriptions');
  return response.data;
};

export const getRecommendedFeed = async (limit = 20) => {
  const response = await api.get('/feed/recommended', { params: { limit } });
  return response.data;
};

export const getFeedView = async (view: 'for-you' | 'recommended' | 'friends' | 'subscriptions' | 'favorites' | 'chronological' | 'trending' = 'for-you', limit = 20) => {
  const response = await api.get('/feed', { params: { view, limit } });
  return response.data;
};

export const getShortsFeed = async () => {
  const response = await api.get('/feed/shorts');
  return response.data;
};

export const getPost = async (postId: string) => {
  const response = await api.get(`/posts/${postId}`);
  return response.data;
};

export const getReelEffects = async () => {
  const response = await api.get('/reels/effects');
  return response.data;
};

export const followUser = async (userId: string) => {
  const response = await api.post(`/users/${userId}/follow`, {}, { withCredentials: true });
  return response.data;
};

export const unfollowUser = async (userId: string) => {
  const response = await api.delete(`/users/${userId}/follow`, { withCredentials: true });
  return response.data;
};

export const removeFollower = async (userId: string) => {
  const response = await api.delete(`/users/followers/${userId}`, { withCredentials: true });
  return response.data;
};

export const addFavorite = async (userId: string) => {
  const response = await api.post(`/users/${userId}/favorite`, {}, { withCredentials: true });
  return response.data;
};

export const removeFavorite = async (userId: string) => {
  const response = await api.delete(`/users/${userId}/favorite`, { withCredentials: true });
  return response.data;
};

export const sendFollowRequest = async (userId: string) => {
  const response = await api.post(`/users/${userId}/follow-request`);
  return response.data;
};

export const cancelFollowRequest = async (userId: string) => {
  const response = await api.delete(`/users/follow-requests/user/${userId}`);
  return response.data;
};

export const getFollowRequests = async () => {
  const response = await api.get('/users/me/follow-requests/pending');
  return response.data;
};

export const acceptFollowRequest = async (requestId: string) => {
  const response = await api.post(`/users/follow-requests/${requestId}/accept`);
  return response.data;
};

export const denyFollowRequest = async (requestId: string) => {
  const response = await api.post(`/users/follow-requests/${requestId}/deny`);
  return response.data;
};

export const rejectFollowRequest = denyFollowRequest;

export const getFollowSuggestions = async () => {
  const response = await api.get('/users/suggestions');
  return response.data;
};

export const getFollowerSuggestions = async () => {
  const response = await api.get('/users/suggestions');
  return response.data;
};

export const getReelSuggestions = async () => {
  const response = await api.get('/reels/suggestions');
  return response.data;
};

export const getTrendingFeed = async (limit = 20) => {
  const response = await api.get('/feed/trending', { params: { limit } });
  return response.data;
};

export const getExploreFeed = async (category?: string) => {
  const queryString = category ? `?category=${encodeURIComponent(category)}` : '';
  const response = await api.get(`/feed/explore${queryString}`);
  return response.data;
};

export const getExploreCategories = async () => {
  const response = await api.get('/feed/explore/categories');
  return response.data;
};

export const getVisualDiscoveryFeed = async (category?: string, skip?: number) => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (skip) params.append('skip', skip.toString());
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`/feed/visual-discovery${queryString}`);
  return response.data;
};

export const getVisualCategories = async () => {
  const response = await api.get('/feed/visual-discovery/categories');
  return response.data;
};

export const reverseImageSearch = async (imageFile: File) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await api.post('/search/reverse-image', formData);
  return response.data;
};

export const getReelById = async (reelId: string) => {
  const response = await api.get(`/reels/${reelId}`);
  return response.data;
};

export const shareReel = async (postId: string) => {
  const response = await api.post(`/reels/${postId}/share`);
  return response.data;
};

export const trackReelView = async (postId: string) => {
  const response = await api.post(`/reels/${postId}/view`);
  return response.data;
};

export const getReelInsights = async (postId: string) => {
  const response = await api.get(`/reels/${postId}/insights`);
  return response.data;
};

export const getSessions = async () => {
  const response = await api.get('/sessions');
  return response.data;
};

export const revokeSession = async (sessionId: string) => {
  const response = await api.delete(`/sessions/${sessionId}`);
  return response.data;
};


export const getFollowers = async (userId: string) => {
  const response = await api.get(`/users/${userId}/followers`);
  return response.data;
};

export const getUserFollowing = async (userId: string) => {
  const response = await api.get(`/users/${userId}/following`);
  return response.data;
};

export const getReputation = async (userId: string) => {
  const response = await api.get(`/reputation/${userId}`);
  return response.data;
};

export const reportPost = async (postId: string, reason: string) => {
  const response = await api.post(`/posts/${postId}/report`, { reason });
  return response.data;
};

export const addReaction = async (messageId: string, reaction: string) => {
  const response = await api.post(`/dms/messages/${messageId}/reactions`, {
    reaction,
  });
  return response.data;
};

export const markMessageAsRead = async (messageId: string) => {
  const response = await api.post(`/dms/messages/${messageId}/read`);
  return response.data;
};

export const createConversation = async (
  recipientIds: string[],
  name?: string,
) => {
  const response = await api.post('/dms/conversations', { recipientIds, name });
  return response.data;
};

export const startConversation = async (userId: string) => {
  return createConversation([userId]);
};

export const uploadMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data as { url: string };
};

export const sendMessage = async (
  conversationId: string | undefined,
  channelId: string | undefined,
  content: string,
  replyToId?: string,
  media?: { url: string; type: 'image' | 'video' | 'audio' }[],
  voiceNote?: { durationSeconds: number; waveform: number[] },
  senderPublicKey?: string,
) => {
  if (conversationId) {
    const response = await api.post(`/dms/${conversationId}/messages`, {
      content,
      replyToId,
      media,
      voiceNote,
      senderPublicKey,
    });
    return response.data;
  }
  if (channelId) {
    const response = await api.post(`/groups/channels/${channelId}/messages`, {
      content,
      replyToId,
      media,
      voiceNote,
      senderPublicKey,
    });
    return response.data;
  }
};

export const getConversations = async () => {
  const response = await api.get('/dms/conversations');
  return response.data;
};

export const getMessages = async (
  conversationId?: string,
  channelId?: string,
) => {
  if (conversationId) {
    const response = await api.get(
      `/dms/conversations/${conversationId}/messages`,
    );
    return response.data;
  }
  if (channelId) {
    const response = await api.get(`/groups/channels/${channelId}/messages`);
    return response.data;
  }
};

export const getBadges = async () => {
  const response = await api.get('/monetization/badges');
  return response.data;
};

export const getGifts = async () => {
  const response = await api.get('/monetization/gifts');
  return response.data;
};

export const sendGift = async (recipientId: string, giftId: string, postId?: string, commentId?: string, message?: string) => {
  const response = await api.post('/monetization/gifts/send', { recipientId, giftId, postId, commentId, message });
  return response.data;
};

export const assignBadge = async (badgeId: string) => {
  const response = await api.post('/monetization/badges/assign', { badgeId });
  return response.data;
};

export const createGroup = async (
  name: string,
  privacy: 'public' | 'private' | 'secret',
  tokenGated?: boolean,
  contractAddress?: string,
  requiredTokenBalance?: string,
  allowAnonymousPosting?: boolean,
) => {
  const response = await api.post('/groups', {
    name,
    privacy,
    tokenGated,
    contractAddress,
    requiredTokenBalance,
    allowAnonymousPosting,
  });
  return response.data;
};

export const getGroups = async () => {
  const response = await api.get('/groups');
  return response.data;
};

export const getChannels = async (groupId: string) => {
  const response = await api.get(`/groups/${groupId}/channels`);
  return response.data;
};

export const getGroupMembers = async (groupId: string) => {
  const response = await api.get(`/groups/${groupId}/members`);
  return response.data;
};

export const updateMemberRole = async (
  groupId: string,
  userId: string,
  role: string,
) => {
  const response = await api.put(`/groups/${groupId}/members/${userId}`, {
    role,
  });
  return response.data;
};

// Modmail (shared moderation inbox) API functions
export const getModMailConversations = async (groupId: string) => {
  const response = await api.get(`/groups/${groupId}/modmail`);
  return response.data;
};

export const createModMailConversation = async (
  groupId: string,
  data: {
    subject: string;
    recipientId: string;
    initialMessage: string;
  }
) => {
  const response = await api.post(`/groups/${groupId}/modmail`, data);
  return response.data;
};

export const getModMailMessages = async (groupId: string, conversationId: string) => {
  const response = await api.get(`/groups/${groupId}/modmail/${conversationId}/messages`);
  return response.data;
};

export const sendModMailMessage = async (
  groupId: string,
  conversationId: string,
  content: string,
  isInternal = false
) => {
  const response = await api.post(`/groups/${groupId}/modmail/${conversationId}/messages`, {
    content,
    isInternal
  });
  return response.data;
};

export const addPostReaction = async (postId: string, reaction: string) => {
  const response = await api.post(`/posts/${postId}/react`, { reaction });
  return response.data;
};

export const createComment = async (
  postId: string,
  content: string,
  parentId?: string,
) => {
  const response = await api.post(`/posts/${postId}/comments`, {
    content,
    parentId,
  });
  return response.data;
};

export const deleteComment = async (postId: string, commentId: string) => {
  const response = await api.delete(`/posts/${postId}/comments/${commentId}`);
  return response.data;
};

export const pinComment = async (postId: string, commentId: string) => {
  const response = await api.patch(`/posts/${postId}/comments/${commentId}/pin`);
  return response.data;
};

export const lockComment = async (postId: string, commentId: string) => {
  const response = await api.patch(`/posts/${postId}/comments/${commentId}/lock`);
  return response.data;
};

export const getComments = async (postId: string) => {
  const response = await api.get(`/posts/${postId}/comments`);
  return response.data;
};

export const updatePost = async (postId: string, content: string) => {
  const response = await api.patch(`/posts/${postId}`, { content });
  return response.data;
};

export const deletePost = async (postId: string) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};

export const togglePinPost = async (postId: string) => {
  const response = await api.patch(`/posts/${postId}/pin`);
  return response.data;
};

export const featurePost = async (postId: string) => {
  const response = await api.post(`/posts/${postId}/feature`);
  return response.data;
};

export const unfeaturePost = async (postId: string) => {
  const response = await api.delete(`/posts/${postId}/feature`);
  return response.data;
};

export const getReports = async () => {
  const response = await api.get('/admin/reports');
  return response.data;
};

export const deletePostAsAdmin = async (postId: string) => {
  const response = await api.delete(`/admin/posts/${postId}`);
  return response.data;
};

export const dismissReport = async (reportId: string) => {
  const response = await api.delete(`/admin/reports/${reportId}`);
  return response.data;
};

export const banUser = async (userId: string) => {
  const response = await api.post(`/admin/users/${userId}/ban`);
  return response.data;
};

export const createEvent = async (eventData: {
  title: string;
  description: string;
  date: string;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  ticketPrice?: number;
  maxAttendees?: number;
  coHostIds?: string[];
}) => {
  const response = await api.post('/events', eventData);
  return response.data;
};

export const getEvents = async () => {
  const response = await api.get('/events');
  return response.data;
};

export const getEvent = async (eventId: string) => {
  const response = await api.get(`/events/${eventId}`);
  return response.data;
};

export const attendEvent = async (eventId: string, paymentId?: string) => {
  const response = await api.post(`/events/${eventId}/attend`, { paymentId });
  return response.data;
};

export const unattendEvent = async (eventId: string) => {
  const response = await api.post(`/events/${eventId}/unattend`);
  return response.data;
};

export const getEventAnalytics = async (eventId: string) => {
  const response = await api.get(`/events/${eventId}/analytics`);
  return response.data;
};

export const sendEventReminders = async (eventId: string) => {
  const response = await api.post(`/events/${eventId}/send-reminders`);
  return response.data;
};

export const createReplay = async (replayData: {
  title: string;
  videoUrl: string;
}) => {
  const response = await api.post('/livestream-replays', replayData);
  return response.data;
};

export const getReplays = async (userId: string) => {
  const response = await api.get(`/livestream-replays/user/${userId}`);
  return response.data;
};

export const uploadPublicKey = async (publicKey: string) => {
  const response = await api.post('/keys/upload', { publicKey });
  return response.data;
};

export const getPublicKey = async (userId: string) => {
  const response = await api.get(`/keys/${userId}`);
  return response.data;
};

export const updatePage = async (pageId: string, pageData: { automatedResponseEnabled?: boolean; automatedResponseMessage?: string; }) => {
  const response = await api.patch(`/pages/${pageId}`, pageData);
  return response.data;
};

export const createSponsoredPost = async (postId: string, budget: number) => {
  const response = await api.post(`/posts/${postId}/sponsor`, { budget });
  return response.data;
};

export const getPageConversations = async (pageId: string) => {
  const response = await api.get(`/pages/${pageId}/inbox`);
  return response.data;
};

export const getPageConversation = async (
  pageId: string,
  conversationId: string,
) => {
  const response = await api.get(
    `/pages/${pageId}/inbox/${conversationId}`,
  );
  return response.data;
};

export const createPageMessage = async (
  pageId: string,
  conversationId: string,
  content: string,
) => {
  const response = await api.post(
    `/pages/${pageId}/inbox/${conversationId}/messages`,
    { content },
  );
  return response.data;
};

export const createPage = async (pageData: { name: string; description: string; }) => {
  const response = await api.post('/pages', pageData);
  return response.data;
};

export const getPage = async (pageId: string) => {
  const response = await api.get(`/pages/${pageId}`);
  return response.data;
};

export const sendMessageToPage = async (pageId: string, content: string) => {
  const response = await api.post(`/pages/${pageId}/message`, { content });
  return response.data;
};

export const createScheduledStream = async (data: { title: string; description: string; scheduledTime: Date }) => {
  const response = await api.post('/livestream/schedule', data);
  return response.data;
};


export const resetPassword = async (data: { token: string; password: string }) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

export const forgotPassword = async (data: { email: string }) => {
  const response = await api.post('/auth/forgot-password', data);
  return response.data;
};

export const getPasskeys = async () => {
  const response = await api.get('/auth/webauthn/passkeys');
  return response.data;
};

export const getStories = async () => {
  const response = await api.get('/stories');
  return response.data;
};

export const deletePasskey = async (id: string) => {
  const response = await api.delete(`/auth/webauthn/passkeys/${id}`);
  return response.data;
};

export const createStory = async (file: File, elements?: StoryElement[], audience?: string, isBoosted?: boolean, isExtendedDuration?: boolean) => {
  const formData = new FormData();
  formData.append('file', file);
  if (elements) {
    formData.append('elements', JSON.stringify(elements));
  }
  if (audience) {
    formData.append('audience', audience);
  }
  if (isBoosted) {
    formData.append('isBoosted', 'true');
  }
  if (isExtendedDuration) {
    formData.append('isExtendedDuration', 'true');
  }

  const response = await api.post('/stories', formData);

  return response.data;
};

export const addStoryReaction = async (storyId: string, reaction: string) => {
  const response = await api.post(`/stories/${storyId}/react`, { reaction });
  return response.data;
};

export const addStoryReply = async (storyId: string, text: string) => {
  const response = await api.post(`/stories/${storyId}/reply`, { text });
  return response.data;
};

export const trackStoryView = async (storyId: string, isAnonymous: boolean = false) => {
  const response = await api.post(`/stories/${storyId}/view`, { isAnonymous });
  return response.data;
};

export const getStoryViews = async (storyId: string) => {
  const response = await api.get(`/stories/${storyId}/views`);
  return response.data;
};

export const getNfts = async (walletAddress: string) => {
  const response = await api.get(`/wallet/nfts/${walletAddress}`);
  return response.data;
};

export const updateProfile = async (formData: FormData) => {
  const response = await api.patch('/users/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return normalizeUserProfile(response.data);
};

export const setNftPfp = async (data: {
  nftPfpUrl: string;
  nftPfpContractAddress: string;
  nftPfpTokenId: string;
}) => {
  const response = await api.post('/wallet/set-nft-pfp', data);
  return response.data;
};

export const sendTip = async (data: {
  fromAddress: string;
  toAddress: string;
  amount: number;
  txHash: string;
  postId: string;
}) => {
  const response = await api.post('/tipping', data);
  return response.data;
};

export const getAnalytics = async () => {
  const response = await api.get('/analytics');
  return response.data;
};

// Competitor analytics types
export type CompetitorProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isAdded: boolean;
  category: string;
};

export type CompetitorAnalytics = {
  profile: CompetitorProfile;
  followerCount: number;
  followerGrowth: number;
  followerGrowthRate: string;
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
  averageShares: number;
  postFrequency: number; // posts per week
  topPostTypes: string[];
};

export type CompetitorComparisonData = {
  yourMetrics: {
    followerCount: number;
    followerGrowth: number;
    engagementRate: number;
    averageLikes: number;
    averageComments: number;
    averageShares: number;
    postFrequency: number;
  };
  competitors: CompetitorAnalytics[];
  industryAverages: {
    followerGrowth: string;
    engagementRate: number;
    averageLikes: number;
    averageComments: number;
    postFrequency: number;
  };
};

// Competitor analytics API functions
export const addCompetitor = async (username: string): Promise<CompetitorProfile> => {
  const response = await api.post('/analytics/competitors', { username });
  return response.data;
};

export const removeCompetitor = async (competitorId: string): Promise<void> => {
  await api.delete(`/analytics/competitors/${competitorId}`);
};

export const getCompetitors = async (): Promise<CompetitorProfile[]> => {
  const response = await api.get('/analytics/competitors');
  return response.data;
};

export const getCompetitorComparison = async (): Promise<CompetitorComparisonData> => {
  const response = await api.get('/analytics/competitors/comparison');
  return response.data;
};

// searchUsers is already exported as an alias for searchUsersApi above (line 733)

// Cross-platform publishing types
export type SocialPlatform = 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok';

export type ConnectedAccount = {
  id: string;
  platform: SocialPlatform;
  platformUsername: string;
  platformUserId: string;
  isActive: boolean;
  connectedAt: string;
};

export type ConnectAccountRequest = {
  platform: SocialPlatform;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
};

// Scheduled posts types
export type ScheduledPost = {
  id: string;
  content: string;
  mediaUrl?: string;
  postType: string;
  scheduledFor: string;
  isOptimalTime: boolean;
  status: 'scheduled' | 'published' | 'failed';
  createdAt: string;
  visibility?: string;
  crossPlatformIds?: string[]; // IDs of connected accounts to publish to
  crossPlatformStatus?: Record<string, 'pending' | 'published' | 'failed'>; // Status per platform
};

export type CreateMemoryRequest = {
  content: string;
  visibility?: PostVisibility;
  memoryMetadata?: Post['memoryMetadata'];
  isMemory?: boolean;
  realityContext?: RealityContext;
  timeCapsuleUnlockAt?: string;
  timeCapsuleRecipients?: string[];
  timeCapsuleMessage?: string;
};

export type PortMemoryRequest = {
  targetReality: RealityContext;
  sourceReality?: RealityContext;
  contextNote?: string;
  fidelity?: string;
};

export type SchedulePostRequest = {
  content: string;
  mediaUrl?: string;
  postType: string;
  scheduledFor?: string; // If not provided, will use optimal time
  isOptimalTime?: boolean;
  visibility?: string;
  crossPlatformIds?: string[]; // IDs of connected accounts to publish to
};

// Cross-platform publishing API functions
export const getConnectedAccounts = async (): Promise<ConnectedAccount[]> => {
  const response = await api.get('/connected-accounts');
  return response.data;
};

export const connectAccount = async (account: ConnectAccountRequest): Promise<ConnectedAccount> => {
  const response = await api.post('/connected-accounts', account);
  return response.data;
};

export const disconnectAccount = async (accountId: string): Promise<void> => {
  await api.delete(`/connected-accounts/${accountId}`);
};

export const setConnectedAccountActive = async (accountId: string, isActive: boolean): Promise<ConnectedAccount> => {
  const response = await api.patch(`/connected-accounts/${accountId}`, { isActive });
  return response.data;
};

// Scheduling API functions
export const getOptimalPostingTime = async (): Promise<{ recommendedHour: number; confidence: number }> => {
  const response = await api.get('/analytics/optimal-time');
  return response.data;
};

export const getScheduledPosts = async (): Promise<ScheduledPost[]> => {
  const response = await api.get('/scheduled-posts');
  return response.data;
};

export const schedulePost = async (post: SchedulePostRequest): Promise<ScheduledPost> => {
  const response = await api.post('/scheduled-posts', post);
  return response.data;
};

export const cancelScheduledPost = async (postId: string): Promise<void> => {
  await api.delete(`/scheduled-posts/${postId}`);
};

export const updateScheduledPost = async (postId: string, updates: Partial<SchedulePostRequest>): Promise<ScheduledPost> => {
  const response = await api.patch(`/scheduled-posts/${postId}`, updates);
  return response.data;
};

export const createMemory = async (data: CreateMemoryRequest): Promise<Post> => {
  const response = await api.post('/memories/create', data);
  return response.data;
};

export const getTimeCapsuleMemories = async (): Promise<Post[]> => {
  const response = await api.get('/memories/capsules');
  return response.data;
};

export const portMemory = async (memoryId: string, data: PortMemoryRequest): Promise<Post> => {
  const response = await api.post(`/memories/${memoryId}/port`, data);
  return response.data;
};

export const getMemoryPorts = async (memoryId: string): Promise<CrossRealityPort[]> => {
  const response = await api.get(`/memories/${memoryId}/ports`);
  return response.data;
};

export const createMemoryDocumentary = async (data: {
  eventName: string;
  title?: string;
  memoryIds?: string[];
  participantNames?: string[];
}) => {
  const response = await api.post('/memories/documentaries', data);
  return response.data;
};

export const createMemoryProject = async (data: {
  title: string;
  topic?: string;
  description?: string;
  memoryIds?: string[];
  contributorNames?: string[];
}) => {
  const response = await api.post('/memories/projects', data);
  return response.data;
};

export const getMemoryProjects = async () => {
  const response = await api.get('/memories/projects');
  return response.data;
};

export const getInstantForms = async () => {
  const response = await api.get('/instant-forms');
  return response.data;
};

export const createInstantForm = async (data: any) => {
  const response = await api.post('/instant-forms', data);
  return response.data;
};

export const updateInstantForm = async (id: string, data: any) => {
  const response = await api.patch(`/instant-forms/${id}`, data);
  return response.data;
};

export const deleteInstantForm = async (id: string) => {
  const response = await api.delete(`/instant-forms/${id}`);
  return response.data;
};

export const createLead = async (adId: string, data: any) => {
  const response = await api.post(`/ads/${adId}/leads`, data);
  return response.data;
};

export const getLeads = async (instantFormId: string) => {
  const response = await api.get(`/instant-forms/${instantFormId}/leads`);
  return response.data;
};

export const getCampaigns = async () => {
  const response = await api.get('/ads/campaigns');
  return response.data;
};

export const createCampaign = async (data: { name: string; objective: string }) => {
  const response = await api.post('/ads/campaigns', data);
  return response.data;
};

export const getCampaign = async (campaignId: string) => {
  const response = await api.get(`/ads/campaigns/${campaignId}`);
  return response.data;
};

export const getAdSets = async (campaignId: string) => {
  const response = await api.get(`/ads/campaigns/${campaignId}/adsets`);
  return response.data;
};

export const createAdSet = async (campaignId: string, data: { name: string; dailyBudget: number; targeting: any }) => {
  const response = await api.post(`/ads/campaigns/${campaignId}/adsets`, data);
  return response.data;
};

export const getAdSet = async (adSetId: string) => {
  const response = await api.get(`/ads/adsets/${adSetId}`);
  return response.data;
};

export const getAds = async (adSetId: string) => {
  const response = await api.get(`/ads/adsets/${adSetId}/ads`);
  return response.data;
};

export const createAd = async (adSetId: string, data: { name: string; creative: { postId: string } }) => {
  const response = await api.post(`/ads/adsets/${adSetId}/ads`, data);
  return response.data;
};

export const getMarketplaceListings = async (query?: string): Promise<MarketplaceListing[]> => {
  const params = query ? { params: { q: query } } : {};
  const response = await api.get('/marketplace/listings', params);
  return response.data;
};

export const createMarketplaceListing = async (listingData: { title: string; description: string; price: number; location: string; imageUrls: string[] }) => {
  const response = await api.post('/marketplace/listings', listingData);
  return response.data;
};

export const getMarketplaceListing = async (id: string): Promise<MarketplaceListing> => {
  const response = await api.get(`/marketplace/listings/${id}`);
  return response.data;
};

export const updateMarketplaceListing = async (id: string, listingData: { title: string; description: string; price: number; location: string; imageUrls: string[] }) => {
  const response = await api.patch(`/marketplace/listings/${id}`, listingData);
  return response.data;
};

export const deleteMarketplaceListing = async (id: string) => {
  const response = await api.delete(`/marketplace/listings/${id}`);
  return response.data;
};

export const getSavedMarketplaceListings = async (): Promise<SavedListing[]> => {
  const response = await api.get('/saved-marketplace-listings');
  return response.data;
};

export const saveMarketplaceListing = async (listingId: string) => {
  const response = await api.post('/saved-marketplace-listings', { listingId });
  return response.data;
};

export const unsaveMarketplaceListing = async (listingId: string) => {
  const response = await api.delete(`/saved-marketplace-listings/${listingId}`);
  return response.data;
};

export const deletePage = async (pageId: string) => {
  const response = await api.delete(`/pages/${pageId}`);
  return response.data;
};



export const createSubscription = async (creatorId: string, tier: string) => {
  const response = await api.post('/subscriptions', { creatorId, tier });
  return response.data;
};

export const getSubscriptions = async () => {
  const response = await api.get('/subscriptions');
  return response.data;
};

export const getSubscription = async (subscriptionId: string) => {
  const response = await api.get(`/subscriptions/${subscriptionId}`);
  return response.data;
};

export const cancelSubscription = async (subscriptionId: string) => {
  const response = await api.delete(`/subscriptions/${subscriptionId}`);
  return response.data;
};

export const getSubscribers = async () => {
  const response = await api.get('/subscriptions/subscribers');
  return response.data;
};

export const createSubscriptionTier = async (name: string, price: number) => {
  const response = await api.post('/subscriptions/tiers', { name, price });
  return response.data;
};

export const getCreatorSubscriptionTiers = async (creatorId: string) => {
  const response = await api.get(`/subscriptions/tiers/creator/${creatorId}`);
  return response.data;
};

export const updateSubscriptionTier = async (tierId: string, updates: { name?: string; price?: number }) => {
  const response = await api.patch(`/subscriptions/tiers/${tierId}`, updates);
  return response.data;
};

export const deleteSubscriptionTier = async (tierId: string) => {
  const response = await api.delete(`/subscriptions/tiers/${tierId}`);
  return response.data;
};

export const search = async (query: string) => {
  const response = await api.get('/search', { params: { q: query } });
  return response.data;
};

export const blockUser = async (userId: string) => {
  const response = await api.post(`/users/${userId}/block`);
  return response.data;
};

export const unblockUser = async (userId: string) => {
  const response = await api.delete(`/users/${userId}/block`);
  return response.data;
};

export const createLifeEvent = async (data: { title: string; description?: string; date: string; type: string }) => {
  const response = await api.post('/users/me/life-events', data);
  return response.data;
};

export const updateLifeEvent = async (id: string, data: { title?: string; description?: string; date?: string; type?: string }) => {
  const response = await api.patch(`/users/me/life-events/${id}`, data);
  return response.data;
};

export const deleteLifeEvent = async (id: string) => {
  const response = await api.delete(`/users/me/life-events/${id}`);
  return response.data;
};

export const forwardMessage = async (
  messageId: string,
  conversationId?: string,
  channelId?: string,
) => {
  const response = await api.post(`/dms/messages/${messageId}/forward`, {
    conversationId,
    channelId,
  });
  return response.data;
};

export const getBlockedUsers = async () => {
  const response = await api.get('/users/blocked');
  return response.data;
};

export const followHashtag = async (hashtagName: string) => {
  const response = await api.post('/users/me/hashtags/follow', { name: hashtagName });
  return response.data;
};

export const unfollowHashtag = async (hashtagName: string) => {
  const response = await api.delete(`/users/me/hashtags/follow/${encodeURIComponent(hashtagName)}`);
  return response.data;
};

export const blockKeyword = async (keyword: string) => {
  const response = await api.post('/users/me/keywords/block', { keyword });
  return response.data;
};

export const unblockKeyword = async (keyword: string) => {
  const response = await api.delete(`/users/me/keywords/block/${encodeURIComponent(keyword)}`);
  return response.data;
};

export const blockHashtag = async (hashtagName: string) => {
  const response = await api.post('/users/me/hashtags/block', { name: hashtagName });
  return response.data;
};

export const unblockHashtag = async (hashtagName: string) => {
  const response = await api.delete(`/users/me/hashtags/block/${encodeURIComponent(hashtagName)}`);
  return response.data;
};

export const setVanishMode = async (conversationId: string, vanishMode: boolean) => {
  const response = await api.patch(`/dms/conversations/${conversationId}/vanish-mode`, {
    vanishMode,
  });
  return response.data;
};

export const setMessageTtl = async (
  conversationId: string,
  messageTtlSeconds: number | null,
) => {
  const response = await api.patch(`/dms/conversations/${conversationId}/message-ttl`, {
    messageTtlSeconds,
  });
  return response.data;
};

export const updateMessage = async (messageId: string, content: string) => {
  const response = await api.patch(`/dms/messages/${messageId}`, { content });
  return response.data;
};

export const deleteMessage = async (messageId: string) => {
  const response = await api.delete(`/dms/messages/${messageId}`);
  return response.data;
};

export const getBookmarks = async () => {
  const response = await api.get('/bookmarks');
  return response.data;
};

// Notes API functions
export const createNote = async (content: string) => {
  const response = await api.post('/notes', { content });
  return response.data;
};

export const getFollowingNotes = async () => {
  const response = await api.get('/notes/following');
  return response.data;
};

export const getUserNote = async (userId: string) => {
  const response = await api.get(`/notes/user/${userId}`);
  return response.data;
};

export const deleteNote = async (noteId: string) => {
  const response = await api.delete(`/notes/${noteId}`);
  return response.data;
};

export const getNotesForPost = async (postId: string) => {
  const response = await api.get(`/notes/post/${postId}`);
  return response.data;
};

export const createCommunityNote = async (content: string, postId: string) => {
  const response = await api.post('/notes', { content, postId });
  return response.data;
};

export const voteNoteHelpfulness = async (noteId: string, isUpvote: boolean) => {
  const response = await api.post(`/notes/${noteId}/vote`, { isUpvote });
  return response.data;
};

// ---- Threads (multi-message topic branching) ----
export const createThread = async (input: { title?: string; content?: string }) => {
  const response = await api.post('/threads', input);
  return response.data;
};

export const getThreads = async () => {
  const response = await api.get('/threads');
  return response.data;
};

export const getThread = async (threadId: string) => {
  const response = await api.get(`/threads/${threadId}`);
  return response.data;
};

export const sendThreadMessage = async (
  threadId: string,
  input: { content: string; parentMessageId?: string | null },
) => {
  const response = await api.post(`/threads/${threadId}/messages`, input);
  return response.data;
};

export const deleteThread = async (threadId: string) => {
  const response = await api.delete(`/threads/${threadId}`);
  return response.data;
};

export const deleteThreadMessage = async (threadId: string, messageId: string) => {
  const response = await api.delete(`/threads/${threadId}/messages/${messageId}`);
  return response.data;
};

// ---- Link previews (OG-card unfurl) ----
export const getLinkPreview = async (url: string) => {
  const response = await api.get('/link-previews', { params: { url } });
  return response.data;
};

// ---- Post drafts ----
export const createDraft = async (input: { content: string; postType?: string; visibility?: string }) => {
  const response = await api.post('/posts/drafts', input);
  return response.data;
};

export const getDrafts = async () => {
  const response = await api.get('/posts/drafts');
  return response.data;
};

export const getDraft = async (id: string) => {
  const response = await api.get(`/posts/drafts/${id}`);
  return response.data;
};

export const updateDraft = async (id: string, input: { content: string; postType?: string; visibility?: string }) => {
  const response = await api.patch(`/posts/drafts/${id}`, input);
  return response.data;
};

export const publishDraft = async (id: string) => {
  const response = await api.post(`/posts/drafts/${id}/publish`);
  return response.data;
};

export const deleteDraft = async (id: string) => {
  const response = await api.delete(`/posts/drafts/${id}`);
  return response.data;
};

export const setPostCollaborators = async (postId: string, userIds: string[]) => {
  const response = await api.put(`/posts/${postId}/collaborators`, { userIds });
  return response.data;
};

export const searchGifs = async (query: string, limit = 24) => {
  const response = await api.get('/gifs/search', { params: { q: query, limit } });
  return response.data;
};

export const getPostAnalytics = async (postId: string) => {
  const response = await api.get(`/posts/${postId}/analytics`);
  return response.data;
};

export const getSimilarPosts = async (postId: string, limit = 6) => {
  const response = await api.get(`/posts/${postId}/similar`, { params: { limit } });
  return response.data;
};

export const createCollection = async (name: string) => {
  const response = await api.post('/collections', { name });
  return response.data;
};

export const getCollections = async () => {
  const response = await api.get('/collections');
  return response.data;
};

export const getCollection = async (id: string) => {
  const response = await api.get(`/collections/${id}`);
  return response.data;
};

export const updateCollection = async (id: string, name: string) => {
  const response = await api.patch(`/collections/${id}`, { name });
  return response.data;
};

export const deleteCollection = async (id: string) => {
  const response = await api.delete(`/collections/${id}`);
  return response.data;
};

export const addBookmarkToCollection = async (
  postId: string,
  collectionId: string,
) => {
  const response = await api.post('/bookmarks', { postId, collectionId });
  return response.data;
};

export const removeBookmarkFromCollection = async (bookmarkId: string) => {
  const response = await api.delete(`/bookmarks/${bookmarkId}`);
  return response.data;
};

export const addBookmark = async (postId: string, collectionId: string | null) => {
  const response = await api.post('/bookmarks', { postId, collectionId });
  return response.data;
};

export const removeBookmark = async (postId: string) => {
  const response = await api.delete(`/bookmarks/${postId}`);
  return response.data;
};

// Watch later and Read it later list functions
export const addToWatchLater = async (postId: string) => {
  const response = await api.post('/watch-later', { postId });
  return response.data;
};

export const removeFromWatchLater = async (postId: string) => {
  const response = await api.delete(`/watch-later/${postId}`);
  return response.data;
};

export const getWatchLaterList = async () => {
  const response = await api.get('/watch-later');
  return response.data;
};

export const addToReadLater = async (postId: string) => {
  const response = await api.post('/read-later', { postId });
  return response.data;
};

export const removeFromReadLater = async (postId: string) => {
  const response = await api.delete(`/read-later/${postId}`);
  return response.data;
};

export const getReadLaterList = async () => {
  const response = await api.get('/read-later');
  return response.data;
};

export const repost = async (postId: string) => {
  const response = await api.post(`/posts/${postId}/repost`);
  return response.data;
};

export const undoRepost = async (postId: string) => {
  const response = await api.post(`/posts/${postId}/undo-repost`);
  return response.data;
};

/** Quote post: new post with own content embedding another post. */
export const quotePost = async (quotedPostId: string, content: string) => {
  const response = await api.post('/posts', { content, quotedPostId, visibility: 'public' });
  return response.data;
};

export const voteOnPoll = async (pollOptionId: string) => {
  const response = await api.post(`/polls/${pollOptionId}/vote`);
  return response.data;
};

export const getPostsByHashtag = async (name: string) => {
  const response = await api.get(`/hashtags/${name}/posts`);
  return response.data;
};

export const getMutualFollows = async (userId: string) => {
  const response = await api.get(`/users/${userId}/mutual`);
  return response.data;
};



export const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/uploads/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
// ---- Earnings: wallet balance, ledger, payouts & Stripe Connect --------------

export interface WalletBalance {
  walletBalance: number;
}

export type LedgerEntryType =
  | 'earning'
  | 'payout'
  | 'payout_reversal'
  | 'adjustment';

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amount: number;
  balanceAfter: number;
  currency: string;
  reference: string | null;
  purpose: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export type PayoutStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'rejected'
  | 'failed';

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  purpose: string | null;
  payoutId: string | null;
  failureReason: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface ConnectStatus {
  enabled: boolean;
  mode: 'manual' | 'stripe';
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  hasAccount?: boolean;
}

export interface PayoutResult {
  success: boolean;
  status: PayoutStatus;
  amount: number;
  currency: string;
  payoutId: string | null;
  failureReason?: string | null;
  mode?: 'manual' | 'stripe';
}

export const getWalletBalance = async (): Promise<WalletBalance> => {
  const response = await api.get('/wallet/balance');
  return response.data;
};

export const getWalletLedger = async (limit = 100): Promise<LedgerEntry[]> => {
  const response = await api.get(`/wallet/ledger?limit=${limit}`);
  return response.data;
};

export const getConnectStatus = async (): Promise<ConnectStatus> => {
  const response = await api.get('/payments/connect/status');
  return response.data;
};

/** Returns a Stripe-hosted onboarding URL the caller should redirect to. */
export const createConnectOnboarding = async (): Promise<{ url: string }> => {
  const response = await api.post('/payments/connect/onboard');
  return response.data;
};

export const getMyPayouts = async (): Promise<Payout[]> => {
  const response = await api.get('/payments/payouts');
  return response.data;
};

export const requestPayout = async (
  amount: number,
  purpose = 'creator-payout',
): Promise<PayoutResult> => {
  const response = await api.post('/payments/payouts/request', { amount, purpose });
  return response.data;
};

// ---- Crypto Payouts --------------------------------------------------------

export type CryptoChain = {
  chainId: number;
  name: string;
  usdcAddress: string;
};

export interface CryptoPayoutResult {
  success: boolean;
  txHash: string | null;
  amount: number;
  currency: string;
  recipientAddress: string;
  status: string;
}

export const getCryptoPayoutChains = async (): Promise<{
  enabled: boolean;
  chains: CryptoChain[];
}> => {
  const response = await api.get('/wallet/crypto/chains');
  return response.data;
};

export const requestCryptoPayout = async (
  amount: number,
  chainId = 8453,
): Promise<CryptoPayoutResult> => {
  const response = await api.post('/wallet/crypto/payout', { amount, chainId });
  return response.data;
};

// ---- Creator Analytics -----------------------------------------------------

export interface CreatorDashboardData {
  overview: {
    totalPosts: number;
    totalArticles: number;
    totalViews: number;
    totalSubscribers: number;
    newslettersSent: number;
    totalPlays: number;
    coursesCreated: number;
    totalEnrollments: number;
  };
  topContent: {
    posts: any[];
    articles: any[];
    podcasts: any[];
  };
}

export const getCreatorDashboard = async (): Promise<CreatorDashboardData> => {
  const response = await api.get('/creator-analytics/dashboard');
  return response.data;
};

export const getNewsletterAnalytics = async (): Promise<any> => {
  const response = await api.get('/creator-analytics/newsletters');
  return response.data;
};

export const getCourseAnalytics = async (): Promise<any> => {
  const response = await api.get('/creator-analytics/courses');
  return response.data;
};

export const getPodcastAnalytics = async (): Promise<any> => {
  const response = await api.get('/creator-analytics/podcasts');
  return response.data;
};

// ---- AI Content Creation ---------------------------------------------------

export const generateContent = async (params: {
  topic: string;
  type: 'announcement' | 'tutorial' | 'opinion' | 'promotional' | 'question';
  details?: string;
  tone?: string;
  keywords?: string[];
}) => {
  const response = await api.post('/ai/content/generate', params);
  return response.data;
};

export const optimizeContent = async (content: string) => {
  const response = await api.post('/ai/content/optimize', { content });
  return response.data;
};

export const analyzeContent = async (content: string) => {
  const response = await api.post('/ai/content/analyze', { content });
  return response.data;
};

export const generateCaption = async (mediaType: 'image' | 'video' | 'audio', keywords?: string[]) => {
  const response = await api.post('/ai/content/caption', { mediaType, keywords });
  return response.data;
};

// ---- Translation -----------------------------------------------------------

export const getSupportedLanguages = async () => {
  const response = await api.get('/translation/languages');
  return response.data;
};

export const translateText = async (text: string, targetLang: string, sourceLang?: string) => {
  const response = await api.post('/translation/translate', { text, targetLang, sourceLang });
  return response.data;
};

// ---- Articles API ----------------------------------------------------------

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  excerpt: string;
  coverImage: string | null;
  author: { id: string; username: string; displayName: string; avatar: string };
  publishedAt: string;
  readingTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
  isGated: boolean;
}

export const getArticleFeed = async (page = 1, tag?: string): Promise<{ articles: Article[]; total: number }> => {
  const params = new URLSearchParams({ page: String(page) });
  if (tag) params.set('tag', tag);
  const response = await api.get(`/articles/feed?${params}`);
  return response.data;
};

export const getArticleBySlug = async (slug: string): Promise<Article> => {
  const response = await api.get(`/articles/${slug}`);
  return response.data;
};

// ---- Podcasts API ----------------------------------------------------------

export interface Podcast {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  audioUrl: string;
  durationSeconds: number;
  author: { id: string; username: string; displayName: string };
  tags: string[];
  playCount: number;
}

export const getPodcastFeed = async (page = 1, tag?: string): Promise<{ podcasts: Podcast[]; total: number }> => {
  const params = new URLSearchParams({ page: String(page) });
  if (tag) params.set('tag', tag);
  const response = await api.get(`/podcasts/feed?${params}`);
  return response.data;
};

// ---- Courses API -----------------------------------------------------------

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  author: { id: string; username: string; displayName: string };
  enrollmentCount: number;
  lessonCount: number;
}

export const getCourseFeed = async (page = 1): Promise<{ courses: Course[]; total: number }> => {
  const response = await api.get(`/courses/feed?page=${page}`);
  return response.data;
};

// ---- DAO API ---------------------------------------------------------------

export const createDao = async (groupId: string) => {
  const response = await api.post('/dao', { groupId });
  return response.data;
};

export const getDao = async (daoId: string) => {
  const response = await api.get(`/dao/${daoId}/stats`);
  return response.data;
};

export const getDaoStats = async (daoId: string) => {
  const response = await api.get(`/dao/${daoId}/stats`);
  return response.data;
};

export const getProposals = async (daoId: string) => {
  const response = await api.get(`/dao/${daoId}/proposals`);
  return response.data;
};

export const getProposal = async (proposalId: string) => {
  const response = await api.get(`/dao/proposals/${proposalId}`);
  return response.data;
};

export const createProposal = async (daoId: string, title: string, description: string) => {
  const response = await api.post(`/dao/${daoId}/proposals`, { title, description });
  return response.data;
};

export const vote = async (proposalId: string, voterId: string, support: boolean) => {
  const response = await api.post(`/dao/proposals/${proposalId}/vote`, { voterId, support });
  return response.data;
};

export const executeProposal = async (proposalId: string) => {
  const response = await api.post(`/dao/proposals/${proposalId}/execute`);
  return response.data;
};

// ---- Token-Gated API -------------------------------------------------------

export const getTokenGatedContent = async (contentId: string) => {
  const response = await api.get(`/token-gated/content/${contentId}`);
  return response.data;
};

export const createTokenGatedContent = async (
  name: string,
  description: string,
  tokenAddress: string,
  minTokenBalance: number,
) => {
  const response = await api.post('/token-gated/content', {
    name,
    description,
    tokenAddress,
    minTokenBalance,
  });
  return response.data;
};

export const createTokenGatedGroup = async (
  name: string,
  description: string,
  tokenAddress: string,
  minTokenBalance: number,
) => {
  const response = await api.post('/token-gated/group', {
    name,
    description,
    tokenAddress,
    minTokenBalance,
  });
  return response.data;
};

export const getTokenGatedGroup = async (groupId: string) => {
  const response = await api.get(`/token-gated/group/${groupId}`);
  return response.data;
};

export const joinTokenGatedGroup = async (groupId: string) => {
  const response = await api.post(`/token-gated/group/${groupId}/join`);
  return response.data;
};

// ---- Sync API --------------------------------------------------------------

export const getInitialSync = async (since?: string) => {
  const params = since ? `?since=${since}` : '';
  const response = await api.get(`/sync/initial${params}`);
  return response.data;
};

export const pushOfflineChanges = async (changes: any) => {
  const response = await api.post('/sync/push', changes);
  return response.data;
};

export const pullChanges = async (since: string) => {
  const response = await api.get(`/sync/pull?since=${since}`);
  return response.data;
};
