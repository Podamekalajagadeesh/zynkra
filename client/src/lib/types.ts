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
  NONE = 'none',
  WARNING_ONLY = 'warning_only',
  BLOCK_ALL = 'block_all',
}

export interface ScreenshotProtectionSettings {
  enabled: boolean;
  level: ScreenshotProtectionLevel;
  applyToDms: boolean;
  applyToPosts: boolean;
  applyToStories: boolean;
  applyToProfile: boolean;
}

export const defaultScreenshotProtectionSettings: ScreenshotProtectionSettings = {
  enabled: false,
  level: ScreenshotProtectionLevel.WARNING_ONLY,
  applyToDms: true,
  applyToPosts: true,
  applyToStories: true,
  applyToProfile: false,
};

export enum FriendRequestPrivacy {
  EVERYONE = 'everyone',
  FRIENDS_OF_FRIENDS = 'friends_of_friends',
}

export enum EmailSearchPrivacy {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  NO_ONE = 'no_one',
}

export type PostType = 'text' | 'media' | 'reel' | 'story';

export interface AuthData {
  username?: string;
  email?: string;
  password?: string;
}

export interface LifeEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'birthday' | 'anniversary' | 'new_job' | 'moved' | 'graduation' | 'other';
}

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  organization: string;
}

export interface UserFollowSummary {
  id: string;
  email?: string | null;
  walletAddress?: string | null;
  displayName?: string | null;
  username?: string | null;
  nftPfpUrl?: string | null;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  walletAddress: string | null;
  pfp?: string;
  avatar?: string | null;
  profile?: {
    avatarUrl?: string;
  };
  nftPfpUrl: string | null;
  nftPfpContractAddress: string | null;
  nftPfpTokenId: string | null;
  bio?: string | null;
  location?: string | null;
  pronouns?: string | null;
  profilePrivacy?: 'public' | 'private';
  tagReviewEnabled?: boolean;
  postVisibility?: PostVisibility;
  friendRequestPrivacy?: FriendRequestPrivacy;
  emailSearchPrivacy?: EmailSearchPrivacy;
  commentPrivacy?: CommentPrivacy;
  tagPrivacy?: TagPrivacy;
  messagePrivacy?: MessagePrivacy;
  followers?: UserFollowSummary[];
  blockedUsers?: UserFollowSummary[];
  favorites?: UserFollowSummary[];
  following: { id: string }[];
  posts?: Post[];
  featuredPosts?: Post[];
  categoryLabel?: string;
  isProfessional?: boolean;
  website?: string | null;
  contact?: {
      email?: string;
      phone?: string;
      directions?: string;
    };
    followStatus?: 'following' | 'requested' | 'not_following';
    profileTheme?: string;
    profileThemeColor?: string;
  // Professional profile fields
  professionalProfile?: ProfessionalProfile;
  verified?: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  idDocumentUrl?: string;
  verificationSubmittedAt?: string;
  isPremium?: boolean;
  subscription?: {
    active: boolean;
    tier?: string;
    expiresAt?: string;
  };
  notificationSettings?: {
    emailNotifications?: boolean;
    likes?: boolean;
    comments?: boolean;
    newFollowers?: boolean;
  };
  followedHashtags?: { id: string; name: string }[];
  blockedKeywords?: string[];
  blockedHashtags?: string[];
  lifeEvents?: LifeEvent[];
  screenshotProtection?: ScreenshotProtectionSettings;
  relationshipStatus?: string;
  profileBioFont?: string;
  name?: string;
}

export interface PostAuthor {
  id: string;
  email: string | null;
  walletAddress: string | null;
  username?: string;
  displayName?: string | null;
  publicKey?: string;
  profile?: {
    avatarUrl?: string;
  };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: PostAuthor;
  parentId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  replies?: Comment[];
  awards?: {
    id: string;
    gift: { id: string; name: string; iconUrl: string };
    sender: PostAuthor;
  }[];
}

export interface PostLike {
  id: string;
  user: { id: string };
}

