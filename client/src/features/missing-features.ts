/**
 * Unimplemented feature stubs.
 *
 * NONE of the features below are built. Each one used to return
 * `{ status: 'implemented' }` from an empty function, which made this file a
 * feature checklist that lied — it looked like coverage and was padding. Per
 * ROADMAP.md §5.3, "no mocked data presented as real."
 *
 * The named exports are kept so existing imports keep resolving, but they now
 * report `status: 'not_implemented'`. Nothing here is wired into a route or a
 * page. Delete this file when you are done with it; adding a real feature means
 * writing the component, not filling in a registry entry.
 *
 * `status` is typed as a union that still permits `'implemented'` so that any
 * existing consumer comparing against that literal keeps compiling — it just
 * receives the truthful value at runtime.
 */

export type FeatureStatus = 'implemented' | 'not_implemented';

export interface FeatureStub {
  feature: string;
  status: FeatureStatus;
}

const stub = (feature: string): FeatureStub => ({ feature, status: 'not_implemented' });

// ---------------------------------------------------------------------------
// Account lifecycle — genuinely implemented. Kept as real, with pointers to
// the code that actually does the work so this stays auditable rather than
// merely asserted.
// ---------------------------------------------------------------------------

/** `client/src/contexts/AuthContext.tsx` (switchAccount/addAccount) */
export const AccountSwitching = () => stub('Account Switching');
/** `server/src/features/account-management/` + `client/src/pages/settings.tsx` */
export const AccountDeactivation = () => stub('Account Deactivation');
/** `server/src/features/account-management/` + `client/src/pages/account-status.tsx` */
export const AccountReactivation = () => stub('Account Reactivation');
/** `server/src/features/account-management/` */
export const AccountPermissions = () => stub('Account Permissions');
/** `client/src/contexts/PreferencesContext.tsx` */
export const PersonalizationControls = () => stub('Personalization Controls');

// ---------------------------------------------------------------------------
// Not implemented
// ---------------------------------------------------------------------------

// Profile
export const ProfileLayouts = () => stub('Profile Layouts');
export const ProfileWidgets = () => stub('Profile Widgets');

// Social graph
export const SuggestedProfiles = () => stub('Suggested Profiles');
export const PeopleYouMayKnow = () => stub('People You May Know');
export const MutualConnections = () => stub('Mutual Connections');
export const NearbyProfiles = () => stub('Nearby Profiles');
export const ConnectionSuggestions = () => stub('Connection Suggestions');

// Feed & discovery
export const FreshnessRanking = () => stub('Freshness Ranking');
export const DiversityControls = () => stub('Diversity Controls');
export const QualitySignals = () => stub('Quality Signals');
export const NotInterested = () => stub('Not Interested');
export const LearningFeed = () => stub('Learning Feed');
export const HideCreators = () => stub('Hide Creators');
export const RecommendationControls = () => stub('Recommendation Controls');

// Video & media
export const VideoChapters = () => stub('Video Chapters');
export const Thumbnails = () => stub('Thumbnails');
export const Playlists = () => stub('Playlists');
export const Premieres = () => stub('Premieres');
export const SpeedControls = () => stub('Speed Controls');
export const VerticalPlayer = () => stub('Vertical Player');
export const SwipeNavigation = () => stub('Swipe Navigation');

// Stories
export const StoryQuizzes = () => stub('Story Quizzes');
export const CollaborativeStories = () => stub('Collaborative Stories');
export const StoryHiding = () => stub('Story Hiding');
export const HighlightCovers = () => stub('Highlight Covers');

// Messaging
export const ArchiveChats = () => stub('Archive Chats');
export const MuteChats = () => stub('Mute Chats');
export const PinChats = () => stub('Pin Chats');
export const MessageFolders = () => stub('Message Folders');
export const SuggestedChats = () => stub('Suggested Chats');

// Video calling
export const GalleryView = () => stub('Gallery View');
export const ParticipantManagement = () => stub('Participant Management');
export const WaitingRoom = () => stub('Waiting Room');
export const Whiteboard = () => stub('Whiteboard');
export const BreakoutRooms = () => stub('Breakout Rooms');
export const Attendance = () => stub('Attendance');

// Community
export const ForumCreation = () => stub('Forum Creation');
export const Subforums = () => stub('Subforums');
export const ThreadPinning = () => stub('Thread Pinning');
export const ThreadLocking = () => stub('Thread Locking');
export const ClubCreation = () => stub('Club Creation');
export const ClubAnalytics = () => stub('Club Analytics');

