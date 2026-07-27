import { useState, useEffect, lazy, Suspense } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { CreatePostForm } from './components/create-post-form';
import { CreatePost } from './components/CreatePost';
import { CreateReel } from './components/CreateReel';
import { StoriesBar } from './components/stories-bar';
import { getForYouFeed, getFeedView, setAuthToken, getFollowSuggestions, followUser } from './lib/api';
import { PostList } from './components/post-list';
import { useDarkMode } from './hooks/useDarkMode';
import { Button } from './components/ui/button';
import { MessageSquare, LogOut, LogIn, Menu, X, Sun, Moon, Users, Video, Zap, MoreHorizontal, Calendar, Clock, Heart, HandHeart, CalendarDays, Building2, Megaphone, UserPlus, Settings, MapPin, Compass, ArrowUpDown, Globe, Bot, Bookmark, BookOpen, Home, ShoppingBag, Plus, Coins } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Search } from './components/search';
import { NotificationIcon } from './components/notifications/notification-icon';
import { NotificationDropdown } from './components/notifications/notification-dropdown';
import type { Post } from './lib/types';
import { PageShell } from './components/PageShell';
import { Trending } from './components/trending';
import { useAuth } from './hooks/useAuth';
import { useKeys } from './hooks/useKeys';
import { useToast } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import { useAppPreferences } from './contexts/PreferencesContext';
import AIChatbotWidget from './components/ai-chatbot/AIChatbotWidget';
import { useScreenTimeTracker } from './hooks/useScreenTimeTracker';
import { DeviceModeRoute } from './components/DeviceModeRoute';

const AdminPage = lazy(() => import('./pages/admin').then((module) => ({ default: module.AdminPage })));