export interface EmotionData {
  joy: number;
  sadness: number;
  excitement: number;
  calm: number;
  anger: number;
  surprise: number;
  love: number;
  fear: number;
}

export interface ContextualData {
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  timestamp: string;
  activity?: string;
  sensoryCues?: string[];
}

export interface NeuralMessageMetadata {
  emotions: EmotionData;
  context: ContextualData;
  rawNeuralSignal?: string; // For advanced processing
}

export interface Place {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface FitnessSegment {
  id: string;
  name: string;
  description?: string;
  type: 'run' | 'ride' | 'swim' | 'hike' | 'walk';
  distance: number; // in kilometers
  startLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  city: string;
  country: string;
  averageElevation?: number;
  elevationGain?: number;
  createdBy: string; // user id
  createdAt: string;
}

export interface SegmentAttempt {
  id: string;
  segmentId: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto: string;
  };
  duration: number; // in seconds
  pace: number; // km/h
  createdAt: string;
  isPR: boolean; // personal record
}

export interface SegmentLeaderboardEntry {
  attemptId: string;
  segmentId: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto: string;
  };
  duration: number;
  pace: number;
  rank: number;
  createdAt: string;
}

export interface SegmentLeaderboard {
  segment: FitnessSegment;
  overall: SegmentLeaderboardEntry[];
  local: SegmentLeaderboardEntry[]; // users within 50km
  women?: SegmentLeaderboardEntry[];
  thisMonth?: SegmentLeaderboardEntry[];
}

export interface AutoTag {
  id: string;
  name: string;
  category: 'topic' | 'genre' | 'format';
  confidence: number;
}

export interface PostEditHistory {
  id: string;
  content: string;
  editedAt: string;
}

export interface SensoryData {
  visual?: { url: string; type: string }[]; // What you saw - photos/videos
  audio?: { url: string; type: string }[]; // What you heard - audio recordings
  haptic?: { type: string; intensity: number }[]; // What you felt - touch sensations
  olfactory?: { name: string; intensity: number }[]; // What you smelled
  gustatory?: { name: string; intensity: number }[]; // What you tasted
}

export interface MemoryMetadata {
  emotions: EmotionData;
  context: ContextualData;
  sensory: SensoryData;
  neuralTimestamp: string; // Exact brain capture timestamp
  privacySettings: {
    allowReplay: boolean;
    allowDownload: boolean;
    expiresAt?: string; // Optional memory expiration
  };
}

export type RealityContext = 'physical' | 'augmented' | 'virtual' | 'neural';

export interface CrossRealityPort {
  id: string;
  sourceReality: RealityContext;
  targetReality: RealityContext;
  contextNote?: string;
  fidelity: string;
  portedAt: string;
  contentSnapshot: string;
  memoryMetadataSnapshot?: MemoryMetadata;
  timeCapsuleUnlockAt?: string | null;
  timeCapsuleRecipients?: string[];
}

export enum MemoryEditType {
  CONTEXT = 'context',
  ANNOTATION = 'annotation',
  SENSORY_ENHANCEMENT = 'sensory_enhancement',
}

export interface MemoryEditRevision {
  id: string;
  memoryId: string;
  editorId?: string;
  editType: MemoryEditType;
  title?: string;
  annotation?: string;
  sensoryNote?: string;
  sensoryEnhancements?: Partial<SensoryData>;
  contextNote?: string;
  createdAt: string;
  editor?: PostAuthor;
}

