/**
 * Unimplemented feature placeholders.
 *
 * Every component here renders a placeholder. They are not partial
 * implementations and there is no work-in-progress behind them — they are
 * here so the named exports keep resolving.
 *
 * The previous wording was "X - Pending Implementation", which implied a
 * commitment to ship. It also contradicted `../features/missing-features.ts`,
 * which reported the same features as `status: 'implemented'`. Both now say
 * the same truthful thing: this does not exist.
 *
 * If you find one of these rendered in the product, that is a bug — nothing
 * should be showing a placeholder to a user. See ROADMAP.md §5.3.
 */

import React from 'react';

/** The single honest rendering for an unbuilt feature. */
const NotBuilt: React.FC<{ name: string }> = ({ name }) => (
  <div className="rounded-2xl border border-dashed border-dark-300 bg-dark-50/60 p-4 text-sm text-dark-600 dark:border-dark-600 dark:bg-dark-900/40 dark:text-dark-300">
    <p className="font-semibold">{name}</p>
    <p className="mt-1">This feature isn&apos;t built. It isn&apos;t in progress either.</p>
  </div>
);

// Account lifecycle. These features ARE real, but not here — use
// `AuthContext` (switchAccount / addAccount) and `pages/settings.tsx` +
// `pages/account-status.tsx`. These placeholders implement nothing.
export const AccountSwitchingComponent: React.FC = () => (
  <NotBuilt name="Account Switching" />
);
export const AccountDeactivationComponent: React.FC = () => (
  <NotBuilt name="Account Deactivation" />
);

// Profile
export const ProfileLayoutsComponent: React.FC = () => <NotBuilt name="Profile Layouts" />;
export const ProfileWidgetsComponent: React.FC = () => <NotBuilt name="Profile Widgets" />;

// Social discovery
export const SuggestedProfilesComponent: React.FC = () => <NotBuilt name="Suggested Profiles" />;
export const PeopleYouMayKnowComponent: React.FC = () => <NotBuilt name="People You May Know" />;
export const MutualConnectionsComponent: React.FC = () => <NotBuilt name="Mutual Connections" />;
export const NearbyProfilesComponent: React.FC = () => <NotBuilt name="Nearby Profiles" />;

// Feed & discovery
export const FreshnessRankingComponent: React.FC = () => <NotBuilt name="Freshness Ranking" />;
export const DiversityControlsComponent: React.FC = () => <NotBuilt name="Diversity Controls" />;
export const QualitySignalsComponent: React.FC = () => <NotBuilt name="Quality Signals" />;
export const LearningFeedComponent: React.FC = () => <NotBuilt name="Learning Feed" />;
export const HideCreatorsComponent: React.FC = () => <NotBuilt name="Hide Creators" />;

// Video & media
export const VideoChaptersComponent: React.FC = () => <NotBuilt name="Video Chapters" />;
export const PlaylistsComponent: React.FC = () => <NotBuilt name="Playlists" />;
export const PremiersComponent: React.FC = () => <NotBuilt name="Premieres" />;
export const VerticalPlayerComponent: React.FC = () => <NotBuilt name="Vertical Player" />;
export const SwipeNavigationComponent: React.FC = () => <NotBuilt name="Swipe Navigation" />;

// Stories
export const StoryQuizzesComponent: React.FC = () => <NotBuilt name="Story Quizzes" />;
export const CollaborativeStoriesComponent: React.FC = () => <NotBuilt name="Collaborative Stories" />;
export const HighlightCoversComponent: React.FC = () => <NotBuilt name="Highlight Covers" />;

// Messaging
export const ArchiveChatsComponent: React.FC = () => <NotBuilt name="Archive Chats" />;
export const MuteChatsComponent: React.FC = () => <NotBuilt name="Mute Chats" />;
export const PinChatsComponent: React.FC = () => <NotBuilt name="Pin Chats" />;
export const MessageFoldersComponent: React.FC = () => <NotBuilt name="Message Folders" />;

// Video calling
export const GalleryViewComponent: React.FC = () => <NotBuilt name="Gallery View" />;
export const ParticipantManagementComponent: React.FC = () => <NotBuilt name="Participant Management" />;
export const WaitingRoomComponent: React.FC = () => <NotBuilt name="Waiting Room" />;
export const WhiteboardComponent: React.FC = () => <NotBuilt name="Whiteboard" />;
export const BreakoutRoomsComponent: React.FC = () => <NotBuilt name="Breakout Rooms" />;

// Community
export const ForumCreationComponent: React.FC = () => <NotBuilt name="Forum Creation" />;
export const SubforumsComponent: React.FC = () => <NotBuilt name="Subforums" />;
export const ThreadPinningComponent: React.FC = () => <NotBuilt name="Thread Pinning" />;
export const ClubCreationComponent: React.FC = () => <NotBuilt name="Club Creation" />;
export const ClubAnalyticsComponent: React.FC = () => <NotBuilt name="Club Analytics" />;

