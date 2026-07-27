import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post, PostType, PostVisibility } from '../posts/entities/post.entity';
import { TrendsService } from '../trends/trends.service';
import { UserInterestsService } from '../user-interests/user-interests.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { SponsoredPostsService } from '../sponsored-posts/sponsored-posts.service';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { StoriesService } from '../stories/stories.service';
import { SnapMapGateway } from '../snapmap/snapmap.gateway';
import { VisibilityService } from '../common/visibility/visibility.service';
// import { AdsService } from '../ads/ads.service'; // AdsService commented out - broken imports

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly userInterestsService: UserInterestsService,
    private readonly usersService: UsersService,
    private readonly sponsoredPostsService: SponsoredPostsService,
    private readonly bookmarksService: BookmarksService,
    private readonly storiesService: StoriesService,
    private readonly snapMapGateway: SnapMapGateway,
    private readonly trendsService: TrendsService,
    private readonly visibilityService: VisibilityService,
    // private readonly adsService: AdsService, // AdsService commented out - broken imports
  ) {}

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  async getLocalFeed(user: User, radiusKm: number = 50): Promise<(Post & { distance?: number })[]> {
    // Get current user's location from SnapMap gateway's in-memory storage
    // @ts-expect-error - Access private userLocations map from SnapMapGateway (we can refactor to share location service later)
    const userLocation = this.snapMapGateway.userLocations?.get(user.id);
    
    if (!userLocation) {
      // If user hasn't shared location, return empty or fallback to location from user profile
      return [];
    }

    // Get all public posts with their places (locations) - exclude profile-only posts from local feed
    const postsWithPlaces = await this.postsRepository.find({
      where: { visibility: PostVisibility.PUBLIC },
      relations: ['user', 'reactions', 'comments', 'tags', 'place'],
      order: { createdAt: 'DESC' },
    }).then((posts) => this.visibilityService.filterVisiblePosts(user?.id ?? null, posts));

    // Filter posts that are within the radius and calculate their distance from user
    const blockedKeywords = user.blockedKeywords || [];
    const blockedHashtags = user.blockedHashtags || [];
    const blockedContentTypes = user.blockedContentTypes || [];
    
    const localPosts = postsWithPlaces
      .filter(post => post.place?.latitude && post.place?.longitude)
      .filter(post => {
        // Check for blocked content types
        const postType = post.postType.toLowerCase();
        if (blockedContentTypes.includes(postType)) return false;

        // Check for blocked hashtags
        const postHashtags = post.tags ? post.tags.map(tag => tag.name.toLowerCase()) : [];
        const hasBlockedHashtag = postHashtags.some(tag => blockedHashtags.includes(tag));
        if (hasBlockedHashtag) return false;

        // Check for blocked keywords in post content
        if (post.content) {
          const postContent = post.content.toLowerCase();
          const hasBlockedKeyword = blockedKeywords.some(keyword => 
            postContent.includes(keyword.toLowerCase())
          );
          if (hasBlockedKeyword) return false;
        }

        return true;
      })
      .map(post => {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          post.place.latitude,
          post.place.longitude
        );
        return { ...post, distance };
      })
      .filter(post => post.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance); // Sort by closest first

    return localPosts;
  }

  async getForYouFeed(user: User): Promise<(Post & { isAd?: boolean })[]> {
    const [publicPosts, userInterests, followingIds] = await Promise.all([
      this.postsRepository.find({
        where: { visibility: PostVisibility.PUBLIC },
        relations: ['user', 'reactions', 'comments', 'tags'],
      }).then((posts) => this.visibilityService.filterVisiblePosts(user?.id ?? null, posts)),
      user ? (this.userInterestsService?.getInterests?.(user) ?? Promise.resolve([])) : Promise.resolve([]),
      user ? (this.usersService?.findFollowingIds?.(user.id) ?? Promise.resolve([])) : Promise.resolve([]),
    ]);

    // Filter out posts that contain blocked keywords or hashtags
    let filteredPosts = publicPosts;
    if (user) {
      const blockedKeywords = user.blockedKeywords || [];
      const blockedHashtags = user.blockedHashtags || [];
      const blockedContentTypes = user.blockedContentTypes || [];
      
      filteredPosts = publicPosts.filter(post => {
        const postType = (post.postType || '').toString().toLowerCase();
        if (blockedContentTypes.includes(postType)) return false;

        const postHashtags = (post.tags || []).map(tag => (tag?.name || '').toString().toLowerCase());
        const hasBlockedHashtag = postHashtags.some(tag => blockedHashtags.includes(tag));
        if (hasBlockedHashtag) return false;

        if (post.content) {
          const postContent = post.content.toLowerCase();
          const hasBlockedKeyword = blockedKeywords.some(keyword => 
            postContent.includes((keyword || '').toString().toLowerCase())
          );
          if (hasBlockedKeyword) return false;
        }

        return true;
      });
    }

    // Get posts from followed hashtags
    const followedHashtagNames = user ? (user.followedHashtags || []).map(ht => ht.name.toLowerCase()) : [];
    const followedHashtagPosts = filteredPosts.filter(post => {
      if (followingIds.includes(post.user.id)) return false; // Already in organic posts
      const postHashtags = post.tags ? post.tags.map(tag => tag.name.toLowerCase()) : [];
      return postHashtags.some(tag => followedHashtagNames.includes(tag));
    });

    const organicPosts = filteredPosts.filter(post => followingIds.includes(post.user.id));
    const remainingPosts = filteredPosts.filter(post => 
      !followingIds.includes(post.user.id) && 
      !followedHashtagPosts.includes(post)
    );

    // Score followed hashtag posts and suggested posts
    const scoredFollowedHashtagPosts = followedHashtagPosts.map(post => {
      const { score, reasons } = this.calculatePostScore(post, userInterests);
      return { post: { ...post, algorithmReasons: reasons }, score };
    });

    const scoredRemainingPosts = remainingPosts.map(post => {
      const { score, reasons } = this.calculatePostScore(post, userInterests);
      return { post: { ...post, algorithmReasons: reasons }, score };
    });

    const scoredOrganicPosts = organicPosts.map(post => {
      const { score, reasons } = this.calculatePostScore(post, userInterests);
      return { post: { ...post, algorithmReasons: reasons }, score };
    });

    // Sort all posts by score
    scoredOrganicPosts.sort((a, b) => b.score - a.score);
    scoredFollowedHashtagPosts.sort((a, b) => b.score - a.score);
    scoredRemainingPosts.sort((a, b) => b.score - a.score);

    // Convert to feed posts format
    const organicFeedPosts: (Post & { isAd?: boolean })[] = scoredOrganicPosts.map(p => ({ ...p.post, isAd: false }));
    const followedHashtagFeedPosts: (Post & { isAd?: boolean })[] = scoredFollowedHashtagPosts.map(p => ({ ...p.post, isAd: false }));
    const remainingFeedPosts: (Post & { isAd?: boolean })[] = scoredRemainingPosts.map(p => ({ ...p.post, isAd: false }));

    // Commented out - getAdsForUser doesn't exist on AdsService
    // const ads = await this.adsService.getAdsForUser(user);
    const ads = []; // Temporary empty array
    const adPosts: (Post & { isAd?: boolean })[] = ads.map(ad => ({ ...ad.creative.post, isAd: true, adId: ad.id }));


    // Intersperse followed hashtag posts and other suggestions with organic posts
    const interleavedOrganicFeed: (Post & { isAd?: boolean })[] = [];
    let organicIndex = 0;
    const suggestionInterval = 3; // Show a suggestion every 3 organic posts

    if (organicFeedPosts.length === 0) {
      return [...followedHashtagFeedPosts, ...remainingFeedPosts];
    }

    while (organicIndex < organicFeedPosts.length) {
      const organicChunk = organicFeedPosts.slice(organicIndex, organicIndex + suggestionInterval);
      interleavedOrganicFeed.push(...organicChunk);
      organicIndex += organicChunk.length;

      // First prioritize posts from followed hashtags, then other suggested posts
      const nextPost = followedHashtagFeedPosts.shift() || remainingFeedPosts.shift();
      if (nextPost) {
        interleavedOrganicFeed.push(nextPost);
      }
    }

    if (adPosts.length === 0) {
      return interleavedOrganicFeed;
    }

    // Intersperse ads
    const interleavedFeed: (Post & { isAd?: boolean })[] = [];
    let feedIndex = 0;
    const adInterval = 5;

    while (feedIndex < interleavedOrganicFeed.length) {
      const feedChunk = interleavedOrganicFeed.slice(feedIndex, feedIndex + adInterval);
      interleavedFeed.push(...feedChunk);
      feedIndex += feedChunk.length;

      const adPost = adPosts.shift();
      if (adPost) {
        interleavedFeed.push(adPost);
      }
    }

    return interleavedFeed;
  }

  async getChronologicalFeed(user: User): Promise<Post[]> {
    const posts = await this.postsRepository.find({
      where: { visibility: PostVisibility.PUBLIC },
      order: { createdAt: 'DESC' },
      relations: ['user', 'reactions', 'comments', 'tags'],
    });
    return this.visibilityService.filterVisiblePosts(user?.id ?? null, posts);
  }

  async getRecommendedFeed(user: User, limit: number = 20): Promise<(Post & { recommendationScore?: number; algorithmReasons?: string[] })[]> {
    if (!user) {
      return this.getTrendingFeed(user, limit);
    }

    const [publicPosts, userInterests, followingIds] = await Promise.all([
      this.postsRepository.find({
        where: { visibility: PostVisibility.PUBLIC },
        relations: ['user', 'reactions', 'comments', 'tags'],
        order: { createdAt: 'DESC' },
      }).then((posts) => this.visibilityService.filterVisiblePosts(user?.id ?? null, posts)),
      this.userInterestsService.getInterests(user, 20),
      this.usersService.findFollowingIds(user.id),
    ]);

    const blockedKeywords = user.blockedKeywords || [];
    const blockedHashtags = user.blockedHashtags || [];
    const blockedContentTypes = user.blockedContentTypes || [];
    const followedHashtagNames = (user.followedHashtags || []).map((tag) => tag.name.toLowerCase());

    const scoredPosts = publicPosts
      .filter((post) => {
        const postType = (post.postType || '').toLowerCase();
        if (blockedContentTypes.includes(postType)) return false;

        const postHashtags = (post.tags || []).map((tag) => tag.name.toLowerCase());
        const hasBlockedHashtag = postHashtags.some((tag) => blockedHashtags.includes(tag));
        if (hasBlockedHashtag) return false;

        if (post.content) {
          const postContent = post.content.toLowerCase();
          const hasBlockedKeyword = blockedKeywords.some((keyword) => postContent.includes(keyword.toLowerCase()));
          if (hasBlockedKeyword) return false;
        }

        return true;
      })
      .map((post) => {
        const interestMatches = (post.tags || []).filter((tag) =>
          userInterests.some((interest) => interest.tag?.id === tag.id || interest.tag?.name?.toLowerCase() === tag.name?.toLowerCase()),
        );

        const followsAuthor = followingIds.includes(post.user?.id);
        const hashtagMatch = (post.tags || []).some((tag) => followedHashtagNames.includes(tag.name.toLowerCase()));
        const comments = post.comments?.length || 0;
        const reactions = post.reactions?.length || 0;
        const now = Date.now();
        const postAgeHours = Math.max(0.1, (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
        const recencyScore = Math.max(0, 1 - postAgeHours / 72);
        const interestScore = interestMatches.reduce((sum, tag) => {
          const match = userInterests.find((interest) => interest.tag?.id === tag.id || interest.tag?.name?.toLowerCase() === tag.name?.toLowerCase());
          return sum + (match?.score || 0);
        }, 0);

        const recommendationScore =
          interestScore * 2.5 +
          comments * 1.4 +
          reactions * 0.6 +
          (followsAuthor ? 6 : 0) +
          (hashtagMatch ? 4 : 0) +
          recencyScore * 3;

        const algorithmReasons = [
          interestMatches.length > 0 ? `Matches your interests in ${interestMatches.map((tag) => tag.name).join(', ')}` : 'Broad discovery mix',
          followsAuthor ? 'From someone you follow' : 'New creator suggestion',
          hashtagMatch ? 'Related to a topic you follow' : 'Popular in your network',
        ];

        return {
          ...post,
          recommendationScore,
          algorithmReasons,
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    return scoredPosts;
  }

  async getFeed(user: User, options: { view?: string; limit?: number } = {}): Promise<(Post & { recommendationScore?: number; algorithmReasons?: string[]; trendScore?: number; matchedTrends?: string[] })[]> {
    const view = options.view || 'for-you';
    const limit = Math.max(1, options.limit || 20);

    switch (view) {
      case 'recommended':
        return this.getRecommendedFeed(user, limit);
      case 'chronological':
        return (await this.getChronologicalFeed(user)).slice(0, limit);
      case 'friends':
        return (await this.getFriendsFeed(user)).slice(0, limit);
      case 'subscriptions':
        return (await this.getSubscriptionsFeed(user)).slice(0, limit);
      case 'favorites':
        return (await this.getFavoritesFeed(user)).slice(0, limit);
      case 'trending':
        return this.getTrendingFeed(user, limit);
      case 'for-you':
      default:
        return (await this.getForYouFeed(user)).slice(0, limit);
    }
  }

  async getShortsFeed(user: User): Promise<Post[]> {
    const videoPosts = await this.postsRepository.find({
      where: {
        visibility: PostVisibility.PUBLIC,
        postType: PostType.REEL,
      },
      relations: ['user', 'reactions', 'comments', 'tags'],
    }).then((posts) => this.visibilityService.filterVisiblePosts(user?.id ?? null, posts));

    const userInterests = await this.userInterestsService.getInterests(user);

    const scoredPosts = videoPosts.map(post => {
      const score = this.calculatePostScore(post, userInterests);
      return { ...post, score };
    });

    scoredPosts.sort((a, b) => (b as any).score - (a as any).score);

    return scoredPosts;
  }

  async getFavoritesFeed(user: User): Promise<Post[]> {
    if (!user) {
      return [];
    }
    const bookmarks = await this.bookmarksService.findAll(user);
    return bookmarks.map(bookmark => bookmark.post);
  }

  async getFriendsFeed(user: User): Promise<Post[]> {
    if (!user) {
      return [];
    }

    // Get all following user IDs (for Following feed)
    const followingIds = await this.usersService?.findFollowingIds?.(user.id) ?? [];

    if (followingIds.length === 0) {
      return [];
    }

    const posts = await this.postsRepository.find({
      where: {
        user: { id: In(followingIds) },
        visibility: PostVisibility.PUBLIC,
      },
      order: { createdAt: 'DESC' },
      relations: ['user', 'reactions', 'comments', 'tags'],
    });

    const visiblePosts = posts.filter((post) => post.user?.id && followingIds.includes(post.user.id));
    // Followed users can still be blocked (block after follow) — filter them out.
    return this.visibilityService.filterVisiblePosts(user.id, visiblePosts);
  }

  async getSubscriptionsFeed(user: User): Promise<Post[]> {
    if (!user) {
      return [];
    }

    // Get all subscribed creator IDs (for Subscriptions feed - creators the user is subscribed to)
    const subscriptions = user.subscriptions || [];
    const subscribedCreatorIds = subscriptions.map(sub => sub.creator.id);
    
    if (subscribedCreatorIds.length === 0) {
      return [];
    }

    const posts = await this.postsRepository.find({
      where: {
        user: { id: In(subscribedCreatorIds) },
        visibility: PostVisibility.PUBLIC,
      },
      order: { createdAt: 'DESC' },
      relations: ['user', 'reactions', 'comments', 'tags'],
    });
    return this.visibilityService.filterVisiblePosts(user.id, posts);
  }

  async getStoryFeed(user: User): Promise<any[]> {
    if (!user) {
      return this.storiesService.findActiveStories();
    }
    const [followingIds, blockedUsers] = await Promise.all([
        this.usersService.findFollowingIds(user.id),
        this.usersService.getBlockedUsers(user.id),
    ]);
    const blockedUserIds = blockedUsers.map(u => u.id);
    const filteredFollowingIds = followingIds.filter(id => !blockedUserIds.includes(id));

    return this.storiesService.findActiveStories(filteredFollowingIds);
  }

  private calculatePostScore(post: Post, userInterests: any[]): { score: number; reasons: string[] } {
    const likeWeight = 1;
    const commentWeight = 2;
    const recencyWeight = 0.5;
    const interestWeight = 5;
    const reasons: string[] = [];

    const now = new Date().getTime();
    const postAgeInHours = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
    if (postAgeInHours < 24) {
      reasons.push('This is a recent post');
    }

    let interestScore = 0;
    const matchingTags: string[] = [];
    if (post.tags) {
      for (const tag of post.tags) {
        const interest = userInterests.find(i => i.tag.id === tag.id);
        if (interest) {
          interestScore += interest.score;
          matchingTags.push(tag.name);
        }
      }
      if (matchingTags.length > 0) {
        reasons.push(`This post contains topics you follow: ${matchingTags.join(', ')}`);
      }
    }

    // Check if post is from a followed user
    if (post.user && post.user.followers && post.user.followers.length > 0) {
      reasons.push('This post is from someone you follow');
    }

    // Check engagement
    if (post.comments && post.comments.length > 10) {
      reasons.push('This post is popular with many comments');
    }

    const score =
      // Commented out since Post entity doesn't have a likes property (uses postReactions instead)
      // post.likes.length * likeWeight +
      post.comments.length * commentWeight -
      postAgeInHours * recencyWeight +
      interestScore * interestWeight;

    return { score, reasons };
  }

  async getTrendingFeed(user: User, limit: number = 20): Promise<(Post & { trendScore?: number; matchedTrends?: string[] })[]> {
    const [posts, trends] = await Promise.all([
      this.postsRepository.find({
        where: { visibility: PostVisibility.PUBLIC },
        relations: ['user', 'reactions', 'comments', 'tags'],
        order: { createdAt: 'DESC' },
      }).then((found) => this.visibilityService.filterVisiblePosts(user?.id ?? null, found)),
      this.trendsService.getTrending(Math.max(limit, 10), 7),
    ]);

    const activeTrendTags = new Set((trends || []).map((trend) => trend.tag.replace(/^#/, '').toLowerCase()));

    const scoredPosts = posts
      .filter((post) => post.visibility === PostVisibility.PUBLIC)
      .map((post) => {
        const tagNames = (post.tags || []).map((tag) => tag.name.toLowerCase());
        const matchedTrends = tagNames.filter((tagName) => activeTrendTags.has(tagName));
        const engagementScore = (post.comments?.length || 0) * 2 + (post.reactions?.length || 0) * 0.6;
        const recencyHours = Math.max(0.1, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
        const recencyScore = Math.max(0, 12 - recencyHours) / 12;
        const trendScore = matchedTrends.length * 8 + engagementScore + recencyScore * 4;

        return {
          ...post,
          trendScore,
          matchedTrends,
        };
      })
      .filter((post) => post.matchedTrends.length > 0 || (post.comments?.length || 0) >= 2)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);

    return scoredPosts;
  }

  async getExploreFeed(user: User, category?: string) {
    const posts = await this.postsRepository
      .createQueryBuilder('post')
      .where('post.visibility = :visibility', { visibility: PostVisibility.PUBLIC })
      .andWhere('post.imageUrls IS NOT NULL')
      .andWhere('array_length(post.imageUrls, 1) > 0')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.reactions', 'reactions')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('post.tags', 'tags')
      .orderBy('post.createdAt', 'DESC')
      .limit(30)
      .getMany()
      .then((found) => this.visibilityService.filterVisiblePosts(user?.id ?? null, found));

    return { posts, hasMore: posts.length === 30 };
  }

  async getExploreCategories() {
    const categories = [
      { id: 'nature', name: 'Nature', count: 1250 },
      { id: 'travel', name: 'Travel', count: 980 },
      { id: 'food', name: 'Food', count: 1520 },
      { id: 'art', name: 'Art & Design', count: 870 },
      { id: 'fashion', name: 'Fashion', count: 1100 },
    ];
    return { categories };
  }

  async getVisualDiscoveryFeed(user: User, category?: string, skip: number = 0) {
    const posts = await this.postsRepository
      .createQueryBuilder('post')
      .where('post.visibility = :visibility', { visibility: PostVisibility.PUBLIC })
      .andWhere('post.imageUrls IS NOT NULL')
      .andWhere('array_length(post.imageUrls, 1) > 0')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.reactions', 'reactions')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('post.tags', 'tags')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(30)
      .getMany()
      .then((found) => this.visibilityService.filterVisiblePosts(user?.id ?? null, found));

    return { posts, hasMore: posts.length === 30 };
  }

  async getVisualCategories() {
    const categories = [
      { 
        id: 'nature', 
        name: 'Nature & Landscapes', 
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        description: 'Stunning natural landscapes from around the world',
        postCount: 1250
      },
      { 
        id: 'travel', 
        name: 'Travel & Adventure', 
        imageUrl: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&h=300&fit=crop',
        description: 'Explore amazing destinations and travel experiences',
        postCount: 980
      },
      { 
        id: 'food', 
        name: 'Food & Cooking', 
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
        description: 'Delicious recipes and culinary creations',
        postCount: 1520
      },
      { 
        id: 'art', 
        name: 'Art & Design', 
        imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop',
        description: 'Creative artworks and design inspirations',
        postCount: 870
      },
      { 
        id: 'fashion', 
        name: 'Fashion & Style', 
        imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop',
        description: 'Latest fashion trends and style inspiration',
        postCount: 1100
      },
      { 
        id: 'animals', 
        name: 'Animals & Pets', 
        imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
        description: 'Cute pets and amazing wildlife',
        postCount: 765
      },
      { 
        id: 'architecture', 
        name: 'Architecture', 
        imageUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=400&h=300&fit=crop',
        description: 'Incredible buildings and architectural wonders',
        postCount: 640
      },
      { 
        id: 'photography', 
        name: 'Photography', 
        imageUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop',
        description: 'Professional photography and camera work',
        postCount: 920
      },
    ];
    return { categories };
  }
}