// Monetization
export const MembershipsFeature = () => stub('Paid Membership');
export const TieredMemberships = () => stub('Tiered Memberships');
export const MembershipBenefits = () => stub('Membership Benefits');
export const SubscriptionPricing = () => stub('Subscription Pricing');
export const TipAmounts = () => stub('Tip Amounts');
export const TipLeaderboards = () => stub('Tip Leaderboards');
export const PaidVideos = () => stub('Paid Videos');
export const Paywall = () => stub('Paywall');
export const SponsorshipRequests = () => stub('Sponsorship Requests');

// AI & content generation
export const MultilingualChat = () => stub('Multilingual Chat');
export const ImageUnderstanding = () => stub('Image Understanding');
export const FileUnderstanding = () => stub('File Understanding');
export const Brainstorming = () => stub('Brainstorming');
export const TaskPlanning = () => stub('Task Planning');

// Search
export const ConversationalSearch = () => stub('Conversational Search');
export const QueryRefinement = () => stub('Query Refinement');
export const SearchSummaries = () => stub('Search Summaries');
export const SearchAnswers = () => stub('Search Answers');
export const SearchComparisons = () => stub('Search Comparisons');
export const KnowledgePanels = () => stub('Knowledge Panels');

// Business & services
export const AppointmentBooking = () => stub('Appointment Booking');
export const LeadScoring = () => stub('Lead Scoring');
export const DealManagement = () => stub('Deal Management');
export const FreelancerProfiles = () => stub('Freelancer Profile');
export const ProjectManagement = () => stub('Project Invitations');
export const ProposalTemplates = () => stub('Proposal Templates');
export const AuctionCreation = () => stub('Auction Creation');
export const RentalListings = () => stub('Rental Listings');

// Safety & detection
// NOTE: no detection model is wired up anywhere. The server equivalent
// (`server/src/features/safety/safety.service.ts`) returns hardcoded
// `false`/`0` from every method, and
// `server/src/advanced-features/advanced-features.controller.ts` now reports
// `deepfakeDetection.supported = false` to match.
export const SceneDetection = () => stub('Scene Detection');
export const DeepfakeDetection = () => stub('Dangerous Content Detection');
export const ImpersonationDetection = () => stub('Impersonation Detection');
export const FakeAccountDetection = () => stub('Fake Account Detection');
export const CoordinatedAbuseDetection = () => stub('Coordinated Abuse Detection');
export const ScamDetection = () => stub('Scam Links');
export const PhishingDetection = () => stub('Phishing');
export const FraudDetection = () => stub('Fraud Risk');

// Content moderation
export const BulkModeration = () => stub('Bulk Moderation');
export const RolePermissions = () => stub('Role Permissions');
export const RuleVersioning = () => stub('Rule Versioning');
export const EscalationPolicies = () => stub('Escalation');
export const ReputationLevels = () => stub('Reputation Levels');

// Analytics & insights
export const CreatorAnalytics = () => stub('Audience Retention');
export const AudienceAnalytics = () => stub('Audience Overlap');
export const FinancialReports = () => stub('Financial Reports');
export const RetentionAnalytics = () => stub('Retention');
export const GrowthPredictions = () => stub('Growth Predictions');

// Advanced
export const VoiceDubbing = () => stub('Voice Dubbing');
export const MemoryManagement = () => stub('Memory Retrieval');
export const TranslationVersions = () => stub('Translation Versions');
export const AutoCutting = () => stub('Auto Cutting');
export const SmartReframing = () => stub('Smart Reframing');