// Monetization
export const MembershipsComponent: React.FC = () => <NotBuilt name="Paid Membership" />;
export const SubscriptionPricingComponent: React.FC = () => <NotBuilt name="Subscription Pricing" />;
export const TipAmountsComponent: React.FC = () => <NotBuilt name="Tip Amounts" />;
export const TipLeaderboardsComponent: React.FC = () => <NotBuilt name="Tip Leaderboards" />;
export const PaywallComponent: React.FC = () => <NotBuilt name="Paywall" />;
export const SponsorshipRequestsComponent: React.FC = () => <NotBuilt name="Sponsorship Requests" />;

// AI
export const MultilingualChatComponent: React.FC = () => <NotBuilt name="Multilingual Chat" />;
export const BrainstormingComponent: React.FC = () => <NotBuilt name="Brainstorming" />;
export const TaskPlanningComponent: React.FC = () => <NotBuilt name="Task Planning" />;

// Search
export const ConversationalSearchComponent: React.FC = () => <NotBuilt name="Conversational Search" />;
export const SearchSummariesComponent: React.FC = () => <NotBuilt name="Search Summaries" />;
export const SearchAnswersComponent: React.FC = () => <NotBuilt name="Search Answers" />;
export const KnowledgePanelsComponent: React.FC = () => <NotBuilt name="Knowledge Panels" />;

// Business
export const AppointmentBookingComponent: React.FC = () => <NotBuilt name="Appointment Booking" />;
export const LeadScoringComponent: React.FC = () => <NotBuilt name="Lead Scoring" />;
export const FreelancerProfilesComponent: React.FC = () => <NotBuilt name="Freelancer Profile" />;
export const ProposalTemplatesComponent: React.FC = () => <NotBuilt name="Proposal Templates" />;
export const AuctionCreationComponent: React.FC = () => <NotBuilt name="Auction Creation" />;
export const RentalListingsComponent: React.FC = () => <NotBuilt name="Rental Listings" />;

// Safety. No detection model is wired up on the server either — see
// `server/src/features/safety/safety.service.ts`, which returns hardcoded
// false/0 from every method.
export const DeepfakeDetectionComponent: React.FC = () => <NotBuilt name="Deepfake Detection" />;
export const ImpersonationDetectionComponent: React.FC = () => <NotBuilt name="Impersonation Detection" />;
export const FraudDetectionComponent: React.FC = () => <NotBuilt name="Fraud Detection" />;

// Analytics
export const CreatorAnalyticsComponent: React.FC = () => <NotBuilt name="Creator Analytics" />;
export const FinancialReportsComponent: React.FC = () => <NotBuilt name="Financial Reports" />;
export const GrowthPredictionsComponent: React.FC = () => <NotBuilt name="Growth Predictions" />;

export default {
  AccountSwitchingComponent,
  AccountDeactivationComponent,
  ProfileLayoutsComponent,
  ProfileWidgetsComponent,
  SuggestedProfilesComponent,
  PeopleYouMayKnowComponent,
  MutualConnectionsComponent,
  NearbyProfilesComponent,
  FreshnessRankingComponent,
  DiversityControlsComponent,
  QualitySignalsComponent,
  LearningFeedComponent,
  HideCreatorsComponent,
  VideoChaptersComponent,
  PlaylistsComponent,
  PremiersComponent,
  VerticalPlayerComponent,
  SwipeNavigationComponent,
  StoryQuizzesComponent,
  CollaborativeStoriesComponent,
  HighlightCoversComponent,
  ArchiveChatsComponent,
  MuteChatsComponent,
  PinChatsComponent,
  MessageFoldersComponent,
  GalleryViewComponent,
  ParticipantManagementComponent,
  WaitingRoomComponent,
  WhiteboardComponent,
  BreakoutRoomsComponent,
  ForumCreationComponent,
  SubforumsComponent,
  ThreadPinningComponent,
  ClubCreationComponent,
  ClubAnalyticsComponent,
  MembershipsComponent,
  SubscriptionPricingComponent,
  TipAmountsComponent,
  TipLeaderboardsComponent,
  PaywallComponent,
  SponsorshipRequestsComponent,
  MultilingualChatComponent,
  BrainstormingComponent,
  TaskPlanningComponent,
  ConversationalSearchComponent,
  SearchSummariesComponent,
  SearchAnswersComponent,
  KnowledgePanelsComponent,
  AppointmentBookingComponent,
  LeadScoringComponent,
  FreelancerProfilesComponent,
  ProposalTemplatesComponent,
  AuctionCreationComponent,
  RentalListingsComponent,
  DeepfakeDetectionComponent,
  ImpersonationDetectionComponent,
  FraudDetectionComponent,
  CreatorAnalyticsComponent,
  FinancialReportsComponent,
  GrowthPredictionsComponent,
};
