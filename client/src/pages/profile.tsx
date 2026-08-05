// @ts-nocheck
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, CheckCircle2, Wallet, UserRound, Loader2, BadgeCheck, QrCode, Shield, ShieldOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { getProfile, getUserProfile, linkWallet, setNftPfp as apiSetNftPfp, getNfts as apiGetNfts, getReputation, followUser, unfollowUser, getMutualFollows, removeFollower, featurePost, unfeaturePost, sendFollowRequest, cancelFollowRequest, blockUser, unblockUser, muteUser, unmuteUser, getFollowers, getUserFollowing, getThemes } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { RichText } from '../components/RichText';
import { useAuth } from '../hooks/useAuth';
import { useAccount, useBalance, useSignMessage } from 'wagmi';
import { ConnectButton } from '../components/wallet/ConnectButton';
import { FollowRequests } from '../components/FollowRequests';
import { themes, Theme } from '../themes';
import { PostList } from '../components/post-list';
import { ProfileQrModal } from '../components/ProfileQrModal';
import { useEnsName } from '../hooks/useEnsName';
import type { Post, UserProfile, ThemeDefinition } from '../lib/types';

interface ExtendedUserProfile extends UserProfile {
  profileAccentColor?: string | null;
  header?: string | null;
  profileBioFont?: string;
  profileHeaderImageUrl?: string | null;
  verified?: boolean;
}

interface Nft {
  image: {
    cachedUrl: string;
  };
  contract: {
    address: string;
  };
  tokenId: string;
  name: string;
  collection: {
    name: string;
  };
}