export interface Post {
  id: string;
  content: string;
  videoUrl?: string;
  media?: { url: string; type: 'image' | 'video' }[];
  filter?: string;
  createdAt: string;
  updatedAt?: string;
  editHistory?: PostEditHistory[];
  visibility: 'public' | 'private' | 'unlisted' | 'profile_only';
  isFeatured?: boolean;
  isSensitive?: boolean;
  requiresScreenshotProtection?: boolean;
  user: PostAuthor;
  author: {
    displayName: string;
    profilePhoto: string;
  };
  likes: PostLike[];
  comments: Comment[];
  bookmarked?: boolean;
  shareCount?: number;
  viewCount?: number;
  /** X-style quote post: the post this one quotes (null author/content if deleted). */
  quotedPost?: Post | null;
  quoteCount?: number;
  place?: Place;
  distance?: number; // Distance from user's location (for local feed)
  autoTags?: AutoTag[]; // AI-generated auto-tags for content categorization
  isMemory?: boolean; // Flag if this post is a shared memory
  isDraft?: boolean;
  realityContext?: RealityContext;
  memoryMetadata?: MemoryMetadata; // Full sensory and emotional metadata for memories
  memoryRevisions?: MemoryEditRevision[];
  timeCapsuleUnlockAt?: string | null;
  timeCapsuleUnlockedAt?: string | null;
  timeCapsuleRecipients?: string[];
  timeCapsuleMessage?: string;
  crossRealityPorts?: CrossRealityPort[];
  authenticityAnalysis?: {
    score: number;
    verdict: 'likely_authentic' | 'likely_synthetic' | 'needs_review';
    signals: string[];
    confidence: number;
  };
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  sender: PostAuthor;
  /** Legacy alias for sender used by some community/neural message views. */
  user?: PostAuthor;
  replyTo?: Message;
  replies?: Comment[];
  readBy: ReadReceipt[];
  reactions?: { id: string; reaction: string; user: PostAuthor }[];
  media?: { url: string; type: 'image' | 'video' | 'audio' }[];
  /** Voice note metadata: set when the message is a recorded voice message. */
  voiceNote?: { durationSeconds: number; waveform: number[] } | null;
  gift?: { id: string; name: string; imageUrl: string; message?: string };
  /** Original message when this one was forwarded from another conversation. */
  forwardedFrom?: PostAuthor | null;
  isPinned?: boolean;
  isNeural?: boolean;
  neuralMetadata?: NeuralMessageMetadata;
}

export interface ReadReceipt {
  id: string;
  user: PostAuthor;
  readAt: string;
}

export interface Conversation {
  id: string;
  name?: string | null;
  participants: PostAuthor[];
  vanishMode: boolean;
  /** Disappearing messages TTL in seconds; null when off. */
  messageTtlSeconds: number | null;
  lastMessage?: { content: string; createdAt: string };
}

export interface User {
  id: string;
  username: string;
  email: string;
  publicKey?: string; // Base64 encoded public key for E2EE
  profile: {
    avatarUrl: string;
    displayName?: string | null;
  };
}

interface PollData {
  question: string;
  options: string[];
}

interface QAData {
  question: string;
}

interface StickerData {
  stickerId: string;
  position: { x: number; y: number };
}

export interface StoryElement {
  id: string;
  type: 'poll' | 'qa' | 'sticker';
  data: PollData | QAData | StickerData;
}

export interface Story {
  id: string;
  mediaUrl: string;
  createdAt: string;
  expiresAt: string;
  user: PostAuthor;
  elements?: StoryElement[];
  reactions?: StoryReaction[];
  replies?: StoryReply[];
  isBoosted?: boolean;
}

export interface StoryReaction {
  id: string;
  reaction: string;
  user: PostAuthor;
}

export interface StoryReply {
  id: string;
  text: string;
  user: PostAuthor;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  postCount?: number;
}

export interface ReelEffect {
  id: string;
  name: string;
  thumbnailUrl: string;
}

export interface PageConversation {
  id: string;
  page: { id: string; name: string };
  participants: User[];
  messages: PageMessage[];
}

export interface PageMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: User;
}

export interface Group {
  id: string;
  name: string;
  memberCount?: number;
}