/** Every stub, for the (unimplemented) feature-status registry. */
export const unimplementedFeatures: readonly FeatureStub[] = [
  AccountSwitching(),
  AccountDeactivation(),
  AccountReactivation(),
  AccountPermissions(),
  PersonalizationControls(),
  ProfileLayouts(),
  ProfileWidgets(),
  SuggestedProfiles(),
  PeopleYouMayKnow(),
  MutualConnections(),
  NearbyProfiles(),
  ConnectionSuggestions(),
  FreshnessRanking(),
  DiversityControls(),
  QualitySignals(),
  NotInterested(),
  LearningFeed(),
  HideCreators(),
  RecommendationControls(),
  VideoChapters(),
  Thumbnails(),
  Playlists(),
  Premieres(),
  SpeedControls(),
  VerticalPlayer(),
  SwipeNavigation(),
  StoryQuizzes(),
  CollaborativeStories(),
  StoryHiding(),
  HighlightCovers(),
  ArchiveChats(),
  MuteChats(),
  PinChats(),
  MessageFolders(),
  SuggestedChats(),
  GalleryView(),
  ParticipantManagement(),
  WaitingRoom(),
  Whiteboard(),
  BreakoutRooms(),
  Attendance(),
  ForumCreation(),
  Subforums(),
  ThreadPinning(),
  ThreadLocking(),
  ClubCreation(),
  ClubAnalytics(),
  MembershipsFeature(),
  TieredMemberships(),
  MembershipBenefits(),
  SubscriptionPricing(),
  TipAmounts(),
  TipLeaderboards(),
  PaidVideos(),
  Paywall(),
  SponsorshipRequests(),
  MultilingualChat(),
  ImageUnderstanding(),
  FileUnderstanding(),
  Brainstorming(),
  TaskPlanning(),
  ConversationalSearch(),
  QueryRefinement(),
  SearchSummaries(),
  SearchAnswers(),
  SearchComparisons(),
  KnowledgePanels(),
  AppointmentBooking(),
  LeadScoring(),
  DealManagement(),
  FreelancerProfiles(),
  ProjectManagement(),
  ProposalTemplates(),
  AuctionCreation(),
  RentalListings(),
  SceneDetection(),
  DeepfakeDetection(),
  ImpersonationDetection(),
  FakeAccountDetection(),
  CoordinatedAbuseDetection(),
  ScamDetection(),
  PhishingDetection(),
  FraudDetection(),
  BulkModeration(),
  RolePermissions(),
  RuleVersioning(),
  EscalationPolicies(),
  ReputationLevels(),
  CreatorAnalytics(),
  AudienceAnalytics(),
  FinancialReports(),
  RetentionAnalytics(),
  GrowthPredictions(),
  VoiceDubbing(),
  MemoryManagement(),
  TranslationVersions(),
  AutoCutting(),
  SmartReframing(),
] as const;

export default {
  AccountSwitching,
  AccountDeactivation,
  AccountReactivation,
  AccountPermissions,
  PersonalizationControls,
  ProfileLayouts,
  ProfileWidgets,
  SuggestedProfiles,
  PeopleYouMayKnow,
  MutualConnections,
  NearbyProfiles,
  ConnectionSuggestions,
  FreshnessRanking,
  DiversityControls,
  QualitySignals,
  NotInterested,
  LearningFeed,
  HideCreators,
  RecommendationControls,
  VideoChapters,
  Thumbnails,
  Playlists,
  Premieres,
  SpeedControls,
  VerticalPlayer,
  SwipeNavigation,
  StoryQuizzes,
  CollaborativeStories,
  StoryHiding,
  HighlightCovers,
  ArchiveChats,
  MuteChats,
  PinChats,
  MessageFolders,
  SuggestedChats,
  GalleryView,
  ParticipantManagement,
  WaitingRoom,
  Whiteboard,
  BreakoutRooms,
  Attendance,
  ForumCreation,
  Subforums,
  ThreadPinning,
  ThreadLocking,
  ClubCreation,
  ClubAnalytics,
  MembershipsFeature,
  TieredMemberships,
  MembershipBenefits,
  SubscriptionPricing,
  TipAmounts,
  TipLeaderboards,
  PaidVideos,
  Paywall,
  SponsorshipRequests,
  MultilingualChat,
  ImageUnderstanding,
  FileUnderstanding,
  Brainstorming,
  TaskPlanning,
  ConversationalSearch,
  QueryRefinement,
  SearchSummaries,
  SearchAnswers,
  SearchComparisons,
  KnowledgePanels,
  AppointmentBooking,
  LeadScoring,
  DealManagement,
  FreelancerProfiles,
  ProjectManagement,
  ProposalTemplates,
  AuctionCreation,
  RentalListings,
  SceneDetection,
  DeepfakeDetection,
  ImpersonationDetection,
  FakeAccountDetection,
  CoordinatedAbuseDetection,
  ScamDetection,
  PhishingDetection,
  FraudDetection,
  BulkModeration,
  RolePermissions,
  RuleVersioning,
  EscalationPolicies,
  ReputationLevels,
  CreatorAnalytics,
  AudienceAnalytics,
  FinancialReports,
  RetentionAnalytics,
  GrowthPredictions,
  VoiceDubbing,
  MemoryManagement,
  TranslationVersions,
  AutoCutting,
  SmartReframing,
};
