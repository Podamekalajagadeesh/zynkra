
import { Exclude } from 'class-transformer';
import { RelationshipStatus } from './relationship-status.enum';
import { LifeEvent } from './life-event.entity';
import { Role } from '../roles.enum';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { PostReaction } from '../../posts/entities/post-reaction.entity';
import { Authenticator } from '../../auth/entities/authenticator.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Report } from '../../reports/entities/report.entity';
import { Conversation } from '../../dms/entities/conversation.entity';
import { Story } from '../../stories/entities/story.entity';
import { Group } from '../../groups/entities/group.entity';
import { GroupMember } from '../../groups/entities/group-member.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
// import { Stream } from '../../../broken-modules/livestream/entities/stream.entity';
import { Reputation } from '../../reputation/entities/reputation.entity';
import { PollOption } from '../../polls/entities/poll-option.entity';
import { Event } from '../../events/entities/event.entity';
import { Bookmark } from '../../bookmarks/entities/bookmark.entity';
import { UserInterest } from '../../user-interests/user-interest.entity';
import { NotificationSettings } from './notification-settings.entity';
import { FollowRequest } from './follow-request.entity';
import { PersonalizationControls } from '../personalization-controls';
import { Watchlist } from '../../bookmarks/entities/watchlist.entity';
import { Collection } from '../../bookmarks/entities/collection.entity';
import { Fundraiser } from '../../fundraisers/entities/fundraiser.entity';
import { Donation } from '../../fundraisers/entities/donation.entity';
import { Page } from '../../pages/entities/page.entity';
import { PageMember } from '../../pages/entities/page-member.entity';
import { Badge } from '../../monetization/entities/badge.entity';
import { Sticker } from '../../stickers/entities/sticker.entity';
import { UserSticker } from '../../stickers/entities/user-sticker.entity';
import { MarketplaceListing } from '../../marketplace/entities/listing.entity';
// import { DatingProfile } from '../../dating/entities/dating-profile.entity'; // Moved to broken-modules
// import { Swipe } from '../../dating/entities/swipe.entity'; // Moved to broken-modules
// import { Match } from '../../dating/entities/match.entity'; // Moved to broken-modules
// import { SecretCrush } from '../../dating/entities/secret-crush.entity'; // Moved to broken-modules
// import { AdAccount } from '../../ads/entities/ad-account.entity'; // Moved to broken-modules
// import { AdPreference } from '../../../broken-modules/ads/entities/ad-preference.entity'; // Moved to broken-modules
import { Product } from '../../marketplace/entities/product.entity';
import { Snooze } from '../../snooze/entities/snooze.entity';
import { Transaction } from '../../marketplace/entities/transaction.entity';
import { Rating } from '../../marketplace/entities/rating.entity';
import { Nonprofit } from '../../nonprofits/entities/nonprofit.entity';
import { DigitalAsset } from '../../digital-assets/entities/digital-asset.entity';
import { Education } from './education.entity';
import { WorkExperience } from './work-experience.entity';
import { AffiliateLink } from '../../affiliates/entities/affiliate-link.entity';
import { LiveShoppingEvent } from '../../liveshopping/entities/live-shopping-event.entity';
// import { LiveStreamReplay } from '../../../broken-modules/livestream/entities/livestream-replay.entity';
// import { LiveStreamComment } from '../../../broken-modules/livestream/entities/livestream-comment.entity';
import { Order } from '../../marketplace/entities/order.entity';
// import { ScheduledStream } from '../../../broken-modules/livestream/entities/scheduled-stream.entity';
import { SavedMarketplaceListing } from '../../saved-marketplace-listings/entities/saved-marketplace-listing.entity';
import { Trend } from '../../trends/entities/trend.entity';



export enum EmailSearchPrivacy {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  NO_ONE = 'no_one',
}

export enum PostVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  ONLY_ME = 'only_me',
}

export enum CommentPrivacy {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  FRIENDS_OF_FRIENDS = 'friends_of_friends',
  NO_ONE = 'no_one',
}

export enum TagPrivacy {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  FRIENDS_OF_FRIENDS = 'friends_of_friends',
  NO_ONE = 'no_one',
}

export enum MessagePrivacy {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  FRIENDS_OF_FRIENDS = 'friends_of_friends',
  NO_ONE = 'no_one',
}

export enum ScreenshotProtectionLevel {
  WARNING_ONLY = 'warning_only',
  BLOCK_ALL = 'block_all',
}