// Forum-style discussion types (Reddit-style communities/threads)
export interface CommunityFlair {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export interface ThreadFlair {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export interface CommunityChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'stage' | 'forum';
  description?: string;
  isPrivate: boolean;
  position: number;
  categoryId?: string;
}

export interface CommunityChannelCategory {
  id: string;
  name: string;
  position: number;
}

export interface StageParticipant {
  userId: string;
  isSpeaker: boolean;
  isMuted: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: PostAuthor;
  members: { id: string; role: 'owner' | 'moderator' | 'member' }[];
  rules?: { title: string; description: string }[];
  flairs: CommunityFlair[];
  iconUrl?: string;
  bannerUrl?: string;
  isPrivate: boolean;
  isNsfw: boolean;
  memberCount: number;
  onlineCount: number;
  // Discord-style server features
  categories: CommunityChannelCategory[];
  channels: CommunityChannel[];
  activeVoiceChannels: { [channelId: string]: string[] }; // user IDs in voice channel
  activeStageChannels: { [channelId: string]: StageParticipant[] }; // participants in stage channel
  // Local community features (Nextdoor-style)
  communityType?: 'general' | 'local' | 'professional' | 'fan' | 'other';
  location?: {
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    radius: number; // neighborhood radius in miles
  };
  localBusinessListings?: LocalBusinessListing[];
  neighborhoodAlerts?: NeighborhoodAlert[];
  lostAndFoundPosts?: LostAndFoundPost[];
  classifieds?: ClassifiedListing[];
  // Professional community features (LinkedIn-style)
  jobListings?: JobListing[];
  professionalProfiles?: { userId: string; profile: ProfessionalProfile }[];
  industryTags?: string[];
}

// Local community specific types
export interface LocalBusinessListing {
  id: string;
  businessName: string;
  description: string;
  address: string;
  phone?: string;
  website?: string;
  category: string; // restaurant, grocery, retail, services, etc.
  rating?: number;
  reviewCount: number;
  createdAt: string;
  addedBy: string; // user ID
}

export interface NeighborhoodAlert {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
  isUrgent: boolean;
  expiresAt?: string;
}

// Professional community specific types (LinkedIn-style)
export interface Skill {
  id: string;
  name: string;
  category: string; // e.g., Software Development, Marketing, Design
}

export interface SkillEndorsement {
  id: string;
  skillId: string;
  endorserId: string; // User who gave the endorsement
  endorserName: string;
  comment?: string;
  endorsedAt: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'remote' | 'hybrid';
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  postedBy: string; // User ID who posted the job
  postedAt: string;
  applicationUrl?: string;
  applications: JobApplication[];
}

export interface JobApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  resumeUrl?: string;
  coverLetter?: string;
  appliedAt: string;
  status: 'pending' | 'reviewing' | 'interviewing' | 'accepted' | 'rejected';
}

export interface SkillAssessment {
  assessmentId: string;
  skillId: string;
  skillName: string;
  score: number;
  passed: boolean;
  completedAt: string;
  questions: SkillAssessmentQuestion[];
}

export interface SkillAssessmentQuestion {
  questionId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
}

export const SKILL_ASSESSMENTS: Record<string, {
  skillName: string;
  questions: Omit<SkillAssessmentQuestion, 'questionId'>[];
}> = {
  'javascript': {
    skillName: 'JavaScript',
    questions: [
      {
        question: 'What is the output of typeof null?',
        options: ['"null"', '"object"', '"undefined"', '"number"'],
        correctAnswer: '"object"'
      },
      {
        question: 'Which method creates a new array with all elements that pass the test implemented by the provided function?',
        options: ['forEach()', 'map()', 'filter()', 'reduce()'],
        correctAnswer: 'filter()'
      },
      {
        question: 'What is closure in JavaScript?',
        options: ['A way to close browser tabs', 'A function that has access to its lexical scope', 'A CSS property', 'A database connection method'],
        correctAnswer: 'A function that has access to its lexical scope'
      }
    ]
  },
  'react': {
    skillName: 'React',
    questions: [
      {
        question: 'What hook is used to manage state in a functional component?',
        options: ['useEffect()', 'useState()', 'useContext()', 'useReducer()'],
        correctAnswer: 'useState()'
      },
      {
        question: 'What is the virtual DOM?',
        options: ['A direct copy of the browser DOM', 'A lightweight JavaScript representation of the UI', 'A CSS-in-JS library', 'A testing framework'],
        correctAnswer: 'A lightweight JavaScript representation of the UI'
      },
      {
        question: 'When does useEffect run?',
        options: ['Only on component mount', 'After render cycle, based on dependencies', 'Before component renders', 'Never'],
        correctAnswer: 'After render cycle, based on dependencies'
      }
    ]
  },
  'python': {
    skillName: 'Python',
    questions: [
      {
        question: 'What is the output of print(type([]))?',
        options: ['<class \'tuple\'>', '<class \'list\'>', '<class \'array\'>', '<class \'collection\'>'],
        correctAnswer: '<class \'list\'>'
      },
      {
        question: 'Which keyword is used to define a function in Python?',
        options: ['function', 'def', 'func', 'define'],
        correctAnswer: 'def'
      },
      {
        question: 'What is a lambda function?',
        options: ['A function that sends emails', 'An anonymous function', 'A class method', 'A database query'],
        correctAnswer: 'An anonymous function'
      }
    ]
  },
  'sql': {
    skillName: 'SQL',
    questions: [
      {
        question: 'Which SQL statement is used to retrieve data from a database?',
        options: ['GET', 'RETRIEVE', 'SELECT', 'FETCH'],
        correctAnswer: 'SELECT'
      },
      {
        question: 'What clause is used to filter records?',
        options: ['SORT', 'ORDER', 'WHERE', 'FILTER'],
        correctAnswer: 'WHERE'
      },
      {
        question: 'Which join returns all records from both tables matching on a condition?',
        options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN'],
        correctAnswer: 'INNER JOIN'
      }
    ]
  }
};