const SignUpPage = lazy(() => import('./pages/sign-up').then((module) => ({ default: module.SignUpPage })));
const LoginPage = lazy(() => import('./pages/login').then((module) => ({ default: module.LoginPage })));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password').then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/reset-password').then((module) => ({ default: module.ResetPasswordPage })));
const ProfilePage = lazy(() => import('./pages/profile').then((module) => ({ default: module.ProfilePage })));
const DmsPage = lazy(() => import('./components/dms/DmsPage').then((module) => ({ default: module.DmsPage })));
const ConversationPage = lazy(() =>
  import('./pages/dms/conversation').then((module) => ({ default: module.ConversationPage })),
);
const PostPage = lazy(() => import('./pages/post').then((module) => ({ default: module.PostPage })));
const ReelPage = lazy(() => import('./pages/ReelPage').then((module) => ({ default: module.ReelPage })));
const EmailVerificationPage = lazy(() =>
  import('./pages/email-verification').then(module => ({ default: module.EmailVerificationPage }))
);
const GroupsPage = lazy(() =>
  import('./pages/groups').then(module => ({ default: module.GroupsPage }))
);
const CulturalPreservationCommunitiesPage = lazy(() =>
  import('./components/cultural-preservation-communities/CulturalPreservationCommunities').then((module) => ({ default: module.CulturalPreservationCommunities }))
);
const SkillSharingCommunitiesPage = lazy(() =>
  import('./components/skill-sharing/SkillSharingCommunities').then((module) => ({ default: module.SkillSharingCommunities }))
);
const CrisisResponseCommunitiesPage = lazy(() =>
  import('./components/crisis-response-communities/CrisisResponseCommunities').then((module) => ({ default: module.CrisisResponseCommunities }))
);
const AccessibilityFirstCommunitiesPage = lazy(() =>
  import('./components/accessibility-first-communities/AccessibilityFirstCommunities').then((module) => ({ default: module.AccessibilityFirstCommunities }))
);
const ShortsPage = lazy(() => import('./pages/shorts').then((module) => ({ default: module.default })));
const ShortsEditorPage = lazy(() => import('./components/shorts/ShortsEditor').then((module) => ({ default: module.default })));
const WalletPage = lazy(() => import('./pages/wallet').then((module) => ({ default: module.WalletPage })));
const EarningsPage = lazy(() => import('./pages/earnings').then((module) => ({ default: module.EarningsPage })));
const BlockchainIdentityPage = lazy(() => import('./pages/blockchain-identity').then((module) => ({ default: module.default })));
const SearchResultsPage = lazy(() => import('./pages/search').then((module) => ({ default: module.default })));
const NotificationsPage = lazy(() => import('./pages/notifications').then((module) => ({ default: module.default })));
const PasskeyManagementPage = lazy(() =>
  import('./pages/passkey-management').then((module) => ({ default: module.PasskeyManagementPage })),
);
const SecurityCheckupPage = lazy(() =>
  import('./pages/security-checkup').then((module) => ({ default: module.SecurityCheckupPage })),
);
const AuthCallbackPage = lazy(() => import('./pages/auth-callback').then((module) => ({ default: module.AuthCallbackPage })));
const TermsPage = lazy(() => import('./pages/terms').then((module) => ({ default: module.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/privacy').then((module) => ({ default: module.PrivacyPage })));
const PrivacyShortcutsPage = lazy(() => import('./pages/privacy-shortcuts').then((module) => ({ default: module.default })));
const SubscriptionsPage = lazy(() => import('./pages/subscriptions').then((module) => ({ default: module.default })));
const SubscribersPage = lazy(() => import('./pages/subscribers').then((module) => ({ default: module.default })));
const Streaming = lazy(() => import('./Streaming').then((module) => ({ default: module.Streaming })));
const EditProfilePage = lazy(() => import('./pages/edit-profile').then((module) => ({ default: module.EditProfilePage })));
const FollowRequestsPage = lazy(() => import('./pages/follow-requests').then((module) => ({ default: module.FollowRequestsPage })));
const SettingsPage = lazy(() => import('./pages/settings').then((module) => ({ default: module.SettingsPage })));
const CloseFriendsSettingsPage = lazy(() => import('./pages/close-friends-settings').then((module) => ({ default: module.CloseFriendsSettings })));
const CustomAudiencesSettingsPage = lazy(() => import('./pages/custom-audiences-settings').then((module) => ({ default: module.CustomAudiencesSettings })));
const TwoFactorAuthPage = lazy(() => import('./pages/two-factor-auth').then((module) => ({ default: module.TwoFactorAuthPage })));
const ConnectedAccountsPage = lazy(() => import('./pages/ConnectedAccountsPage').then((module) => ({ default: module.default })));



const LiveStreamPage = lazy(() => import('./pages/livestream').then((module) => ({ default: module.LiveStreamPage })));
const AnalyticsPage = lazy(() => import('./pages/analytics').then((module) => ({ default: module.AnalyticsPage })));
const SchedulerPage = lazy(() => import('./pages/scheduler').then((module) => ({ default: module.SchedulerPage })));
const CreatorTiersPage = lazy(() => import('./pages/creator-tiers').then((module) => ({ default: module.default })));
const BlockedUsersPage = lazy(() => import('./pages/blocked-users').then((module) => ({ default: module.BlockedUsersPage })));
const BookmarkedPostsPage = lazy(() => import('./pages/BookmarkedPostsPage').then((module) => ({ default: module.BookmarkedPostsPage })));
const SessionsPage = lazy(() => import('./pages/SessionsPage').then((module) => ({ default: module.SessionsPage })));
const HashtagPage = lazy(() => import('./pages/HashtagPage').then((module) => ({ default: module.HashtagPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then((module) => ({ default: module.EventsPage })));
const EventPage = lazy(() => import('./pages/EventPage').then((module) => ({ default: module.default })));
const DataPrivacyPage = lazy(() => import('./pages/data-privacy').then((module) => ({ default: module.default })));
const ReelsPage = lazy(() => import('./components/reels/ReelsViewer').then((module) => ({ default: module.ReelsViewer })));
const MarketplacePage = lazy(() => import('./pages/marketplace/MarketplacePage').then((module) => ({ default: module.MarketplacePage })));
const ListingDetailPage = lazy(() => import('./pages/marketplace/ListingDetailPage').then((module) => ({ default: module.ListingDetailPage })));
const OpenSourcePlatformPage = lazy(() => import('./pages/opensource/OpenSourcePlatformPage').then((module) => ({ default: module.OpenSourcePlatformPage })));
const DigitalAssetsPage = lazy(() => import('./pages/digital-assets/DigitalAssetsPage').then((module) => ({ default: module.default })));
const CreateListingPage = lazy(() => import('./pages/marketplace/CreateListingPage').then((module) => ({ default: module.CreateListingPage })));
const SellerDashboardPage = lazy(() => import('./pages/marketplace/SellerDashboardPage').then((module) => ({ default: module.SellerDashboardPage })));
const CreateProductPage = lazy(() => import('./pages/marketplace/CreateProductPage').then((module) => ({ default: module.CreateProductPage })));
const EditProductPage = lazy(() => import('./pages/marketplace/EditProductPage').then((module) => ({ default: module.EditProductPage })));
const ProductDetailPage = lazy(() => import('./pages/marketplace/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/marketplace/CartPage').then((module) => ({ default: module.CartPage })));
const OrdersPage = lazy(() => import('./pages/marketplace/OrdersPage').then((module) => ({ default: module.OrdersPage })));
const SavedMarketplaceListingsPage = lazy(() => import('./pages/marketplace/SavedMarketplaceListingsPage').then((module) => ({ default: module.SavedMarketplaceListingsPage })));
const LocalFeedPage = lazy(() => import('./pages/local-feed').then((module) => ({ default: module.default })));
const FitnessSegmentsPage = lazy(() => import('./pages/fitness-segments').then((module) => ({ default: module.default })));
const WatchLaterPage = lazy(() => import('./pages/watch').then((module) => ({ default: module.default })));
const ReadLaterPage = lazy(() => import('./pages/read-later').then((module) => ({ default: module.default })));
const MemoriesPage = lazy(() => import('./pages/memories').then((module) => ({ default: module.default })));
const FundraisersDiscoveryPage = lazy(() => import('./pages/fundraisers/discover').then((module) => ({ default: module.default })));
const FundraiserPage = lazy(() => import('./pages/fundraisers/id').then((module) => ({ default: module.default })));
const CreateFundraiserPage = lazy(() => import('./pages/fundraisers/create').then((module) => ({ default: module.default })));
const DatingOnboardingPage = lazy(() => import('./pages/dating/onboarding').then((module) => ({ default: module.default })));
const DatingDiscoveryPage = lazy(() => import('./pages/dating/discover').then((module) => ({ default: module.default })));
const DatingMatchesPage = lazy(() => import('./pages/dating/matches').then((module) => ({ default: module.default })));
const DatingCrushPage = lazy(() => import('./pages/dating/crush').then((module) => ({ default: module.default })));
const ArticleFeedPage = lazy(() => import('./pages/articles/ArticleFeed'));
const ArticleEditorPage = lazy(() => import('./pages/articles/ArticleEditor'));
const AffiliateDashboardPage = lazy(() => import('./pages/affiliates/AffiliateDashboardPage').then((module) => ({ default: module.AffiliateDashboardPage })));
const BrandCollabsDashboardPage = lazy(() => import('./pages/brand-collabs/BrandCollabsDashboardPage').then((module) => ({ default: module.BrandCollabsDashboardPage })));
const SnoozePage = lazy(() => import('./pages/snooze').then((module) => ({ default: module.SnoozePage })));
const RequestVerificationPage = lazy(() => import('./pages/request-verification'));
const CollectionsPage = lazy(() => import('./pages/collections').then((module) => ({ default: module.default })));
const NewCollectionPage = lazy(() => import('./pages/NewCollectionsPage').then((module) => ({ default: module.default })));
const CollectionDetailPage = lazy(() => import('./pages/CollectionDetailPage').then((module) => ({ default: module.default })));
const ScheduleStreamPage = lazy(() => import('./pages/schedule-stream').then((module) => ({ default: module.ScheduleStreamPage })));
const LiveShoppingEventsPage = lazy(() => import('./pages/LiveShoppingEventsPage').then((module) => ({ default: module.LiveShoppingEventsPage })));
const LiveShoppingPage = lazy(() => import('./pages/liveshopping').then((module) => ({ default: module.LiveShoppingPage })));
const CreatePage = lazy(() => import('./pages/pages/CreatePage').then((module) => ({ default: module.CreatePage })));
const PageInbox = lazy(() => import('./pages/pages/PageInbox').then((module) => ({ default: module.PageInbox })));
const PageProfile = lazy(() => import('./pages/pages/PageProfile').then((module) => ({ default: module.PageProfile })));
const PageInboxPage = lazy(() => import('./components/PageInbox/PageInboxPage').then((module) => ({ default: module.PageInboxPage })));
const TimelineReviewPage = lazy(() => import('./pages/timeline-review').then((module) => ({ default: module.default })));
const TimelineReviewSettingsPage = lazy(() => import('./pages/timeline-review/settings').then((module) => ({ default: module.default })));
const ExplorePage = lazy(() => import('./pages/explore').then((module) => ({ default: module.default })));
const EInkReaderPage = lazy(() => import('./pages/eink-reader').then((module) => ({ default: module.EInkReaderPage })));
const AdvancedFeaturesPage = lazy(() => import('./pages/advanced-features').then((module) => ({ default: module.AdvancedFeaturesPage })));
const CrisisEventsPage = lazy(() => import('./pages/crisis/CrisisEventsPage').then((module) => ({ default: module.default })));
const CrisisEventDetailPage = lazy(() => import('./pages/crisis/CrisisEventDetailPage').then((module) => ({ default: module.default })));
const TokenGatedPage = lazy(() => import('./pages/token-gated').then((module) => ({ default: module.TokenGatedPage })));
const DaoPage = lazy(() => import('./pages/dao').then((module) => ({ default: module.DaoPage })));
const SnapMapPage = lazy(() => import('./components/snapmap/SnapMapPage').then((module) => ({ default: module.SnapMapPage })));


function RouteLoader() {
  return (
    <PageShell eyebrow="Loading" title="Preparing page" description="Pulling in the next experience..." compact>
      <div className="surface-soft p-8 text-center animate-fade-in">
        <div className="mx-auto mb-4 h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 animate-pulse-soft" />
        <p className="text-sm text-dark-600 dark:text-dark-300">One moment while we load this view.</p>
      </div>
    </PageShell>
  );
}

import { Avatar } from './components/Avatar';

// ---- Navigation model (data-driven so desktop + mobile stay in sync) ----
type NavLeaf = { to: string; label: string; icon: LucideIcon };

const PRIMARY_NAV: NavLeaf[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/dms', label: 'Messages', icon: MessageSquare },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
];

const MORE_SECTIONS: { title: string; items: NavLeaf[] }[] = [
  {
    title: 'Watch & listen',
    items: [
      { to: '/shorts', label: 'Shorts', icon: Video },
      { to: '/reels', label: 'Reels', icon: Zap },
      { to: '/livestream', label: 'Live Stream', icon: Video },
      { to: '/liveshopping', label: 'Live Shopping', icon: Video },
      { to: '/watch-later', label: 'Watch Later', icon: Clock },
    ],
  },
  {
    title: 'Discover',
    items: [
      { to: '/local-feed', label: 'Local Feed', icon: MapPin },
      { to: '/fitness-segments', label: 'Fitness Segments', icon: Compass },
      { to: '/dating/discover', label: 'Dating', icon: UserPlus },
      { to: '/digital-assets', label: 'Digital Assets', icon: Globe },
      { to: '/devices', label: 'Devices', icon: Bot },
    ],
  },
  {
    title: 'Communities',
    items: [
      { to: '/cultural-preservation-communities', label: 'Cultural Preservation', icon: Building2 },
      { to: '/skill-sharing', label: 'Skill Sharing', icon: Users },
      { to: '/crisis-response-communities', label: 'Crisis Response', icon: HandHeart },
      { to: '/accessibility-first-communities', label: 'Accessibility First', icon: Users },
    ],
  },
  {
    title: 'Library',
    items: [
      { to: '/articles', label: 'Articles', icon: BookOpen },
      { to: '/read-later', label: 'Read Later', icon: Bookmark },
      { to: '/memories', label: 'Memories', icon: Clock },
      { to: '/marketplace/saved', label: 'Saved', icon: Heart },
      { to: '/events', label: 'Events', icon: Calendar },
      { to: '/fundraisers', label: 'Fundraisers', icon: HandHeart },
    ],
  },
  {
    title: 'Creator & business',
    items: [
      { to: '/earnings', label: 'Earnings & Payouts', icon: Coins },
      { to: '/scheduler', label: 'Content Scheduler', icon: CalendarDays },
      { to: '/livestream/schedule', label: 'Schedule Stream', icon: Calendar },
      { to: '/nonprofit', label: 'Nonprofit Tools', icon: Building2 },
      { to: '/timeline-review', label: 'Timeline Review', icon: Clock },
    ],
  },
];

const CREATE_ITEMS: { to: string; label: string }[] = [
  { to: '/create-post', label: 'Create Post' },
  { to: '/create-reel', label: 'Create Reel' },
  { to: '/forms/new', label: 'Create Form' },
];

const navLinkBase =
  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 dark:focus:ring-offset-dark-900';
const navLinkIdle =
  'text-dark-700 hover:bg-dark-100 hover:text-primary-600 dark:text-light-100 dark:hover:bg-dark-800 dark:hover:text-primary-400';
const navLinkActive =
  'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${navLinkBase} ${isActive ? navLinkActive : navLinkIdle}`;

const menuItemBase =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500';
const menuItemClass = ({ isActive }: { isActive: boolean }) =>
  `${menuItemBase} ${
    isActive
      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
      : 'text-dark-700 hover:bg-dark-100 dark:text-light-100 dark:hover:bg-dark-800'
  }`;

function Navbar({ isLoggedIn, toggleTheme, theme }: { isLoggedIn: boolean; toggleTheme: () => void; theme: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeDropdowns = () => {
    setIsMoreMenuOpen(false);
    setIsCreateMenuOpen(false);
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
  };

  // Close dropdowns when clicking outside or pressing Escape.
  useEffect(() => {
    const handleClickOutside = () => closeDropdowns();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDropdowns();
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const { activeAccount, logout } = useAuth();

  const handleLogoutClick = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/70 bg-white/75 shadow-[0_10px_40px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-dark-700/70 dark:bg-dark-900/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3 group" aria-label="Zynkra home">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 via-cyan-500 to-accent-600 shadow-lg shadow-primary-500/25">
            <span className="text-2xl font-bold text-white">Z</span>
          </div>
          <span className="hidden text-2xl font-display font-bold tracking-tight text-gradient sm:inline">Zynkra</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center justify-end gap-2">
          {isLoggedIn && (
            <div className="flex items-center gap-1">
              {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}

              {/* More mega-menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen((v) => !v); setIsCreateMenuOpen(false); setIsProfileOpen(false); }}
                  className={`${navLinkBase} ${isMoreMenuOpen ? navLinkActive : navLinkIdle}`}
                  aria-haspopup="menu"
                  aria-expanded={isMoreMenuOpen}
                >
                  <MoreHorizontal size={18} aria-hidden="true" />
                  <span>More</span>
                </button>
                {isMoreMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-2xl border border-dark-200 bg-white p-2 shadow-xl dark:border-dark-700 dark:bg-dark-900 z-50"
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {MORE_SECTIONS.map((section, i) => (
                      <div key={section.title} className={i > 0 ? 'mt-1 border-t border-dark-100 pt-1 dark:border-dark-800' : ''}>
                        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-dark-400 dark:text-dark-500">
                          {section.title}
                        </p>
                        {section.items.map(({ to, label, icon: Icon }) => (
                          <NavLink key={to} to={to} className={menuItemClass} role="menuitem" onClick={() => setIsMoreMenuOpen(false)}>
                            <Icon size={16} aria-hidden="true" />
                            {label}
                          </NavLink>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="w-56 lg:w-64">
            <Search />
          </div>

          <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="rounded-full border border-dark-200 bg-white/80 p-2.5 text-dark-700 shadow-sm hover:bg-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-700 dark:bg-dark-800/80 dark:text-light-100 dark:hover:bg-dark-700"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {isLoggedIn ? (
            <>
              <div className="relative">
                <NotificationIcon onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} />
                <NotificationDropdown isOpen={isNotificationsOpen} />
              </div>

              {/* Create Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsCreateMenuOpen((v) => !v); setIsMoreMenuOpen(false); setIsProfileOpen(false); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:shadow-xl hover:shadow-primary-500/25 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900"
                  aria-haspopup="menu"
                  aria-expanded={isCreateMenuOpen}
                >
                  <Plus size={18} aria-hidden="true" />
                  Create
                </button>
                {isCreateMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-dark-200 bg-white p-2 shadow-xl dark:border-dark-700 dark:bg-dark-900 z-50" role="menu" onClick={(e) => e.stopPropagation()}>
                    {CREATE_ITEMS.map(({ to, label }) => (
                      <button
                        key={to}
                        type="button"
                        role="menuitem"
                        onClick={() => { navigate(to); setIsCreateMenuOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-dark-700 hover:bg-dark-100 dark:text-light-100 dark:hover:bg-dark-800"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsProfileOpen((v) => !v); setIsMoreMenuOpen(false); setIsCreateMenuOpen(false); }}
                  className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900"
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                >
                  <Avatar className="h-8 w-8" />
                </button>
                <ProfileDropdown isOpen={isProfileOpen} />
              </div>
            </>
          ) : (
            <>
              <Button variant="secondary" size="md" onClick={() => navigate('/login')} icon={<LogIn size={18} />}>
                Log In
              </Button>
              <Button variant="primary" size="md" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 md:hidden">
          {isLoggedIn && (
            <div className="relative">
              <NotificationIcon onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} />
              <NotificationDropdown isOpen={isNotificationsOpen} />
            </div>
          )}
          <button
            className="rounded-xl border border-dark-200 bg-white/80 p-2.5 text-dark-700 shadow-sm transition-colors hover:bg-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-700 dark:bg-dark-800/80 dark:text-light-100 dark:hover:bg-dark-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-full max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-white/70 bg-white/95 backdrop-blur-xl dark:border-dark-700/70 dark:bg-dark-900/95 md:hidden">
            <div className="flex flex-col gap-2 p-4">
              <Search />
              <button
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                className="flex items-center gap-2 self-start rounded-full border border-dark-200 bg-white/80 p-2.5 text-dark-700 shadow-sm dark:border-dark-700 dark:bg-dark-800/80 dark:text-light-100"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              {isLoggedIn ? (
                <>
                  {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} end={to === '/'} className={menuItemClass} onClick={() => setIsMenuOpen(false)}>
                      <Icon size={18} aria-hidden="true" />
                      {label}
                    </NavLink>
                  ))}
                  <NavLink to="/profile" className={menuItemClass} onClick={() => setIsMenuOpen(false)}>
                    <UserPlus size={18} aria-hidden="true" />
                    Profile
                  </NavLink>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {CREATE_ITEMS.map(({ to, label }) => (
                      <button
                        key={to}
                        type="button"
                        onClick={() => { navigate(to); setIsMenuOpen(false); }}
                        className="rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                      >
                        {label.replace('Create ', '+ ')}
                      </button>
                    ))}
                  </div>

                  {MORE_SECTIONS.map((section) => (
                    <div key={section.title} className="mt-1 border-t border-dark-100 pt-1 dark:border-dark-800">
                      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-dark-400 dark:text-dark-500">
                        {section.title}
                      </p>
                      {section.items.map(({ to, label, icon: Icon }) => (
                        <NavLink key={to} to={to} className={menuItemClass} onClick={() => setIsMenuOpen(false)}>
                          <Icon size={16} aria-hidden="true" />
                          {label}
                        </NavLink>
                      ))}
                    </div>
                  ))}

                  <div className="mt-1 border-t border-dark-100 pt-1 dark:border-dark-800">
                    <NavLink to="/settings" className={menuItemClass} onClick={() => setIsMenuOpen(false)}>
                      <Settings size={16} aria-hidden="true" />
                      Settings
                    </NavLink>
                    <button
                      onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                      className={`${menuItemBase} text-dark-700 hover:bg-dark-100 dark:text-light-100 dark:hover:bg-dark-800`}
                    >
                      <UserPlus size={16} aria-hidden="true" />
                      Add an existing account
                    </button>
                    <button
                      onClick={handleLogoutClick}
                      className={`${menuItemBase} text-dark-700 hover:bg-dark-100 dark:text-light-100 dark:hover:bg-dark-800`}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      Log out @{activeAccount?.user.username}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Button variant="secondary" size="md" className="w-full justify-center" onClick={() => { navigate('/login'); setIsMenuOpen(false); }} icon={<LogIn size={18} />}>
                    Log In
                  </Button>
                  <Button variant="primary" size="md" className="w-full justify-center" onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function FollowerSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const data = await getFollowSuggestions();
        // Endpoint returns { users, pages }; render the user suggestions.
        setSuggestions(Array.isArray(data) ? data : data.users ?? []);
      } catch (error) {
        console.error('Failed to fetch follow suggestions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const handleFollow = async (userId: string, index: number) => {
    try {
      await followUser(userId);
      // Remove from suggestions after following
      setSuggestions(prev => prev.filter((_, i) => i !== index));
      addToast('User followed!', 'success');
    } catch (error) {
      console.error('Failed to follow user:', error);
      addToast('Failed to follow user', 'error');
    }
  };

  if (loading) {
    return (
      <div className="surface-soft p-md rounded-lg">
        <h3 className="font-semibold mb-sm">Who to follow</h3>
        <div className="space-y-sm">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-full bg-dark-200 dark:bg-dark-700 animate-pulse" />
                <div>
                  <div className="w-20 h-4 bg-dark-200 dark:bg-dark-700 rounded animate-pulse mb-1" />
                  <div className="w-16 h-3 bg-dark-200 dark:bg-dark-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="w-16 h-8 bg-dark-200 dark:bg-dark-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Hide if no suggestions
  }

  return (
    <div className="surface-soft p-md rounded-lg">
      <h3 className="font-semibold mb-sm">Who to follow</h3>
      <div className="space-y-sm">
        {suggestions.map((s, index) => (
          <div key={s.id} className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <img 
                src={s.pfp || s.avatar || `https://i.pravatar.cc/48?u=${s.id}`} 
                alt={s.displayName || s.username} 
                className="w-10 h-10 rounded-full object-cover" 
              />
              <div>
                <p className="font-semibold text-sm">{s.displayName || s.username}</p>
                <p className="text-xs text-dark-500">@{s.username}</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleFollow(s.id, index)}
            >
              Follow
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const { isLoggedIn, activeAccount, loading: isLoading } = useAuth();
  const { theme, toggleTheme } = useDarkMode();
  const { feedSort, setFeedSort } = useAppPreferences();
  // Initialize screen time tracking
  useScreenTimeTracker();
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedType, setFeedType] = useState('for-you');
  const { generateKeys, hasKeys } = useKeys(activeAccount?.user);

  useEffect(() => {
    if (activeAccount) {
      setAuthToken(activeAccount.token);
    }
  }, [activeAccount]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        let fetchedPosts: Post[];
        if (feedType === 'for-you' || feedType === 'recommended' || feedType === 'favorites' || feedType === 'subscriptions' || feedType === 'friends' || feedType === 'chronological' || feedType === 'trending') {
          fetchedPosts = await getFeedView(feedType as 'for-you' | 'recommended' | 'friends' | 'subscriptions' | 'favorites' | 'chronological' | 'trending', 20);
        } else {
          fetchedPosts = await getForYouFeed();
        }
        
        // Apply sorting based on user preference
        if (feedSort === 'chronological') {
          // Sort by createdAt in descending order (newest first)
          fetchedPosts.sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    }

    if (isLoggedIn) {
      fetchPosts();
    }
  }, [isLoggedIn, feedType, feedSort]);

  if (isLoading) {
    return <RouteLoader />;
  }

  return (
    <ToastProvider>
      <CartProvider>
            <div className={`app-container bg-dark-50 dark:bg-dark-950 min-h-screen font-sans antialiased ${theme}`}>
              <Navbar isLoggedIn={isLoggedIn} toggleTheme={toggleTheme} theme={theme} />
              <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                <Suspense fallback={<RouteLoader />}>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        isLoggedIn ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                              <div className="md:col-span-2">
                                <StoriesBar />
                                <CreatePostForm />
                                <div className="flex flex-wrap items-center justify-between border-b border-dark-200 dark:border-dark-800 mb-md pb-2">
                                  <div className="flex space-x-sm">
                                    <Button variant={feedType === 'for-you' ? 'primary' : 'ghost'} onClick={() => setFeedType('for-you')}>For You</Button>
                                    <Button variant={feedType === 'recommended' ? 'primary' : 'ghost'} onClick={() => setFeedType('recommended')}>Recommended</Button>
                                    <Button variant={feedType === 'friends' ? 'primary' : 'ghost'} onClick={() => setFeedType('friends')}>Following</Button>
                                    <Button variant={feedType === 'favorites' ? 'primary' : 'ghost'} onClick={() => setFeedType('favorites')}>Favorites</Button>
                                    <Button variant={feedType === 'subscriptions' ? 'primary' : 'ghost'} onClick={() => setFeedType('subscriptions')}>Subscriptions</Button>
                                    <Button variant={feedType === 'chronological' ? 'primary' : 'ghost'} onClick={() => setFeedType('chronological')}>Chronological</Button>
                                    <Button variant={feedType === 'trending' ? 'primary' : 'ghost'} onClick={() => setFeedType('trending')}>Trending</Button>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                    <ArrowUpDown size={16} className="text-dark-500 dark:text-dark-400" />
                                    <span className="text-sm text-dark-600 dark:text-dark-300">Feed sort:</span>
                                    <Button 
                                      variant={feedSort === 'algorithmic' ? 'primary' : 'outline'} 
                                      size="sm"
                                      onClick={() => setFeedSort('algorithmic')}
                                      className="text-xs"
                                    >
                                      Algorithmic
                                    </Button>
                                    <Button 
                                      variant={feedSort === 'chronological' ? 'primary' : 'outline'} 
                                      size="sm"
                                      onClick={() => setFeedSort('chronological')}
                                      className="text-xs"
                                    >
                                      Chronological
                                    </Button>
                                  </div>
                                </div>
                                <PostList posts={posts} />
                                {activeAccount && !hasKeys(activeAccount.user.id) && (
                                  <div className="surface p-md rounded-lg mt-md">
                                    <h3 className="font-semibold mb-sm">Enable Encryption</h3>
                                    <p className="text-sm text-dark-500 mb-md">Generate a new key pair to help secure your direct messages. Note: E2EE is in progress — messages are encrypted in transit via TLS.</p>
                                    <Button onClick={() => generateKeys(activeAccount.user.id)}>Generate Keys</Button>
                                  </div>
                                )}
                              </div>
                              <aside className="hidden md:block">
                                  <div className="space-y-8">
                                    <Trending />
                                    <FollowerSuggestions />
                                  </div>
                              </aside>
                            </div>
                          </>
                        ) : (
                          <div className="surface p-8 text-center animate-fade-in sm:p-10">
                            <h1 className="font-display text-4xl font-semibold tracking-tight text-gradient mb-md">Welcome to Zynkra</h1>
                            <p className="text-dark-600 dark:text-light-300 mb-xl text-lg max-w-md mx-auto">
                              A Web3-powered social platform where you control your identity with decentralized authentication.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-xl">
                              <div className="p-md bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                                <Zap className="text-primary-600 dark:text-primary-400 mx-auto mb-sm" size={32} />
                                <h3 className="font-semibold text-dark-900 dark:text-light-100 mb-xs">Web3 Powered</h3>
                                <p className="text-sm text-dark-600 dark:text-light-300">Sign in with your Ethereum wallet</p>
                              </div>
                              <div className="p-md bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800">
                                <Users className="text-accent-600 dark:text-accent-400 mx-auto mb-sm" size={32} />
                                <h3 className="font-semibold text-dark-900 dark:text-light-100 mb-xs">Community Driven</h3>
                                <p className="text-sm text-dark-600 dark:text-light-300">Engage with a vibrant community</p>
                              </div>
                            </div>
                            <div className="flex justify-center gap-md">
                              <Link to="/login">
                                <Button variant="secondary" size="lg">Log In</Button>
                              </Link>
                              <Link to="/signup">
                                <Button variant="primary" size="lg">Sign Up</Button>
                              </Link>
                            </div>
                          </div>
                        )
                      }
                    />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/privacy/shortcuts" element={<PrivacyShortcutsPage />} />
                    <Route path="/search" element={<SearchResultsPage />} />
                    <Route path="/devices" element={<DeviceModeRoute />} />
                    <Route path="/eink-reader" element={<ProtectedRoute><EInkReaderPage /></ProtectedRoute>} />
                    <Route path="/advanced-features" element={<ProtectedRoute><AdvancedFeaturesPage /></ProtectedRoute>} />
                    <Route path="/hashtag/:hashtag" element={<HashtagPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/events/:id" element={<EventPage />} />
                    <Route path="/liveshopping" element={<LiveShoppingEventsPage />} />
                    <Route path="/liveshopping/:id" element={<LiveShoppingPage />} />
                    <Route path="/reels" element={<ReelsPage />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/marketplace/new" element={<CreateListingPage />} />
                    <Route path="/marketplace/listing/:id" element={<ListingDetailPage />} />
                    <Route path="/marketplace/seller" element={<SellerDashboardPage />} />
                    <Route path="/marketplace/products/new" element={<CreateProductPage />} />
                    <Route path="/marketplace/products/:id/edit" element={<EditProductPage />} />
                    <Route path="/marketplace/products/:id" element={<ProductDetailPage />} />
                    <Route path="/marketplace/cart" element={<CartPage />} />
                    <Route path="/marketplace/orders" element={<OrdersPage />} />
                    <Route path="/marketplace/saved" element={<SavedMarketplaceListingsPage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/articles" element={
                      <ProtectedRoute>
                        <ArticleFeedPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/articles/new" element={
                      <ProtectedRoute>
                        <ArticleEditorPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/digital-assets" element={
                      <ProtectedRoute>
                        <DigitalAssetsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/watch-later" element={<WatchLaterPage />} />
                    <Route path="/read-later" element={<ReadLaterPage />} />
                    <Route path="/memories" element={<MemoriesPage />} />
                    <Route path="/fundraisers" element={<FundraisersDiscoveryPage />} />
                    <Route path="/fundraisers/new" element={<CreateFundraiserPage />} />
                    <Route path="/fundraisers/:id" element={<FundraiserPage />} />
                    <Route path="/dating/onboarding" element={<DatingOnboardingPage />} />
                    <Route path="/dating/discover" element={<DatingDiscoveryPage />} />
                    <Route path="/dating/matches" element={<DatingMatchesPage />} />
                    <Route path="/dating/crush" element={<DatingCrushPage />} />
                    <Route path="/affiliates" element={<AffiliateDashboardPage />} />
                    <Route
                      path="/brand-collabs"
                      element={
                        <ProtectedRoute>
                          <BrandCollabsDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/collections" element={<CollectionsPage />} />
                    <Route path="/collections/new" element={<NewCollectionPage />} />
                    <Route path="/collections/:id" element={<CollectionDetailPage />} />
                    <Route path="/pages/new" element={<CreatePage />} />
                    <Route path="/pages/:id" element={<PageProfile />} />
                    <Route path="/pages/:id/inbox" element={<PageInbox />} />
                    <Route path="/pages/inbox" element={<PageInboxPage />} />

                    <Route
                      path="/profile/:username"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dms"
                      element={
                        <ProtectedRoute>
                          <DmsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dms/:conversationId"
                      element={
                        <ProtectedRoute>
                          <ConversationPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/post/:id"
                      element={
                        <ProtectedRoute>
                          <PostPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reel/:id"
                      element={
                        <ProtectedRoute>
                          <ReelPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/create-post"
                      element={
                        <ProtectedRoute>
                          <CreatePost />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/create-reel"
                      element={
                        <ProtectedRoute>
                          <CreateReel />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/groups"
                      element={
                        <ProtectedRoute>
                          <GroupsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cultural-preservation-communities"
                      element={
                        <ProtectedRoute>
                          <CulturalPreservationCommunitiesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/skill-sharing"
                      element={
                        <ProtectedRoute>
                          <SkillSharingCommunitiesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crisis-response-communities"
                      element={
                        <ProtectedRoute>
                          <CrisisResponseCommunitiesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/accessibility-first-communities"
                      element={
                        <ProtectedRoute>
                          <AccessibilityFirstCommunitiesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/shorts"
                      element={
                        <ProtectedRoute>
                          <ShortsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/shorts/editor"
                      element={
                        <ProtectedRoute>
                          <ShortsEditorPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/local-feed"
                      element={
                        <ProtectedRoute>
                          <LocalFeedPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fitness-segments"
                      element={
                        <ProtectedRoute>
                          <FitnessSegmentsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/wallet"
                      element={
                        <ProtectedRoute>
                          <WalletPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/earnings"
                      element={
                        <ProtectedRoute>
                          <EarningsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/blockchain-identity"
                      element={
                        <ProtectedRoute>
                          <BlockchainIdentityPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute>
                          <NotificationsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/passkeys"
                      element={
                        <ProtectedRoute>
                          <PasskeyManagementPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/security-checkup"
                      element={
                        <ProtectedRoute>
                          <SecurityCheckupPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crisis-events"
                      element={
                        <ProtectedRoute>
                          <CrisisEventsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crisis-events/:id"
                      element={
                        <ProtectedRoute>
                          <CrisisEventDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/subscriptions"
                      element={
                        <ProtectedRoute>
                          <SubscriptionsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/subscribers"
                      element={
                        <ProtectedRoute>
                          <SubscribersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/stream"
                      element={
                        <ProtectedRoute>
                          <Streaming />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/edit-profile"
                      element={
                        <ProtectedRoute>
                          <EditProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/follow-requests"
                      element={
                        <ProtectedRoute>
                          <FollowRequestsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/close-friends"
                      element={
                        <ProtectedRoute>
                          <CloseFriendsSettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/custom-audiences"
                      element={
                        <ProtectedRoute>
                          <CustomAudiencesSettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/2fa"
                      element={
                        <ProtectedRoute>
                          <TwoFactorAuthPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/connected-accounts"
                      element={
                        <ProtectedRoute>
                          <ConnectedAccountsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/livestream"
                      element={
                        <ProtectedRoute>
                          <LiveStreamPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/livestream/schedule"
                      element={
                        <ProtectedRoute>
                          <ScheduleStreamPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute>
                          <AnalyticsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/scheduler"
                      element={
                        <ProtectedRoute>
                          <SchedulerPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/opensource"
                      element={
                        <ProtectedRoute>
                          <OpenSourcePlatformPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/creator-tiers"
                      element={
                        <ProtectedRoute>
                          <CreatorTiersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/blocked-users"
                      element={
                        <ProtectedRoute>
                          <BlockedUsersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/bookmarks"
                      element={
                        <ProtectedRoute>
                          <BookmarkedPostsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/sessions"
                      element={
                        <ProtectedRoute>
                          <SessionsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/data-privacy"
                      element={
                        <ProtectedRoute>
                          <DataPrivacyPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/snooze"
                      element={
                        <ProtectedRoute>
                          <SnoozePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/request-verification"
                      element={
                        <ProtectedRoute>
                          <RequestVerificationPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute>
                          <AdminPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/timeline-review" element={<TimelineReviewPage />} />
                    <Route path="/timeline-review/settings" element={<TimelineReviewSettingsPage />} />
                    <Route path="/token-gated" element={<ProtectedRoute><TokenGatedPage /></ProtectedRoute>} />
                    <Route path="/dao" element={<ProtectedRoute><DaoPage /></ProtectedRoute>} />
                    <Route path="/snapmap" element={<ProtectedRoute><SnapMapPage /></ProtectedRoute>} />
                  </Routes>
                </Suspense>
              </main>
              <ToastContainer />
            </div>
      </CartProvider>
    </ToastProvider>
  );
}

function ProfileDropdown({ isOpen }: { isOpen: boolean }) {
  const { activeAccount, accounts, logout, switchAccount } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }

  const handleSwitchAccount = (accountId: string) => {
    switchAccount(accountId);
  };

  return (
    <><div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg shadow-lg z-20">
      <div className="p-2">
        {accounts.map((account) => (
          <div
            key={account.user.id}
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${activeAccount?.user.id === account.user.id
                ? 'bg-dark-100 dark:bg-dark-700'
                : 'hover:bg-dark-50 dark:hover:bg-dark-700'}`}
            onClick={() => handleSwitchAccount(account.user.id)}
          >
            <Avatar user={account.user} className="h-8 w-8" />
            <div className="flex-grow">
              <p className="font-semibold text-sm">{account.user.displayName}</p>
              <p className="text-xs text-dark-500 dark:text-dark-300">@{account.user.username}</p>
            </div>
            {activeAccount?.user.id === account.user.id && (
              <div className="h-2 w-2 rounded-full bg-primary-500" />
            )}
          </div>
        ))}
        <div className="my-2 border-t border-dark-200 dark:border-dark-700" />
        <Link
          to="/settings"
          className="w-full text-left flex items-center gap-2 px-4 py-2 text-dark-700 dark:text-light-100 hover:bg-dark-50 dark:hover:bg-dark-700 rounded-md"
        >
          Settings
        </Link>
        <Link
          to="/sessions"
          className="w-full text-left flex items-center gap-2 px-4 py-2 text-dark-700 dark:text-light-100 hover:bg-dark-50 dark:hover:bg-dark-700 rounded-md"
        >
          Sessions
        </Link>
        <Link
          to="/timeline-review"
          className="w-full text-left flex items-center gap-2 px-4 py-2 text-dark-700 dark:text-light-100 hover:bg-dark-50 dark:hover:bg-dark-700 rounded-md"
        >
          Timeline Review
        </Link>
        <button
          onClick={() => navigate('/login')}
          className="w-full text-left flex items-center gap-2 px-4 py-2 text-dark-700 dark:text-light-100 hover:bg-dark-50 dark:hover:bg-dark-700 rounded-md"
        >
          Add an existing account
        </button>
        <button
          onClick={logout}
          className="w-full text-left flex items-center gap-2 px-4 py-2 text-dark-700 dark:text-light-100 hover:bg-dark-50 dark:hover:bg-dark-700 rounded-md"
        >
          <LogOut size={16} />
          Log out @{activeAccount?.user.username}
        </button>
      </div>
    </div><AIChatbotWidget /></>
  );
}

export default App;