export class ScreenshotProtectionSettings {
  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'varchar', default: ScreenshotProtectionLevel.WARNING_ONLY })
  level: ScreenshotProtectionLevel;

  @Column({ type: 'boolean', default: true })
  applyToDms: boolean;

  @Column({ type: 'boolean', default: true })
  applyToPosts: boolean;

  @Column({ type: 'boolean', default: true })
  applyToStories: boolean;

  @Column({ type: 'boolean', default: false })
  applyToProfile: boolean;
}

export enum FriendRequestPrivacy {
  EVERYONE = 'everyone',
  FRIENDS_OF_FRIENDS = 'friends_of_friends',
}

export enum ProfilePrivacy {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum AccountType {
  PERSONAL = 'personal',
  CREATOR = 'creator',
  BUSINESS = 'business',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude()
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({
    type: 'enum',
    enum: AccountType,
    default: AccountType.PERSONAL,
  })
  accountType: AccountType;

  @Column({ default: false })
  verified: boolean;

  @Exclude()
  @Column({ nullable: true })
  verificationStatus?: 'pending' | 'approved' | 'rejected';

  @Exclude()
  @Column({ nullable: true })
  idDocumentUrl?: string;

  @Exclude()
  @Column({ nullable: true })
  verificationSubmittedAt?: Date;

  @Exclude()
  @Column({ default: false })
  banned: boolean;

  @Exclude()
  @Column({ unique: true, nullable: true })
  email: string | null;

  @Exclude()
  @Column({ type: 'varchar', length: 32, nullable: true, unique: true })
  phoneNumber: string | null;

  @Exclude()
  @Column({ nullable: true })
  password_hash: string | null;

  @Exclude()
  @Column({ default: false })
  emailVerified: boolean;

  @Exclude()
  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  postVisibility: PostVisibility;

  @Exclude()
  @Column({
    type: 'enum',
    enum: FriendRequestPrivacy,
    default: FriendRequestPrivacy.EVERYONE,
  })
  friendRequestPrivacy: FriendRequestPrivacy;

  @Exclude()
  @Column({
    type: 'enum',
    enum: EmailSearchPrivacy,
    default: EmailSearchPrivacy.EVERYONE,
  })
  emailSearchPrivacy: EmailSearchPrivacy;

  @Exclude()
  @Column({
    type: 'enum',
    enum: CommentPrivacy,
    default: CommentPrivacy.EVERYONE,
  })
  commentPrivacy: CommentPrivacy;

  @Exclude()
  @Column({
    type: 'enum',
    enum: TagPrivacy,
    default: TagPrivacy.EVERYONE,
  })
  tagPrivacy: TagPrivacy;

  @Exclude()
  @Column({
    type: 'enum',
    enum: MessagePrivacy,
    default: MessagePrivacy.EVERYONE,
  })
  messagePrivacy: MessagePrivacy;

  @Exclude()
  @Column({ nullable: true })
  emailVerificationToken: string;

  @Exclude()
  @Column({ nullable: true })
  emailVerificationTokenExpires: Date;

  /**
   * Failed attempts at redeeming `emailVerificationToken`.
   *
   * The code is 6 digits and there is no other per-account barrier, so without a
   * counter a patient attacker can grind the space. `verifyByCode` locks the
   * account out of code redemption for a cooling-off period once
   * `VERIFICATION_CODE_MAX_ATTEMPTS` is exceeded. Reset on every successful
   * verification and whenever a fresh code is issued.
   */
  @Exclude()
  @Column({ type: 'int', default: 0 })
  emailVerificationAttempts: number;

  @Exclude()
  @Column({ nullable: true })
  emailVerificationLockedUntil: Date | null;

  @Exclude()
  @Column({ nullable: true })
  passwordResetToken: string | null;

  @Exclude()
  @Column({ nullable: true })
  passwordResetTokenExpires: Date | null;

  @Exclude()
  @Column({ type: 'simple-array', nullable: true })
  recoveryCodeHashes: string[] | null;

  /**
   * IP addresses (or CIDR-free exact addresses) the user has marked as trusted.
   *
   * A sign-in from one of these does not raise a new-device / suspicious-login
   * prompt. Previously this lived only in an in-process `Map` inside
   * `SecuritySettingsService`, so the control was cosmetic: adding a trusted IP
   * changed nothing, and a restart discarded the list.
   */
  @Exclude()
  @Column({ type: 'simple-array', nullable: true })
  trustedIpAddresses: string[] | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  recoveryCodesGeneratedAt: Date | null;

  @Exclude()
  @Column({ type: 'simple-array', nullable: true })
  trustedRecoveryContacts: string[] | null;