export const AVAILABLE_SKILL_ASSESSMENTS = Object.entries(SKILL_ASSESSMENTS).map(([id, data]) => ({
  skillId: id,
  skillName: data.skillName
}));

export interface ProfessionalProfile {
  userId: string;
  headline: string; // e.g., "Senior Software Engineer at Tech Corp"
  currentCompany?: string;
  industry: string;
  location: string;
  about: string;
  experience: WorkExperience[];
  education: Education[];
  skills: { skillId: string; name: string; endorsements: SkillEndorsement[]; assessment?: SkillAssessment }[];
  certifications: Certification[];
  projects: Project[];
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate?: string; // Current if not present
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  url?: string;
  startDate: string;
  endDate?: string;
}

export interface LostAndFoundPost {
  id: string;
  title: string;
  description: string;
  isLost: boolean; // true = lost, false = found
  location: string;
  contactInfo?: string;
  media?: { url: string; type: 'image' }[];
  createdAt: string;
  createdBy: string;
  isResolved: boolean;
}

export interface ClassifiedListing {
  id: string;
  title: string;
  description: string;
  price?: number;
  category: string; // for sale, free, housing, jobs, services
  contactInfo?: string;
  media?: { url: string; type: 'image' }[];
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: PostAuthor;
  communityId: string;
  flairs: ThreadFlair[];
  isPinned: boolean;
  isLocked: boolean;
  isMegathread: boolean;
  upvotes: { id: string }[];
  downvotes: { id: string }[];
  comments: Comment[];
  media?: { url: string; type: 'image' | 'video' }[];
  viewCount: number;
}

export interface Product {
  id: string;
  title: string;
  price?: number;
  imageUrls?: string[];
}

export interface NftMetadata {
  blockchain: string;
  contractAddress: string;
  tokenId: string;
  isLimitedEdition?: boolean;
  editionNumber?: number;
  totalEditions?: number;
}

export interface MarketplaceSeller {
  id: string;
  displayName: string;
  avatar?: string;
}

export interface MarketplaceListing {
  id: string;
  title: string;
  description?: string;
  price: number;
  location?: string;
  imageUrls?: string[];
  productType?: string;
  nftMetadata?: NftMetadata;
  seller: MarketplaceSeller;
}

export interface SavedListing {
  id?: string;
  listing: MarketplaceListing;
}

export interface SellerProduct {
  id: string;
  name: string;
  imageUrls?: string[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  productVariant: { name: string };
}

export interface Order {
  id: string;
  total: number;
  status: string;
  items: OrderItem[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  [key: string]: unknown;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'CLEAR_CART' };

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  bookmarks: { id?: string; post: Post }[];
}