export function ProfilePage() {
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const [user, setUser] = useState<ExtendedUserProfile | null>(null);
  const [followers, setFollowers] = useState<NonNullable<ExtendedUserProfile['followers']>>([]);
  const [reputation, setReputation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [themeCatalog, setThemeCatalog] = useState<ThemeDefinition[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const ensName = useEnsName(user?.walletAddress);
  const { addToast } = useToast();
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { signMessageAsync } = useSignMessage();
  const { id: userId } = useParams<{ id: string }>();
  const [followersCount, setFollowersCount] = useState(0);
  const [following, setFollowing] = useState<ExtendedUserProfile[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeList, setActiveList] = useState<'followers' | 'following'>('followers');
  const [mutualFollows, setMutualFollows] = useState<ExtendedUserProfile[]>([]);
  const [followStatus, setFollowStatus] = useState<'following' | 'requested' | 'not_following'>('not_following');
  const [posts, setPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [nfts, setNfts] = useState<Nft[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [isSettingPfp, setIsSettingPfp] = useState<string | null>(null);


  useEffect(() => {
    getThemes().then(setThemeCatalog).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profile = userId ? await getUserProfile(userId) : await getProfile();
        setUser(profile);
        setFollowers(profile.followers ?? []);
        setFollowing(profile.following ?? []);
        setFollowersCount((profile.followers ?? []).length);
        setFollowingCount((profile.following ?? []).length);
        setPosts(profile.posts ?? []);
        setFeaturedPosts(profile.featuredPosts ?? []);
        if (userId) {
          try {
            const [followersList, followingList] = await Promise.all([
              getFollowers(userId),
              getUserFollowing(userId),
            ]);
            setFollowers(followersList);
            setFollowing(followingList);
            setFollowersCount(followersList.length);
            setFollowingCount(followingList.length);
          } catch (error) {
            console.error('Failed to fetch follow lists:', error);
          }
          const mutuals = await getMutualFollows(userId);
          setMutualFollows(mutuals);
          setFollowStatus(profile.followStatus || 'not_following');
        } else {
          setCurrentUser(profile);
        }
        if (userId && currentUser) {
          try {
            const blocked = await getBlockedUsers();
            setIsBlocked(blocked.some((u: any) => u.id === userId));
          } catch { /* ignore */ }
        }
        const reputationData = await getReputation(profile.id);
        setReputation(reputationData?.score ?? 0);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        addToast('Failed to fetch profile', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [addToast, currentUserId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleFeatured = async (postId: string, isFeatured: boolean) => {
    try {
      if (isFeatured) {
        await featurePost(postId);
        addToast('Post featured!', 'success');
      } else {
        await unfeaturePost(postId);
        addToast('Post unfeatured', 'success');
      }
      const updatedPosts = posts.map(p => p.id === postId ? { ...p, isFeatured } : p);
      setPosts(updatedPosts);
      setFeaturedPosts(updatedPosts.filter(p => p.isFeatured));
    } catch (error) {
      console.error('Failed to toggle featured post:', error);
      addToast('Failed to toggle featured post', 'error');
    }
  };

  useEffect(() => {
    if (isConnected && address && !user?.walletAddress && !userId) {
      const connect = async () => {
        try {
          const updatedUser = await linkWallet({
            walletAddress: address,
            signMessage: (message) => signMessageAsync({ message }),
          });
          setUser(updatedUser);
setCurrentUser(updatedUser);
          addToast('Wallet linked successfully!', 'success');
        } catch (error) {
          console.error('Failed to link wallet:', error);
          addToast('Failed to link wallet', 'error');
        }
      };
      connect();
    }
  }, [isConnected, address, user?.walletAddress, addToast, setCurrentUser, userId, signMessageAsync]);

  useEffect(() => {
    const fetchNfts = async () => {
      if (user?.walletAddress) {
        setIsLoadingNfts(true);
        try {
          const nftData = await apiGetNfts(user.walletAddress);
          setNfts(nftData.ownedNfts);
        } catch (error) {
          console.error('Failed to fetch NFTs:', error);
          addToast('Failed to fetch NFTs', 'error');
        } finally {
          setIsLoadingNfts(false);
        }
      }
    };

    fetchNfts();
  }, [user?.walletAddress, addToast]);

  const handleFollow = async () => {
    if (!user) return;
    try {
      if (followStatus === 'following') {
        await unfollowUser(user.id);
        setFollowersCount(prev => prev - 1);
        addToast(`Unfollowed ${user.displayName || user.email}`, 'success');
        setFollowStatus('not_following');
      } else if (followStatus === 'requested') {
        await cancelFollowRequest(user.id);
        addToast('Follow request cancelled', 'success');
        setFollowStatus('not_following');
      } else {
        if (user.profilePrivacy === 'private') {
          await sendFollowRequest(user.id);
          addToast('Follow request sent', 'success');
          setFollowStatus('requested');
        } else {
          await followUser(user.id);
          setFollowersCount(prev => prev + 1);
          addToast(`Followed ${user.displayName || user.email}`, 'success');
          setFollowStatus('following');
        }
      }
    } catch (error) {
      console.error('Failed to perform action:', error);
      addToast('Failed to perform action', 'error');
    }
  };

  const handleBlockToggle = async () => {
    if (!user) return;
    try {
      if (isBlocked) {
        await unblockUser(user.id);
        addToast('User unblocked', 'success');
        setIsBlocked(false);
      } else {
        await blockUser(user.id);
        addToast('User blocked', 'success');
        setIsBlocked(true);
      }
    } catch {
      addToast('Failed to update block status', 'error');
    }
  };

  const handleMuteToggle = async () => {
    if (!user) return;
    try {
      if (isMuted) {
        await unmuteUser(user.id);
        addToast('User unmuted', 'success');
        setIsMuted(false);
      } else {
        await muteUser(user.id);
        addToast('User muted', 'success');
        setIsMuted(true);
      }
    } catch {
      addToast('Failed to update mute status', 'error');
    }
  };

  const handleSetNftPfp = async (nft: Nft) => {
    const pfpData = {
      nftPfpUrl: nft.image.cachedUrl,
      nftPfpContractAddress: nft.contract.address,
      nftPfpTokenId: nft.tokenId,
    };
    setIsSettingPfp(pfpData.nftPfpUrl);
    try {
      const updatedUser = await apiSetNftPfp(pfpData);
      setUser(updatedUser);
      setCurrentUser(updatedUser);
      addToast('Profile picture updated!', 'success');
    } catch (error) {
      console.error('Failed to set NFT PFP:', error);
      addToast('Failed to set profile picture', 'error');
    } finally {
      setIsSettingPfp(null);
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!user) return;
    try {
      await removeFollower(followerId);
      setFollowers((prevFollowers) => (prevFollowers ?? []).filter((follower) => follower.id !== followerId));
      setFollowersCount(prev => prev - 1);
      addToast('Follower removed', 'success');
    } catch (error) {
      console.error('Failed to remove follower:', error);
      addToast('Failed to remove follower', 'error');
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      addToast(`${field} copied to clipboard`, 'success');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      addToast('Failed to copy', 'error');
    }
  };

  // Theme lookup is resilient to server theme keys that aren't in the static
  // catalog: fall back to the default, and prefer the user's custom accent or
  // the catalog theme's accent over the static style.
  const catalogTheme = Array.isArray(themeCatalog) ? themeCatalog.find(t => t.key === user?.profileTheme) : undefined;
  const staticTheme = themes[(user?.profileTheme as Theme)] || themes.default;
  const themeAccent = user?.profileThemeColor || catalogTheme?.accent || staticTheme.styles.color || '#000000';
  const customStyles = {
    ...staticTheme.styles,
    ['--primary' as string]: themeAccent,
  } as unknown as React.CSSProperties;

  return (
    <PageShell
      eyebrow="Account"
      title="Profile"
      description="Your identity, wallet, and passkey controls in one calm, high-trust surface."
    >
      <FollowRequests />
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton height={96} />
          <Skeleton height={96} />
          <Skeleton height={120} />
          <Skeleton height={72} />
        </div>
      ) : user ? (
        <div
          className="space-y-4"
          style={customStyles as React.CSSProperties}
        >
          {user.header && (
            <img
              src={user.header}
              alt="Header"
              className="w-full h-48 object-cover"
            />
          )}
          <style>
            {`
              .profile-accent {
                color: ${user.profileAccentColor};
              }
            `}
          </style>
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold profile-accent">
                  {user.displayName || user.email}
                </h1>
                {user.verified && (
                  <BadgeCheck className="h-6 w-6 text-blue-500" aria-label="Verified account" />
                )}
              </div>
              {user.pronouns && <p className="text-lg text-gray-500">({user.pronouns})</p>}
              {user.username && <p className="text-lg text-gray-500">@{user.username}</p>}
            </div>
            {!userId && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsQrOpen(true)}
                  icon={<QrCode size={16} />}
                  ariaLabel="Show profile QR code"
                >
                  QR
                </Button>
                <Link to="/edit-profile">
                  <Button variant="secondary" className="profile-accent">Edit Profile</Button>
                </Link>
              </div>
            )}
            {userId && currentUser && currentUser.id !== user.id && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsQrOpen(true)}
                  icon={<QrCode size={16} />}
                  ariaLabel="Show profile QR code"
                >
                  QR
                </Button>
                <Button onClick={handleFollow}>
                  {followStatus === 'following' ? 'Unfollow' : followStatus === 'requested' ? 'Requested' : 'Follow'}
                </Button>
                <Button
                  variant={isMuted ? 'secondary' : 'outline'}
                  onClick={handleMuteToggle}
                  icon={isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  ariaLabel={isMuted ? 'Unmute user' : 'Mute user'}
                >
                  {isMuted ? 'Muted' : 'Mute'}
                </Button>
                <Button
                  variant={isBlocked ? 'secondary' : 'destructive'}
                  onClick={handleBlockToggle}
                  icon={isBlocked ? <ShieldOff size={16} /> : <Shield size={16} />}
                  ariaLabel={isBlocked ? 'Unblock user' : 'Block user'}
                >
                  {isBlocked ? 'Blocked' : 'Block'}
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="lg:col-span-4">
              {user.bio && <RichText text={user.bio} font={user.profileBioFont} />}
              <div className="flex items-center gap-4 mt-2 text-sm text-dark-500">
                {user.location && <span>{user.location}</span>}
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="profile-accent hover:underline">
                    {user.website}
                  </a>
                )}
              </div>
              {user.isProfessional && (
                <div className="mt-2 text-sm text-dark-500">
                  <span className="font-semibold">{user.categoryLabel}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                {user.contact?.email && (
                  <a href={`mailto:${user.contact.email}`} className="text-blue-500 hover:underline">
                    Email
                  </a>
                )}
                {user.contact?.phone && (
                  <a href={`tel:${user.contact.phone}`} className="text-blue-500 hover:underline">
                    Phone
                  </a>
                )}
                {user.contact?.directions && (
                  <a href={user.contact.directions} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Directions
                  </a>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveList('following')}
              className={`surface-soft p-4 text-left w-full ${activeList === 'following' ? 'ring-2 ring-primary-500' : ''}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">Following</p>
              <p className="mt-2 text-2xl font-semibold text-dark-900 dark:text-white">{followingCount}</p>
            </button>
            <button
              type="button"
              onClick={() => setActiveList('followers')}
              className={`surface-soft p-4 text-left w-full ${activeList === 'followers' ? 'ring-2 ring-primary-500' : ''}`}
            >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">Followers</p>
                <p className="mt-2 text-2xl font-semibold text-dark-900 dark:text-white">{followersCount}</p>
              </button>
              <div className="lg:col-span-4">
                <h3 className="text-lg font-semibold">
                  {activeList === 'followers' ? 'Followers' : 'Following'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {(activeList === 'followers' ? followers : following).map((listUser) => (
                    <div key={listUser.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <Link to={`/profile/${listUser.username || listUser.id}`} className="flex items-center gap-2">
                        <img
                          src={listUser.nftPfpUrl || `https://api.dicebear.com/6.x/micah/svg?seed=${listUser.id}`}
                          alt={listUser.displayName || listUser.username || 'User'}
                          className="h-10 w-10 rounded-full"
                        />
                        <div>
                          <p className="font-bold">{listUser.displayName}</p>
                          <p className="text-sm text-dark-500">@{listUser.username}</p>
                        </div>
                      </Link>
                      {activeList === 'followers' && currentUser?.id === user?.id && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveFollower(listUser.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {(activeList === 'followers' ? followers : following).length === 0 && (
                  <p className="mt-2 text-sm text-dark-500">
                    {activeList === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                  </p>
                )}
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">Reputation</p>
                <p className="mt-2 text-2xl font-semibold text-dark-900 dark:text-white">{reputation}</p>
              </div>
            {mutualFollows.length > 0 && (
              <div className="surface-soft p-4 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">
                  Mutuals
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {mutualFollows.slice(0, 5).map((mutual) => (
                      <Link to={`/profile/${mutual.username || mutual.id}`} key={mutual.id}>
                        <img
                          src={mutual.nftPfpUrl || `https://api.dicebear.com/6.x/micah/svg?seed=${mutual.id}`}
                          alt={mutual.email || 'User'}
                          className="h-8 w-8 rounded-full border-2 border-white dark:border-dark-800"
                        />
                      </Link>
                    ))}
                  </div>
                  <span className="text-sm text-dark-500">
                    {mutualFollows.length} mutual connection{mutualFollows.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
            <div className="surface-soft p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-300">
                  <UserRound size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">Email</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">Primary sign-in identity</p>
                </div>
              </div>
              {user.email ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate font-medium text-dark-900 dark:text-white">{user.email}</p>
                  <button
                    onClick={() => copyToClipboard(user.email!, 'Email')}
                    className="rounded-full border border-dark-200 bg-white p-2 text-dark-500 shadow-sm transition-colors hover:text-primary-600 dark:border-dark-700 dark:bg-dark-900 dark:hover:text-primary-300"
                    aria-label="Copy email"
                  >
                    {copiedField === 'Email' ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                  </button>
                </div>
              ) : (
                <p className="italic text-dark-500">Not set</p>
              )}
            </div>

            <div className="surface-soft p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 dark:bg-accent-950/30 dark:text-accent-300">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">User ID</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">Stable internal identifier</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate font-mono text-sm text-dark-900 dark:text-white">{user.id}</p>
                <button
                  onClick={() => copyToClipboard(user.id, 'User ID')}
                  className="rounded-full border border-dark-200 bg-white p-2 text-dark-500 shadow-sm transition-colors hover:text-primary-600 dark:border-dark-700 dark:bg-dark-900 dark:hover:text-primary-300"
                  aria-label="Copy user ID"
                  >
                    {copiedField === 'User ID' ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>

          {featuredPosts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Featured Posts</h2>
              <PostList
                posts={featuredPosts}
                onDelete={(postId) => setPosts(posts.filter(p => p.id !== postId))}
                onFollow={() => {}}
                onUnfollow={() => {}}
                onToggleFeatured={handleToggleFeatured}
              />
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Posts</h2>
            <PostList
              posts={posts}
              onDelete={(postId) => setPosts(posts.filter(p => p.id !== postId))}
              onFollow={() => {}}
              onUnfollow={() => {}}
              onToggleFeatured={handleToggleFeatured}
            />
          </div>

          <div className="surface-soft flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-title text-xl">Wallet</p>
              <p className="section-subtitle">
                {user.walletAddress ? 'Manage your connected wallet and on-chain identity.' : 'Connect a wallet to unlock on-chain identity.'}
              </p>
            </div>
            <ConnectButton />
          </div>

          {user.walletAddress && (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="surface-soft p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-green-700 dark:text-green-300">
                    Wallet address
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      {ensName && (
                        <p className="truncate font-semibold text-green-900 dark:text-green-200">
                          {ensName}
                        </p>
                      )}
                      <p className="min-w-0 truncate font-mono text-sm text-green-900 dark:text-green-200">
                        {user.walletAddress}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(user.walletAddress!, 'Wallet')}
                      className="rounded-full border border-green-200 bg-white p-2 text-green-600 shadow-sm transition-colors hover:text-green-700 dark:border-green-900/40 dark:bg-dark-900 dark:text-green-300 dark:hover:text-green-200"
                      aria-label="Copy wallet address"
                    >
                      {copiedField === 'Wallet' ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="surface-soft p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">
                    ETH balance
                  </p>
                  {balanceData ? (
                    <p className="text-3xl font-semibold tracking-tight text-dark-900 dark:text-white">
                      {parseFloat(balanceData.formatted).toFixed(4)} {balanceData.symbol}
                    </p>
                  ) : (
                    <p className="text-dark-500">Balance unavailable</p>
                  )}
                </div>
              </div>
              <div className="surface-soft p-5">
                <p className="section-title text-xl">Set NFT Profile Picture</p>
                <p className="section-subtitle">Choose an NFT from your wallet to represent you.</p>
                {isLoadingNfts ? (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="aspect-square w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : nfts.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {nfts.map((nft) => (
                      <div key={nft.image.cachedUrl} className="group relative">
                        <img
                          src={nft.image.cachedUrl}
                          alt={nft.name}
                          className="aspect-square w-full rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            size="sm"
                            onClick={() => handleSetNftPfp(nft)}
                            disabled={isSettingPfp === nft.image.cachedUrl}
                          >
                            {isSettingPfp === nft.image.cachedUrl ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Setting...
                              </>
                            ) : (
                              'Set as PFP'
                            )}
                          </Button>
                        </div>
                        <p className="mt-2 truncate text-sm font-semibold">{nft.name}</p>
                        <p className="truncate text-xs text-gray-500">{nft.collection.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-center text-gray-500">No NFTs found in this wallet.</p>
                )}
              </div>
            </>
          )}

          <div className="surface-soft flex items-center justify-between gap-4 p-5">
            <div>
              <p className="section-title text-xl">Passkeys</p>
              <p className="section-subtitle">Manage your passwordless sign-in methods.</p>
            </div>
            <Link to="/passkeys">
              <Button variant="secondary">Manage Passkeys</Button>
            </Link>
          </div>

        </div>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center text-center">
          <div>
            <p className="section-title text-2xl">Unable to load profile</p>
            <p className="section-subtitle">Please try again after refreshing the page.</p>
          </div>
        </div>
      )}
      {user && (
        <ProfileQrModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          profileId={user.username || user.id}
          displayName={user.displayName || user.username}
        />
      )}
    </PageShell>
  );
}