  @Exclude()
  @Column({ nullable: true })
  trustedRecoveryCodeHash: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  trustedRecoveryCodeExpiresAt: Date | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  magicLinkTokenHash: string | null;

  @Exclude()
  @Column({ type: 'timestamp with time zone', nullable: true })
  magicLinkTokenExpiresAt: Date | null;

  @Exclude()
  @Column({ nullable: true })
  provider: string;

  @Exclude()
  @Column({ nullable: true })
  providerId: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true, unique: true })
  walletAddress: string | null;

  @Exclude()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  walletBalance: number;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  stripeConnectAccountId: string | null;

  @Exclude()
  @Column({ type: 'boolean', default: false })
  payoutsEnabled: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  username: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pronouns: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'simple-array', nullable: true })
  website: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  nftPfpUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  nftPfpContractAddress: string | null;

  @Column({ type: 'varchar', nullable: true })
  nftPfpTokenId: string | null;

  @Exclude()
  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  twoFactorSecret: string | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  status: string | null;

  @Exclude()
  @Column({ type: 'timestamp with time zone', nullable: true })
  deactivatedAt: Date | null;

  @Exclude()
  @Column({ type: 'varchar', length: 500, nullable: true })
  deactivationReason: string | null;

  // Activity status controls
  @Column({ default: true })
  showOnlineStatus: boolean;

  @Column({ default: true })
  showLastSeenTimestamp: boolean;

  @Column({ default: true })
  readReceipts: boolean;

  @Column({ default: true })
  contactDiscovery: boolean;

  @Column({ default: true })
  personalization: boolean;

  @Column({ default: true })
  adPersonalization: boolean;

  @Column({ type: 'jsonb', default: {} })
  personalizationControls: PersonalizationControls;

  @Column({ default: 'everyone' })
  mentions: 'everyone' | 'followers' | 'no_one';

  @Column({ default: 'friends' })
  activityVisibility: 'public' | 'friends' | 'private';

  @Column({ default: 'friends' })
  storyVisibility: 'public' | 'friends' | 'followers' | 'only_me';

  @Column({ default: 'everyone' })
  searchVisibility: 'everyone' | 'friends' | 'no_one';

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastSeenAt: Date | null;

  @Column({ default: false })
  isOnline: boolean;

  @Column({
    type: 'enum',
    enum: ProfilePrivacy,
    default: ProfilePrivacy.PUBLIC,
  })
  profilePrivacy: ProfilePrivacy;

  @Column(() => ScreenshotProtectionSettings)
  screenshotProtection: ScreenshotProtectionSettings;

  @Column({ default: true })
  timelineReviewEnabled: boolean;

  @Column({ default: false })
  tagReviewEnabled: boolean;

  @Column({ default: false })
  isProfessional: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoryLabel: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  profileAccentColor: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  profileThemeColor: string | null;

  @Column({ type: 'varchar', nullable: true })
  profileTheme: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  birthDateVerifiedAt: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  profileBioFont: string | null;

  @Column({ type: 'text', nullable: true })
  publicKey: string | null;

  @Column({ type: 'varchar', nullable: true })
  header: string | null;

  @OneToMany(() => SavedMarketplaceListing, (savedListing) => savedListing.user)
  savedMarketplaceListings: SavedMarketplaceListing[];

  @Column({ type: 'varchar', nullable: true })
  profileHeaderImageUrl: string | null;

  @Column(() => NotificationSettings)
  notificationSettings: NotificationSettings;

  @OneToMany(() => Authenticator, (authenticator) => authenticator.user)
  authenticators: Authenticator[];

  @OneToMany(() => Post, (post) => post.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  posts: Post[];

  // @OneToMany(() => Event, (event) => event.creator)
  // events: Event[];

  @OneToMany(() => Story, (story) => story.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  stories: Story[];

  @OneToMany(() => PostReaction, (reaction) => reaction.user)
  postReactions: PostReaction[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks: Bookmark[];

  @OneToMany(() => Watchlist, (watchlist) => watchlist.user)
  watchlist: Watchlist[];

  @OneToMany(() => Collection, (collection) => collection.user)
  collections: Collection[];

  @OneToMany(() => Report, (report) => report.reporter)
  reports: Report[];

  @OneToMany(() => Snooze, (snooze) => snooze.user)
  snoozes: Snooze[];

  @ManyToMany(() => Conversation, (conversation) => conversation.participants)
  conversations: Conversation[];

  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'follows',
    joinColumn: { name: 'followerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'followingId', referencedColumnName: 'id' },
  })
  following: User[];

  @ManyToMany(() => User, (user) => user.following)
  followers: User[];

  @ManyToMany(() => User, (user) => user.favoritedBy)
  @JoinTable({
    name: 'favorites',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'favoriteUserId', referencedColumnName: 'id' },
  })
  favorites: User[];

  @ManyToMany(() => User, (user) => user.favorites)
  favoritedBy: User[];

  @ManyToMany(() => User, (user) => user.restrictedBy)
  @JoinTable({
    name: 'restricted_users',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'restrictedUserId', referencedColumnName: 'id' },
  })
  restrictedUsers: User[];

  @ManyToMany(() => User, (user) => user.restrictedUsers)
  restrictedBy: User[];

  @ManyToMany(() => User, (user) => user.blockedBy)
  @JoinTable({
    name: 'blocked_users',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'blockedUserId', referencedColumnName: 'id' },
  })
  blockedUsers: User[];

  @ManyToMany(() => User, (user) => user.blockedUsers)
  blockedBy: User[];

  @ManyToMany(() => User, (user) => user.mutedBy)
  @JoinTable({
    name: 'user_mutes',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'mutedUserId', referencedColumnName: 'id' },
  })
  mutedUsers: User[];

  @ManyToMany(() => User, (user) => user.mutedUsers)
  mutedBy: User[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  followedHashtags: { id: string; name: string }[];

  @Column({ type: 'jsonb', nullable: true })
  accountPreferences: {
    theme?: 'light' | 'dark' | 'system';
    appIcon?: 'default' | 'neon' | 'ocean' | 'sunset' | 'creator-classic' | 'creator-vibrant' | 'creator-minimal';
    language?: string;
    timezone?: string;
    defaultPrivacy?: 'public' | 'friends' | 'private';
    keyboardNavigationEnabled?: boolean;
    autoTranslate?: boolean;
    feedSort?: 'algorithmic' | 'chronological';
    screenTimeEnabled?: boolean;
    dailyScreenTimeLimit?: number;
    contentWarningsEnabled?: boolean;
    highContrastMode?: boolean;
    reducedMotion?: boolean;
    screenReaderOptimized?: boolean;
    voiceControlEnabled?: boolean;
    largeTextMode?: boolean;
    colorBlindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
    customSettings?: Record<string, any>;
    updatedAt?: string;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  accountPermissions: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  accountDataPermissions: string[] | null;

  @Column({ type: 'uuid', nullable: true })
  activeAccountProfileId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  accountSecuritySettings: {
    twoFactorAuthentication?: boolean;
    biometricAuthentication?: boolean;
    passkeysEnabled?: boolean;
    recoveryCodesEnabled?: boolean;
    loginApprovalsEnabled?: boolean;
    suspiciousLoginAlertsEnabled?: boolean;
    deviceManagementEnabled?: boolean;
    sessionManagementEnabled?: boolean;
    accountRecoveryEnabled?: boolean;
    securityCenterEnabled?: boolean;
    updatedAt?: string;
  } | null;

  @Column({ type: 'simple-array', nullable: true, default: () => "'[]'" })
  blockedKeywords: string[];

  @Column({ type: 'simple-array', nullable: true, default: () => "'[]'" })
  blockedHashtags: string[];

  @Column({ type: 'simple-array', nullable: true, default: () => "'[]'" })
  blockedContentTypes: string[];

  // BeReal - Daily 2-minute post window tracking
  @Column({ type: 'timestamp with time zone', nullable: true })
  berealWindowStartTime: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastBerealPostTime: Date | null;

  @Column({ default: false })
  hasPostedBerealToday: boolean;

  @ManyToMany(() => User, (user) => user.closeFriendsWith)
  @JoinTable({
    name: 'close_friends',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'closeFriendId', referencedColumnName: 'id' },
  })
  closeFriends: User[];

  @ManyToMany(() => User, (user) => user.closeFriends)
  closeFriendsWith: User[];

  @OneToMany(() => Group, (group) => group.owner)
  ownedGroups: Group[];

  @OneToMany(() => GroupMember, (groupMember) => groupMember.user)
  groupMemberships: GroupMember[];

  @OneToMany(() => Subscription, (subscription) => subscription.subscriber)
  subscriptions: Subscription[];

  @OneToMany(() => Subscription, (subscription) => subscription.creator)
  subscribers: Subscription[];

  // @OneToMany(() => Stream, (stream) => stream.user)
  // streams: Stream[];

  @OneToMany(() => UserInterest, (interest) => interest.user)
  interests: UserInterest[];

  @OneToOne(() => Reputation, (reputation) => reputation.user, { cascade: true, eager: true })
  @JoinColumn()
  reputation: Reputation;

  @ManyToMany(() => PollOption, (option) => option.votes)
  @JoinTable()
  votedOptions: PollOption[];

  @OneToMany(() => FollowRequest, (request) => request.requester)
  sentFollowRequests: FollowRequest[];

  @OneToMany(() => FollowRequest, (request) => request.recipient)
  receivedFollowRequests: FollowRequest[];

  @ManyToMany(() => Badge, (badge) => badge.users)
  @JoinTable()
  badges: Badge[];

  @OneToMany(() => Sticker, (sticker) => sticker.creator)
  stickers: Sticker[];

  @OneToMany(() => UserSticker, userSticker => userSticker.user)
  userStickers: UserSticker[];

  @OneToMany(() => DigitalAsset, digitalAsset => digitalAsset.owner)
  digitalAssets: DigitalAsset[];

  @OneToMany(() => Page, (page) => page.owner)
  ownedPages: Page[];

  @OneToMany(() => PageMember, (pageMember) => pageMember.user)
  pageMemberships: PageMember[];

  @OneToMany(() => MarketplaceListing, (listing) => listing.seller)
  listings: MarketplaceListing[];

  @OneToMany(() => Fundraiser, (fundraiser) => fundraiser.organizer)
  fundraisers: Fundraiser[];

  @OneToMany(() => Donation, (donation) => donation.donor)
  donations: Donation[];

  // @OneToOne(() => DatingProfile, (profile) => profile.user) // DatingProfile moved to broken-modules
  // datingProfile: DatingProfile;

  // @OneToMany(() => Swipe, (swipe) => swipe.swiper) // Swipe moved to broken-modules
  // swipes: Swipe[];

  // @ManyToMany(() => Match, (match) => match.users) // Match moved to broken-modules
  // matches: Match[];

  // @OneToMany(() => SecretCrush, (crush) => crush.crusher) // SecretCrush moved to broken-modules
  // secretCrushes: SecretCrush[];

  // @OneToOne(() => AdAccount, (adAccount) => adAccount.user) // AdAccount moved to broken-modules
  // adAccount: AdAccount;

  // @OneToOne(() => AdPreference, (adPreference) => adPreference.user)
  // adPreference: AdPreference;

  // @OneToMany(() => LiveStreamComment, (comment) => comment.user)
  // liveStreamComments: LiveStreamComment[];

  // @OneToMany(() => LiveStreamReplay, (replay) => replay.user)
  // streamReplays: LiveStreamReplay[];

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  @OneToMany(() => LiveShoppingEvent, (event) => event.host)
  liveShoppingEvents: LiveShoppingEvent[];

  // @OneToMany(() => Order, (order) => order.customer)
  // orders: Order[];

  @Column({
    type: 'enum',
    enum: RelationshipStatus,
    nullable: true,
  })
  relationshipStatus: RelationshipStatus;

  @OneToMany(() => LifeEvent, (lifeEvent) => lifeEvent.user, { cascade: true })
  lifeEvents: LifeEvent[];

  // @OneToMany(() => Stream, (stream) => stream.user)
  // streams: Stream[];

  // @OneToMany(() => ScheduledStream, (stream) => stream.user)
  // scheduledStreams: ScheduledStream[];

  @OneToMany(() => Transaction, (transaction) => transaction.seller)
  sales: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.buyer)
  purchases: Transaction[];

  @OneToMany(() => Rating, (rating) => rating.rater)
  ratingsGiven: Rating[];

  @OneToMany(() => Rating, (rating) => rating.ratee)
  ratingsReceived: Rating[];

  // Followed trends/hashtags
  @ManyToMany(() => Trend, (trend) => trend.followedBy)
  followedTrends: Trend[];

  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  @Column({ default: false })
  isFaceRecognitionEnabled: boolean;

  @Column({ default: false })
  isGuest: boolean;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ default: false })
  isRegionEligibleForFaceRecognition: boolean;

  // @OneToMany(() => Education, (education) => education.user)
  // education: Education[];

  // @OneToMany(() => WorkExperience, (workExperience) => workExperience.user)
  // workExperiences: WorkExperience[];

  @OneToMany(() => Nonprofit, (nonprofit) => nonprofit.user)
  nonprofits: Nonprofit[];

  @OneToMany(() => AffiliateLink, (affiliateLink) => affiliateLink.user)
  affiliateLinks: AffiliateLink[];

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}