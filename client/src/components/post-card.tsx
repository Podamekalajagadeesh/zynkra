import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useScreenshotProtection } from '../hooks/useScreenshotProtection';
import { ScreenshotProtectionLevel } from '../lib/types';
import { useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';
import { useToast } from '../contexts/ToastContext';
import { useAppPreferences } from '../contexts/PreferencesContext';
import { useIsPremium } from '../hooks/useIsPremium';
import {
  followUser,
  unfollowUser,
  reportPost,
  addPostReaction,
  createComment,
  getComments,
  updatePost,
  deletePost,
  togglePinPost,
  sendTip,
  blockUser,
  addBookmark,
  removeBookmark,
  addToWatchLater,
  removeFromWatchLater,
  addToReadLater,
  removeFromReadLater,
  searchUsers,
  repost,
  undoRepost,
  createLead,
  pinComment,
  deleteComment,
  lockComment,
  getGifts,
  sendGift,
  translateText,
} from '../lib/api';
import { Button } from './ui/button';
import Avatar from './ui/avatar';
import { MessageCircle, Flag, Edit2, Trash2, X, Check, DollarSign, ShieldOff, Bookmark, Repeat, BarChart, Pin, Star, Scissors, Reply, Lock, Unlock, Award, Info, Clock, BookOpen, Globe, Brain } from 'lucide-react';
import { User as UserType } from '../lib/types';
import { formatDateTime } from '../lib/preferences';
import { ReactionButtons } from './ReactionButtons';
import { CommunityNotes } from './CommunityNotes';
import { ContentWarningBanner } from './moderation/ContentWarningBanner';
import { LowBandwidthMedia } from './LowBandwidthMedia';

interface PostAuthor {
  id: string;
  email: string | null;
  walletAddress: string | null;
  displayName: string | null;
}

interface PostReaction {
  id: string;
  reaction: string;
  user: {
    id: string;
  };
}

interface Award {
  id: string;
  gift: {
    id: string;
    name: string;
    iconUrl: string;
  };
  sender: PostAuthor;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: PostAuthor;
  parentId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  replies?: Comment[];
  awards?: Award[];
}

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  votes: { id: string }[];
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

interface Media {
  url: string;
  type: 'image' | 'video';
  altText?: string;
  captionsUrl?: string;
}

interface ProductTag {
  product_id: string;
  x: number;
  y: number;
}

interface Post {
  id: string;
  content: string;
  media: Media[];
  filter?: string;
  createdAt: string;
  algorithmReasons?: string[];
  user: PostAuthor & {
    screenshotProtection?: {
      enabled: boolean;
      level: string;
      applyToPosts: boolean;
    };
  };
  reactions: PostReaction[];
  comments: Comment[];
  bookmarked?: boolean;
  repostedFrom?: Post;
  reposts?: Post[];
  repostCount?: number;
  poll?: Poll[];
  isSponsored?: boolean;
  isPinned?: boolean;
  isFeatured?: boolean;
  locationName?: string;
  taggedUsers?: PostAuthor[];
  stickerUrl?: string;
  awards?: Award[];
  productTags?: ProductTag[];
  isSensitive?: boolean;
  enableScreenshotProtection?: boolean;
  autoTags?: {
    id: string;
    name: string;
    category: 'topic' | 'genre' | 'format';
    confidence: number;
  }[];
  contentAnalysis?: {
    isHarmful: boolean;
    isMisinformation: boolean;
    harmfulCategories?: string[];
    misinformationTopics?: string[];
    confidenceScore: number;
    flags: any[];
    recommendedAction: string;
    analyzedAt: string;
  };
}

interface UserProfile {
  id: string;
  following: { id: string }[];
}

interface PostCardProps {
  post: Post;
  currentUser: UserProfile | null;
  onDelete: (postId: string) => void;
  onSave: (postId: string) => void;
  isFollowing: boolean;
  onToggleFeatured?: (postId: string, isFeatured: boolean) => void;
  display?: 'list' | 'grid';
}

export function PostCard({
  post,
  currentUser,
  onDelete,
  onSave,
  isFollowing: isFollowingProp,
  onToggleFeatured,
  display = 'list',
}: PostCardProps) {
  const isPremium = useIsPremium();
  // Skip rendering sponsored posts entirely for premium users
  if (post.isSponsored && isPremium) {
    return null;
  }
  // Apply screenshot protection if enabled for this post
  const shouldApplyProtection = post.enableScreenshotProtection || 
    (post.user.screenshotProtection?.enabled && post.user.screenshotProtection?.applyToPosts);
  
  const { protectionRef } = useScreenshotProtection({
    enabled: shouldApplyProtection,
    level: (post.user.screenshotProtection?.level as ScreenshotProtectionLevel) || ScreenshotProtectionLevel.WARNING_ONLY,
    contentTitle: 'this post',
  });
  const { autoTranslate, language, contentWarningsEnabled } = useAppPreferences();
  const [isFollowing, setIsFollowing] = useState(isFollowingProp);
  const { addToast } = useToast();
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'human' | 'animal' | 'dialect' | null>(null);
  const [translationConfidence, setTranslationConfidence] = useState<number | null>(null);

  // Auto-translate post content if auto-translate is enabled
  useEffect(() => {
    if (autoTranslate && !translatedContent && post.content) {
      const targetLang = language === 'system' ? 'en' : language;
      // Only translate if content is not empty and target is different
      if (targetLang !== 'en') {
        const translate = async () => {
          setIsTranslating(true);
          try {
            const result = await translateText(post.content, targetLang);
            setTranslatedContent(result.translatedText);
            setDetectedLanguage(result.detectedSourceLanguage);
            setSourceType(result.sourceType);
            setTranslationConfidence(result.confidence);
          } catch (error) {
            console.error('Failed to translate post:', error);
          } finally {
            setIsTranslating(false);
          }
        };
        translate();
      }
    }
  }, [autoTranslate, language, post.content, translatedContent]);

  const handleManualTranslate = async () => {
    if (translatedContent) {
      // Show original if already translated
      setTranslatedContent(null);
      return;
    }
    const targetLang = language === 'system' ? 'en' : language;
    setIsTranslating(true);
    try {
      const result = await translateText(post.content, targetLang);
      setTranslatedContent(result.translatedText);
      setDetectedLanguage(result.detectedSourceLanguage);
      setSourceType(result.sourceType);
      setTranslationConfidence(result.confidence);
    } catch (error) {
      console.error('Failed to translate post:', error);
      addToast('Failed to translate post', 'error');
    } finally {
      setIsTranslating(false);
    }
  };
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [lockedComments, setLockedComments] = useState<Set<string>>(new Set());
  const [isPromoting, setIsPromoting] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState('0.01');
  const [isAwards, setIsAwards] = useState(false);
  const [gifts, setGifts] = useState<any[]>([]);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarked || false);
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [isInReadLater, setIsInReadLater] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [showInstantForm, setShowInstantForm] = useState(false);
  const [showAlgorithmReasons, setShowAlgorithmReasons] = useState(false);
  const [isNeuralConsumptionActive, setIsNeuralConsumptionActive] = useState(false);
  const [isNeuralProcessing, setIsNeuralProcessing] = useState(false);
  const [neuralConsumptionMetadata, setNeuralConsumptionMetadata] = useState<any>(null);

  // Neural content consumption functionality - consume content directly through neural implant
  const startNeuralConsumption = async () => {
    try {
      setIsNeuralConsumptionActive(true);
      setIsNeuralProcessing(true);
      addToast('Neural implant connected! Beginning direct content consumption...', 'success');
      
      // Simulate neural transmission that sends the content directly to the user's brain
      // In a real implementation, this would connect to the neural implant's API to transmit the full sensory content
      const neuralProcessingTimeout = setTimeout(() => {
        // Generate full sensory metadata for neural consumption
        const sensoryMetadata = {
          contentTransmitted: post.content,
          mediaUrls: post.media.map(m => m.url),
          emotionalContext: extractEmotionalContext(post.content),
          sensoryCues: generateSensoryCues(post.content),
          transmissionComplete: true,
          consumedAt: new Date().toISOString()
        };
        
        setNeuralConsumptionMetadata(sensoryMetadata);
        setIsNeuralProcessing(false);
        addToast('Content fully consumed! The post has been directly transmitted to your neural implant.', 'success');
      }, 4000);
      
    } catch (error) {
      console.error('Failed to initialize neural consumption:', error);
      addToast('Failed to connect to neural implant. Please check your device settings.', 'error');
      setIsNeuralConsumptionActive(false);
      setIsNeuralProcessing(false);
    }
  };

  const stopNeuralConsumption = () => {
    setIsNeuralConsumptionActive(false);
    setIsNeuralProcessing(false);
    setNeuralConsumptionMetadata(null);
    addToast('Neural consumption stopped', 'info');
  };

  // Helper to extract emotional context from post content
  const extractEmotionalContext = (content: string) => {
    const emotionKeywords = {
      joy: ['excited', 'happy', 'amazing', 'wonderful', 'love', 'grateful', 'beautiful'],
      excitement: ['incredible', 'next level', 'masterpiece', 'passionate', 'rewarding'],
      calm: ['calm', 'quiet', 'sunlight', 'peaceful', 'serene'],
      surprise: ['caught me off guard', 'still processing', 'incredible', 'unbelievable'],
      sadness: ['stressed', 'worried', 'angry', 'hurt', 'sad'],
      anticipation: ['looking forward', 'can\'t stop thinking', 'excited']
    };

    const detectedEmotions: Record<string, number> = {};
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      const matches = keywords.filter(keyword => content.toLowerCase().includes(keyword)).length;
      if (matches > 0) {
        detectedEmotions[emotion] = Math.min(matches * 0.2, 0.95);
      }
    });
    
    return detectedEmotions;
  };

  // Generate sensory cues based on post content
  const generateSensoryCues = (content: string) => {
    const cues: string[] = [];
    if (content.includes('coffee') || content.includes('café')) cues.push('warmth of coffee', 'rich aroma');
    if (content.includes('hiking') || content.includes('mountains')) cues.push('fresh mountain air', 'crunch of leaves underfoot');
    if (content.includes('beach') || content.includes('sunset')) cues.push('ocean breeze', 'warm sand', 'sunset colors');
    if (content.includes('music') || content.includes('album')) cues.push('rich audio frequencies', 'rhythmic vibration');
    if (content.includes('friends') || content.includes('reunion')) cues.push('laughter vibration', 'warm embrace sensation');
    
    // Add default cues if none detected
    if (cues.length === 0) cues.push('neutral baseline sensory transmission', 'text-to-neural conversion complete');
    
    return cues;
  };

  const handleAdClick = () => {
    if (post.isSponsored && post.creative?.instantForm) {
      setShowInstantForm(true);
    }
  };


  const handleAddBookmark = async (collectionId: string | null = null) => {
    try {
      await addBookmark(post.id, collectionId);
      setIsBookmarked(true);
      setShowCollections(false);
      addToast('Post bookmarked!', 'success');
    } catch (error) {
      console.error('Failed to bookmark post:', error);
      addToast('Failed to bookmark post', 'error');
    }
  };

  const handleBookmarkClick = async () => {
    if (isBookmarked) {
      handleRemoveBookmark();
    } else {
        setShowSaveOptions(true);
    }
  };

  const handleAddToCollection = async () => {
    try {
      const response = await api.get('/collections');
      setCollections(response.data);
      setShowSaveOptions(false);
      setShowCollections(true);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      addToast('Failed to fetch collections', 'error');
    }
  };

  const handleRemoveBookmark = async () => {
    try {
      await removeBookmark(post.id);
      setIsBookmarked(false);
      addToast('Bookmark removed', 'success');
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      addToast('Failed to remove bookmark', 'error');
    }
  };

  const handleAddToWatchLater = async () => {
    try {
      if (isInWatchLater) {
        await removeFromWatchLater(post.id);
        setIsInWatchLater(false);
        addToast('Removed from watch later', 'success');
      } else {
        await addToWatchLater(post.id);
        setIsInWatchLater(true);
        addToast('Added to watch later', 'success');
      }
      setShowSaveOptions(false);
    } catch (error) {
      console.error('Failed to toggle watch later:', error);
      addToast('Failed to update watch later list', 'error');
    }
  };

  const handleAddToReadLater = async () => {
    try {
      if (isInReadLater) {
        await removeFromReadLater(post.id);
        setIsInReadLater(false);
        addToast('Removed from read later', 'success');
      } else {
        await addToReadLater(post.id);
        setIsInReadLater(true);
        addToast('Added to read later', 'success');
      }
      setShowSaveOptions(false);
    } catch (error) {
      console.error('Failed to toggle read later:', error);
      addToast('Failed to update read later list', 'error');
    }
  };

  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserType[]>([]);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);
  const [isReposted, setIsReposted] = useState(
    post.reposts?.some((repost) => repost.user.id === currentUser?.id) || false,
  );
  const [isPinned, setIsPinned] = useState(post.isPinned || false);

  const handleTogglePin = async () => {
    try {
      await togglePinPost(post.id);
      setIsPinned(!isPinned);
      addToast(isPinned ? 'Post unpinned' : 'Post pinned to your profile', 'success');
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      addToast('Failed to toggle pin', 'error');
    }
  };

  const handleRepost = async () => {
    try {
      await repost(post.id);
      setRepostCount(repostCount + 1);
      setIsReposted(true);
      addToast('Post reposted!', 'success');
    } catch (error) {
      console.error('Failed to repost post:', error);
      addToast('Failed to repost post', 'error');
    }
  };

  const handleUndoRepost = async () => {
    try {
      await undoRepost(post.id);
      setRepostCount(repostCount - 1);
      setIsReposted(false);
    } catch (error) {
      console.error('Failed to undo repost:', error);
      addToast('Failed to undo repost', 'error');
    }
  };

  const handleVote = async (pollOptionId: string) => {
    try {
      const updatedPoll = await voteOnPoll(pollOptionId);
      // Find the poll in the post and update it
      const newPolls = post.poll.map(p => p.id === updatedPoll.id ? updatedPoll : p);
      // This is a bit of a hack, but it's the easiest way to update the post
      // without having to refetch the entire post
      post.poll = newPolls;
      addToast('Voted successfully!', 'success');
    } catch (error) {
      console.error('Failed to vote on poll:', error);
      addToast('Failed to vote on poll', 'error');
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setComment(text);

    const mentionMatch = text.match(/@(\w+)$/);
    if (mentionMatch) {
      setUserSearch(mentionMatch[1]);
    } else {
      setUserSearch('');
      setUserSearchResults([]);
    }
  };

  const handleAddTaggedUserToComment = (user: UserType) => {
    const newContent = comment.replace(/@(\w+)$/, `@${user.username} `);
    setComment(newContent);
    setUserSearch('');
    setUserSearchResults([]);
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const fetchedComments = await getComments(post.id);
        // Build nested comment structure
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];
        
        // First pass: add all comments to map
        fetchedComments.forEach((comment: Comment) => {
          commentMap.set(comment.id, { ...comment, replies: [] });
        });
        
        // Second pass: build hierarchy
        fetchedComments.forEach((comment: Comment) => {
          const commentWithReplies = commentMap.get(comment.id)!;
          if (comment.parentId && commentMap.has(comment.parentId)) {
            // Add as reply to parent
            const parent = commentMap.get(comment.parentId)!;
            parent.replies!.push(commentWithReplies);
          } else {
            // Root level comment (no parent or parent not found)
            rootComments.push(commentWithReplies);
          }
        });
        
        // Sort comments: pinned first, then by date (newest first)
        const sortedComments = rootComments.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setComments(sortedComments);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    };

    if (showComments) {
      fetchComments();
    }
  }, [post.id, showComments]);

  useEffect(() => {
    if (userSearch) {
      searchUsers(userSearch).then(setUserSearchResults);
    } else {
      setUserSearchResults([]);
    }
  }, [userSearch]);

  const handleFollow = async () => {
    try {
      await followUser(post.user.id);
      setIsFollowing(true);
      addToast('User followed!', 'success');
    } catch (error) {
      console.error('Failed to follow user:', error);
      addToast('Failed to follow user', 'error');
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollowUser(post.user.id);
      setIsFollowing(false);
      addToast('User unfollowed', 'success');
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      addToast('Failed to unfollow user', 'error');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      addToast('Please provide a reason for the report', 'warning');
      return;
    }
    try {
      await reportPost(post.id, reportReason);
      addToast('Post reported successfully', 'success');
      setIsReporting(false);
      setReportReason('');
    } catch (error) {
      console.error('Failed to report post:', error);
      addToast('Failed to report post', 'error');
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) {
      return;
    }
    try {
      const newComment = await createComment(post.id, comment, replyingTo || undefined);
      setComments([...comments, newComment]);
      setComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handlePinComment = async (commentId: string) => {
    try {
      await pinComment(post.id, commentId);
      // Update comment's pinned status
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, isPinned: !c.isPinned } : c
      ));
      addToast('Comment pin status updated', 'success');
    } catch (error) {
      console.error('Failed to pin comment:', error);
      addToast('Failed to update comment pin status', 'error');
    }
  };

  const handleLockComment = async (commentId: string) => {
    try {
      await lockComment(post.id, commentId);
      // Update comment's locked status
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, isLocked: !c.isLocked } : c
      ));
      addToast(`Comment ${!comments.find(c => c.id === commentId)?.isLocked ? 'locked' : 'unlocked'}`, 'success');
    } catch (error) {
      console.error('Failed to lock comment:', error);
      addToast('Failed to update comment lock status', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment(post.id, commentId);
      setComments(comments.filter(c => c.id !== commentId));
      addToast('Comment deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      addToast('Failed to delete comment', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editedContent.trim()) {
      return;
    }
    try {
      await updatePost(post.id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const handleDelete = async () => {
    if (currentUser?.id !== post.user.id) {
      addToast('You are not authorized to delete this post', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(post.id);
      addToast('Post deleted successfully', 'success');
      onDelete(post.id);
    } catch (error) {
      console.error('Failed to delete post:', error);
      addToast('Failed to delete post', 'error');
    }
  };

  const handleTip = async () => {
    if (!address) {
      addToast('Please connect your wallet to send a tip', 'warning');
      return;
    }
    if (!post.user.walletAddress) {
      addToast('This user has not connected a wallet and cannot receive tips', 'error');
      return;
    }
    if (parseFloat(tipAmount) <= 0) {
      addToast('Please enter a valid tip amount', 'warning');
      return;
    }

    try {
      const tx = (await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: address,
            to: post.user.walletAddress,
            value: parseEther(tipAmount).toString(),
          },
        ],
      })) as string;

      await sendTip({
        fromAddress: address,
        toAddress: post.user.walletAddress,
        amount: parseFloat(tipAmount),
        txHash: tx,
        postId: post.id,
      });

      addToast(`Successfully sent a ${tipAmount} ETH tip!`, 'success');
      setIsTipping(false);
    } catch (error) {
      console.error('Failed to send tip:', error);
      addToast('Failed to send tip', 'error');
    }
  };

  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);

  const loadGifts = async (commentId?: string) => {
    try {
      const giftsData = await getGifts();
      setGifts(giftsData);
      setIsAwards(true);
      setPendingCommentId(commentId || null);
    } catch (error) {
      console.error('Failed to load gifts:', error);
      addToast('Failed to load awards', 'error');
    }
  };

  const handleSendAward = async () => {
    if (!selectedGift) {
      addToast('Please select an award to send', 'warning');
      return;
    }
    if (!currentUser) {
      addToast('Please log in to send an award', 'warning');
      return;
    }

    try {
      await sendGift(post.user.id, selectedGift.id, post.id, pendingCommentId || undefined);
      addToast(`Successfully sent the ${selectedGift.name} award!`, 'success');
      setIsAwards(false);
      setSelectedGift(null);
      setPendingCommentId(null);
    } catch (error) {
      console.error('Failed to send award:', error);
      addToast('Failed to send award', 'error');
    }
  };

  const handleBlock = async () => {
    if (!currentUser) {
      addToast('You must be logged in to block users', 'warning');
      return;
    }
    if (currentUser.id === post.user.id) {
      addToast("You can't block yourself", 'warning');
      return;
    }
    try {
      await blockUser(post.user.id);
      setIsBlocked(true);
      addToast('User blocked', 'success');
    } catch (error) {
      console.error('Failed to block user:', error);
      addToast('Failed to block user', 'error');
    }
  };

  const formatDate = (date: string) => {
    return formatDateTime(date, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasBeenEdited = post.updatedAt && post.updatedAt !== post.createdAt;
  const [showEditHistory, setShowEditHistory] = useState(false);

  if (display === 'grid') {
    return (
      <Link to={`/posts/${post.id}`} className="relative aspect-square block">
        {post.media && post.media.length > 0 && (
          <>
            {post.media[0].type === 'video' ? (
              <LowBandwidthMedia
                src={post.media[0].url}
                alt={post.media[0].altText || 'Post content'}
                type="video"
                className="w-full h-full object-cover"
                controls={false}
                fallbackText="Video content is hidden to save bandwidth."
              />
            ) : (
              <LowBandwidthMedia
                src={post.media[0].url}
                alt={post.media[0].altText || 'Post content'}
                type="image"
                className={`w-full h-full object-cover ${post.filter}`}
                fallbackText="Image content is hidden to save bandwidth."
              />
            )}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {post.isFeatured && <Star size={16} className="text-white" />}
          {post.isPinned && <Pin size={16} className="text-white" />}
          {post.media.length > 1 && (
            <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {post.media.length}
            </span>
          )}
        </div>
          </>
        )}
      </Link>
    );
  }

  const originalPost = post.repostedFrom || post;
  const displayName = originalPost.user.displayName || originalPost.user.email || originalPost.user.walletAddress || 'Anonymous';

  const renderContent = (content: string) => {
    const parts = content.split(/(#\w+|@\w+)/g);
    return parts.map((part, i) => {
      if (part.match(/#\w+/)) {
        const tagName = part.substring(1);
        return (
          <Link
            key={i}
            to={`/hashtag/${tagName}`}
            className="text-blue-500 hover:underline"
          >
            {part}
          </Link>
        );
      }
      if (part.match(/@\w+/)) {
        const username = part.substring(1);
        return (
          <Link
            key={i}
            to={`/users/${username}`}
            className="text-primary-600 hover:underline"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const InstantFormModal = ({ form, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({});

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">{form.name}</h2>
          <form onSubmit={handleSubmit}>
            {form.fields.map((field) => (
              <div key={field.name} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                {field.type === 'text' && (
                  <input
                    type="text"
                    name={field.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                )}
                {field.type === 'email' && (
                  <input
                    type="email"
                    name={field.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                )}
                {field.type === 'phone' && (
                  <input
                    type="tel"
                    name={field.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                )}
                {field.type === 'dropdown' && (
                  <select
                    name={field.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{form.callToAction || 'Submit'}</Button>
            </div>
          </form>
        </div>
      </div>
    );
  };


  return (
    <div className="card-hover mb-lg p-5 animate-fade-in sm:p-6" role="article" aria-labelledby={`post-content-${post.id}`}>
      {post.repostedFrom && (
        <div className="mb-2 text-sm text-dark-500">
          <Repeat size={14} className="inline-block mr-1" />
          Reposted by{' '}
          <Link to={`/users/${post.user.id}`} className="font-semibold hover:underline">
            {post.user.email || post.user.walletAddress}
          </Link>
        </div>
      )}
      {/* Post Header */}
      <div className="mb-md flex items-center justify-between">
        <Link to={`/users/${post.repostedFrom ? post.repostedFrom.user.id : post.user.id}`} className="flex items-center gap-md hover:opacity-80 transition-opacity">
          <Avatar name={displayName} size={48} />
          <div>
            <h3 className="font-semibold text-dark-900 hover:text-primary-600">
              {displayName}
            </h3>
            {post.taggedUsers && post.taggedUsers.length > 0 && (
              <span className="text-sm text-dark-500 ml-1">
                is with
                {post.taggedUsers.map((user, index) => (
                  <Link key={user.id} to={`/users/${user.id}`} className="font-semibold hover:underline ml-1">
                    {user.displayName}
                    {index < post.taggedUsers.length - 1 ? ',' : ''}
                  </Link>
                ))}
              </span>
            )}
            <p className="text-xs text-dark-500">
              {formatDate(post.repostedFrom ? post.repostedFrom.createdAt : post.createdAt)}
              {post.locationName && (
                <span className="ml-2">· {post.locationName}</span>
              )}
              {hasBeenEdited && (
                <span className="ml-2">· <button onClick={() => setShowEditHistory(!showEditHistory)} className="underline">Edited</button></span>
              )}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-sm">
          {post.isSponsored && !post.creative?.instantForm && <span className="ml-2 font-semibold text-gray-500">Sponsored</span>}
          {post.isSponsored && post.creative?.instantForm && (
            <Button onClick={handleAdClick} size="sm">
              {post.creative.instantForm.callToAction || 'Learn More'}
            </Button>
          )}
          {currentUser && currentUser.id !== originalPost.user.id && (
            <Button 
              variant={isFollowing ? 'secondary' : 'primary'}
              size="sm"
              className="rounded-full"
              onClick={() => isFollowing ? handleUnfollow() : handleFollow()}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
          {currentUser && currentUser.id === post.user.id && (post.user.subscription?.active || post.user.isPremium) && (
            <div className="flex gap-sm">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="rounded-xl border border-dark-200 bg-white p-2 text-dark-600 transition-colors hover:bg-dark-100 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={handleTogglePin}
                className="rounded-xl border border-dark-200 bg-white p-2 text-dark-600 transition-colors hover:bg-dark-100 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700"
                title={post.isPinned ? 'Unpin from profile' : 'Pin to your profile'}
              >
                <Pin size={18} />
              </button>
              <button
                onClick={() => onToggleFeatured?.(post.id, !post.isFeatured)}
                className="rounded-xl border border-dark-200 bg-white p-2 text-dark-600 transition-colors hover:bg-dark-100 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700"
                title={post.isFeatured ? 'Unfeature' : 'Feature'}
              >
                <Star size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      {isEditing ? (
        <div className="mb-md">
          <textarea
            className="textarea-field mb-md rounded-2xl border-dark-200 bg-white/90 dark:border-dark-700 dark:bg-dark-900/70"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <div className="flex gap-sm">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleUpdate}
              icon={<Check size={16} />}
            >
              Save
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
              icon={<X size={16} />}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-md" id={`post-content-${post.id}`} ref={protectionRef}>
          {/* Content warning banner if post has harmful content, misinformation, or deepfake/synthetic content and user has warnings enabled */}
          {contentWarningsEnabled && post.contentAnalysis && (
            post.contentAnalysis.isHarmful || 
            post.contentAnalysis.isMisinformation ||
            post.contentAnalysis.flags.some(f => f.type === 'deepfake' || f.type === 'synthetic_content')
          ) && (
            <div className="mb-4">
              <ContentWarningBanner 
                analysis={post.contentAnalysis}
                showDismiss={false}
              />
            </div>
          )}
          
          {/* AI-generated auto-tags display */}
          {post.autoTags && post.autoTags.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">AI-categorized topics:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.autoTags.map(tag => (
                  <Link 
                    key={tag.id}
                    to={`/hashtag/${tag.name}`}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {post.isFeatured && (
            <div className="mb-2 text-sm text-yellow-500">
              <Star size={14} className="inline-block mr-1" />
              Featured Post
            </div>
          )}
          <div className="mb-2">
            <p className="text-dark-800 dark:text-dark-100 whitespace-pre-wrap relative">
              {isTranslating ? (
                <span className="text-dark-400 dark:text-dark-500">Translating...</span>
              ) : translatedContent ? (
                <>
                  {renderContent(translatedContent)}
                  <span className="text-xs text-dark-500 dark:text-dark-400 block mt-1">
                    Translated from {detectedLanguage || 'unknown language'} 
                    {sourceType === 'animal' && ' • 🐾 Animal communication'}
                    {sourceType === 'dialect' && ' • 🌍 Rare human dialect'}
                    {translationConfidence && ` • ${Math.round(translationConfidence * 100)}% confidence`}
                    • <button onClick={handleManualTranslate} className="underline">Show original</button>
                  </span>
                </>
              ) : (
                <>
                  {renderContent(originalPost.content)}
                  <button 
                    onClick={handleManualTranslate}
                    className="inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 mt-1"
                    disabled={isTranslating}
                  >
                    <Globe size={12} />
                    {isTranslating ? 'Translating...' : 'Translate post'}
                  </button>
                </>
              )}
            </p>
          </div>
          {originalPost.stickerUrl && (
            <div className="mt-2 relative">
              <img src={originalPost.stickerUrl} alt="sticker" className="w-full h-auto rounded-md" />
            </div>
          )}
          {showEditHistory && post.editHistory && post.editHistory.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-semibold mb-3 text-dark-700 dark:text-light-200">Edit history</h4>
              <ul className="space-y-3">
                {post.editHistory.map((edit, index) => (
                  <li key={edit.id} className="text-xs text-dark-600 dark:text-dark-300">
                    <span className="font-medium">{formatDate(edit.editedAt)}</span>
                    <p className="mt-1 whitespace-pre-wrap">{edit.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Algorithmic Transparency - Why this post? */}
      {post.algorithmReasons && post.algorithmReasons.length > 0 && (
        <div className="mb-md">
          <button
            onClick={() => setShowAlgorithmReasons(!showAlgorithmReasons)}
            className="flex items-center gap-1 text-xs text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200"
          >
            <Info size={14} />
            Why this post?
          </button>
          {showAlgorithmReasons && (
            <div className="mt-2 p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
              <h4 className="text-sm font-semibold mb-2 text-dark-700 dark:text-light-200">Why you're seeing this post</h4>
              <ul className="text-xs text-dark-600 dark:text-dark-300 space-y-1">
                {post.algorithmReasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {post.poll && post.poll.length > 0 && (
        <div className="mb-md">
          <h4 className="font-semibold text-dark-900 mb-sm">{post.poll[0].question}</h4>
          <div className="space-y-2">
            {post.poll[0].options.map((option) => {
              const totalVotes = post.poll[0].options.reduce((acc, o) => acc + o.voteCount, 0);
              const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
              const hasVoted = post.poll[0].options.some(o => o.votes.some(v => v.id === currentUser?.id));

              return (
                <div key={option.id}>
                  {hasVoted ? (
                    <div className="relative h-8 w-full rounded-full bg-dark-200 dark:bg-dark-700">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full bg-primary-500"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <span className="font-medium text-dark-900 dark:text-dark-100">{option.text}</span>
                        <span className="text-sm font-semibold text-dark-900 dark:text-dark-100">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleVote(option.id)}
                    >
                      {option.text}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Media */}
      {post.media && post.media.length > 0 && (
        <div className="mb-md">
          {post.media.length > 1 ? (
            <div className="relative">
              <div className="carousel">
                {post.media.map((mediaItem, mediaIndex) => (
                  <div key={mediaItem.url} className="carousel-item relative">
                    <Link to={`/posts/${post.id}`} className="block">
                      {mediaItem.type === 'video' ? (
                        <LowBandwidthMedia
                          src={mediaItem.url}
                          alt={mediaItem.altText || 'Post content'}
                          type="video"
                          className="h-auto max-h-96 w-full rounded-2xl border border-dark-200 object-cover dark:border-dark-700"
                          captionsUrl={mediaItem.captionsUrl}
                          controls
                          fallbackText="Video content is hidden to save bandwidth."
                        />
                      ) : mediaItem.type === 'audio' ? (
                        <LowBandwidthMedia
                          src={mediaItem.url}
                          alt={mediaItem.altText || 'Post content'}
                          type="audio"
                          className="w-full rounded-2xl border border-dark-200 dark:border-dark-700"
                          controls
                          fallbackText="Audio content is hidden to save bandwidth."
                        />
                      ) : (
                        <LowBandwidthMedia
                          src={mediaItem.url}
                          alt={mediaItem.altText || 'Post content'}
                          type="image"
                          className={`h-auto max-h-96 w-full rounded-2xl border border-dark-200 object-cover dark:border-dark-700 ${post.filter}`}
                          fallbackText="Image content is hidden to save bandwidth."
                        />
                      )}
                    </Link>
                    {/* Render product tags only on first media item in carousel */}
                    {mediaIndex === 0 && post.productTags && post.productTags.map((tag, index) => (
                      <Link
                        key={index}
                        to={`/marketplace/products/${tag.product_id}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-800 rounded-full p-2 shadow-lg hover:scale-110 transition-transform cursor-pointer z-10"
                        style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                        title="View product"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative">
              <Link to={`/posts/${post.id}`} className="block">
                {post.media[0].type === 'video' ? (
                  <LowBandwidthMedia
                    src={post.media[0].url}
                    alt={post.media[0].altText || 'Post content'}
                    type="video"
                    className="h-auto max-h-96 w-full rounded-2xl border border-dark-200 object-cover dark:border-dark-700"
                    captionsUrl={post.media[0].captionsUrl}
                    controls
                    fallbackText="Video content is hidden to save bandwidth."
                  />
                ) : post.media[0].type === 'audio' ? (
                  <LowBandwidthMedia
                    src={post.media[0].url}
                    alt={post.media[0].altText || 'Post content'}
                    type="audio"
                    className="w-full rounded-2xl border border-dark-200 dark:border-dark-700"
                    controls
                    fallbackText="Audio content is hidden to save bandwidth."
                  />
                ) : (
                  <LowBandwidthMedia
                    src={post.media[0].url}
                    alt={post.media[0].altText || 'Post content'}
                    type="image"
                    className={`h-auto max-h-96 w-full rounded-2xl border border-dark-200 object-cover dark:border-dark-700 ${post.filter}`}
                    fallbackText="Image content is hidden to save bandwidth."
                  />
                )}
              </Link>
              {/* Render product tags */}
              {post.productTags && post.productTags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/marketplace/products/${tag.product_id}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-800 rounded-full p-2 shadow-lg hover:scale-110 transition-transform cursor-pointer z-10"
                  style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                  title="View product"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Awards */}
      {post.awards && post.awards.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {post.awards.map((award, index) => (
            <div key={`${award.id}-${index}`} className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full text-xs">
              <img src={award.gift.iconUrl} alt={award.gift.name} className="w-4 h-4" />
              <span className="text-yellow-800 dark:text-yellow-200">{award.gift.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Neural consumption status indicator */}
      {isNeuralProcessing && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full"></div>
            <span className="text-sm text-purple-700 dark:text-purple-300">Transmitting content to your neural implant...</span>
          </div>
        </div>
      )}
      {neuralConsumptionMetadata && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">Content successfully consumed!</span>
          </div>
          {neuralConsumptionMetadata.sensoryCues && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-green-700 dark:text-green-400">Sensory cues transmitted:</span>
              {neuralConsumptionMetadata.sensoryCues.map((cue: string, idx: number) => (
                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                  {cue}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center gap-3 border-t border-dark-200 pt-md dark:border-dark-700">
        <ReactionButtons postId={post.id} />
        
        {/* Neural consumption button */}
        <Button
          type="button"
          size="sm"
          variant={isNeuralConsumptionActive ? "destructive" : "secondary"}
          onClick={isNeuralConsumptionActive ? stopNeuralConsumption : startNeuralConsumption}
          className="flex items-center gap-1"
        >
          <Brain size={16} />
          {isNeuralProcessing ? "Consuming..." : isNeuralConsumptionActive ? "Stop" : "Neural Consume"}
        </Button>

        <button
          onClick={() => onSave(post.id)}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-dark-600 transition-all hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-700"
          title="Save to collection"
        >
          <Bookmark size={18} />
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-dark-600 transition-all hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-700"
          aria-label="View comments"
          aria-expanded={showComments}
          title="Comments"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium">{comments.length}</span>
        </button>

        <button
          onClick={() => isReposted ? handleUndoRepost() : handleRepost()}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
            isReposted
              ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300'
              : 'text-dark-600 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-700'
          }`}
          aria-label={isReposted ? 'Undo repost' : 'Repost this post'}
          aria-pressed={isReposted}
          title={isReposted ? 'Undo repost' : 'Repost'}
        >
          <Repeat size={18} />
          <span className="text-sm font-medium">{repostCount}</span>
        </button>

        {post.media.some(m => m.type === 'video') && (
          <button
            onClick={() => {
              // Navigate to shorts editor with this video imported as a clip
              window.location.href = `/shorts/editor?import=${encodeURIComponent(post.media[0].url)}`;
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-dark-600 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-700"
            aria-label="Stitch this video"
            title="Stitch"
          >
            <Scissors size={18} />
            <span className="text-sm font-medium">Stitch</span>
          </button>
        )}

        <button
          onClick={handleBookmarkClick}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
            isBookmarked
              ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-300'
              : 'text-dark-600 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-700'
          }`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
          aria-pressed={isBookmarked}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
        >
          <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>

        {showSaveOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSaveOptions(false)}>
            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4">Save Post</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleAddToCollection()}
                  className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-3"
                >
                  <Bookmark className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Add to collection</p>
                    <p className="text-sm text-gray-500">Save to a custom collection</p>
                  </div>
                </button>
                {post.media.some(m => m.type === 'video') && (
                  <button
                    onClick={handleAddToWatchLater}
                    className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-3 ${isInWatchLater ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <Clock className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{isInWatchLater ? 'Remove from Watch Later' : 'Add to Watch Later'}</p>
                      <p className="text-sm text-gray-500">Save this video to watch later</p>
                    </div>
                  </button>
                )}
                <button
                  onClick={handleAddToReadLater}
                  className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-3 ${isInReadLater ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                >
                  <BookOpen className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{isInReadLater ? 'Remove from Read Later' : 'Add to Read Later'}</p>
                    <p className="text-sm text-gray-500">Save this post to read later</p>
                  </div>
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" onClick={() => setShowSaveOptions(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {showCollections && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Add to Collection</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleAddBookmark()}
                  className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  Unsorted
                </button>
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleAddBookmark(collection.id)}
                    className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    {collection.name}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" onClick={() => setShowCollections(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentUser && (
          <div className="ml-auto flex items-center gap-2">
            <GiftButton recipientId={originalPost.user.id} postId={originalPost.id} />
            <button
              onClick={loadGifts}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-dark-600 transition-all hover:bg-yellow-50 hover:text-yellow-600 dark:text-dark-300 dark:hover:bg-yellow-950/40 dark:hover:text-yellow-300"
              aria-label="Award post"
              title="Award post"
            >
              <Award size={18} />
              <span className="text-sm">Award</span>
            </button>
            {post.user.walletAddress && (
              <button
                onClick={() => setIsTipping(!isTipping)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-dark-600 transition-all hover:bg-green-50 hover:text-green-600 dark:text-dark-300 dark:hover:bg-green-950/40 dark:hover:text-green-300"
                aria-label="Tip user"
                title="Tip user"
              >
                <DollarSign size={18} />
                <span className="text-sm">Tip</span>
              </button>
            )}
            <button
              onClick={() => setIsReporting(!isReporting)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-dark-600 transition-all hover:bg-red-50 hover:text-red-600 dark:text-dark-300 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              aria-label="Report post"
              title="Report post"
            >
              <Flag size={18} />
              <span className="text-sm">Report</span>
            </button>
            {isBlocked ? (
              <Button variant="destructive" size="icon" disabled>
                <ShieldOff />
              </Button>
            ) : (
              <button
                onClick={handleBlock}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-dark-600 transition-all hover:bg-red-50 hover:text-red-600 dark:text-dark-300 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                aria-label="Block user"
                title="Block user"
              >
                <ShieldOff size={18} />
                <span className="text-sm">Block</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tip Form */}
      {isTipping && (
        <div className="mt-md rounded-2xl border border-green-200 bg-green-50 p-md dark:border-green-900/40 dark:bg-green-950/25">
          <h4 className="mb-sm font-semibold text-green-900 dark:text-green-200">Send a Tip</h4>
          <div className="flex items-center gap-sm">
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input-field w-full rounded-xl border-green-200 bg-white dark:border-green-900/60 dark:bg-dark-900"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
            />
            <span className="font-semibold text-green-900 dark:text-green-200">ETH</span>
          </div>
          <p className="text-xs text-dark-500 mt-xs">Your balance: {balance?.formatted} {balance?.symbol}</p>
          <div className="flex gap-sm mt-md">
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleTip}
            >
              Send Tip
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsTipping(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Awards Form */}
      {isAwards && (
        <div className="mt-md rounded-2xl border border-yellow-200 bg-yellow-50 p-md dark:border-yellow-900/40 dark:bg-yellow-950/25">
          <h4 className="mb-sm font-semibold text-yellow-900 dark:text-yellow-200">Send an Award</h4>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {gifts.map((gift) => (
              <button
                key={gift.id}
                onClick={() => setSelectedGift(gift)}
                className={`p-2 rounded-lg border-2 transition-all ${
                  selectedGift?.id === gift.id
                    ? 'border-yellow-500 bg-yellow-100 dark:border-yellow-400 dark:bg-yellow-900/50'
                    : 'border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-800'
                }`}
              >
                <img 
                  src={gift.iconUrl} 
                  alt={gift.name} 
                  className="w-8 h-8 mx-auto mb-1"
                />
                <p className="text-xs font-medium truncate">{gift.name}</p>
                <p className="text-xs text-dark-500">{gift.price} pts</p>
              </button>
            ))}
          </div>
          <div className="flex gap-sm mt-md">
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => handleSendAward()}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Send Award
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setIsAwards(false); setSelectedGift(null); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Report Form */}
      {isReporting && (
        <div className="mt-md rounded-2xl border border-red-200 bg-red-50 p-md dark:border-red-900/40 dark:bg-red-950/25">
          <h4 className="mb-sm font-semibold text-red-900 dark:text-red-200">Report this post</h4>
          <textarea
            className="textarea-field mb-md rounded-xl border-red-200 bg-white dark:border-red-900/60 dark:bg-dark-900"
            placeholder="Tell us why you're reporting this..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            maxLength={200}
          />
          <div className="flex gap-sm">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleReport}
            >
              Submit Report
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsReporting(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="mt-md border-t border-dark-200 pt-md dark:border-dark-700">
          <h4 className="mb-md font-semibold text-dark-900 dark:text-white">
            Comments ({comments.length})
          </h4>

          {/* Comment List */}
          <div className="space-y-md mb-md max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-dark-500 text-sm">No comments yet. Be the first!</p>
            ) : (
              (() => {
                const renderComment = (comment: Comment, depth: number) => {
                  const isPostOwner = post.user.id === currentUser?.id;
                  const marginLeft = depth > 0 ? 'ml-8 border-l-2 pl-4 border-dark-300 dark:border-dark-600' : '';

                  return (
                    <div key={comment.id} className={`mb-4 ${marginLeft}`}>
                      <div className={`rounded-xl border border-dark-200 bg-dark-50 p-md dark:border-dark-700 dark:bg-dark-800/70 ${comment.isPinned ? 'ring-2 ring-blue-500' : ''} ${comment.isLocked ? 'opacity-75' : ''}`}>
                        <div className="flex items-start justify-between">
                          <Link to={`/users/${comment.user.id}`} className="flex items-center gap-sm mb-xs hover:opacity-80">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-300 to-accent-300 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {(comment.user.email || comment.user.walletAddress || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-dark-900 dark:text-white">
                                  {comment.user.displayName || comment.user.email || comment.user.walletAddress}
                                </p>
                                {comment.isPinned && (
                                  <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                    <Pin size={12} /> Pinned
                                  </span>
                                )}
                                {comment.isLocked && (
                                  <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                    <Lock size={12} /> Locked
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-dark-500">
                                {formatDate(comment.createdAt)}
                              </p>
                            </div>
                          </Link>

                          {isPostOwner && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handlePinComment(comment.id)}
                                className="p-1 rounded hover:bg-dark-200 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300"
                                title={comment.isPinned ? 'Unpin comment' : 'Pin comment'}
                              >
                                <Pin size={16} className={comment.isPinned ? 'fill-current' : ''} />
                              </button>
                              <button
                                onClick={() => handleLockComment(comment.id)}
                                className="p-1 rounded hover:bg-dark-200 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300"
                                title={comment.isLocked ? 'Unlock comment' : 'Lock comment'}
                              >
                                {comment.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400"
                                title="Delete comment"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-dark-800 dark:text-dark-200 text-sm mt-xs">
                          {renderContent(comment.content)}
                        </p>

                        {comment.awards && comment.awards.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {comment.awards.map((award, index) => (
                              <div key={`${award.id}-${index}`} className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full text-xs">
                                <img src={award.gift.iconUrl} alt={award.gift.name} className="w-4 h-4" />
                                <span className="text-yellow-800 dark:text-yellow-200">{award.gift.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-4">
                          {!comment.isLocked && currentUser && (
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="flex items-center gap-1 text-sm text-dark-500 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <Reply size={14} /> Reply
                            </button>
                          )}
                          {currentUser && (
                            <button
                              onClick={() => loadGifts(comment.id)}
                              className="flex items-center gap-1 text-sm text-dark-500 hover:text-yellow-600 dark:hover:text-yellow-400"
                            >
                              <Award size={14} /> Award
                            </button>
                          )}
                        </div>
                      </div>

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2">
                          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
                        </div>
                      )}
                    </div>
                  );
                };

                return comments.map((comment) => renderComment(comment, 0));
              })()
            )}
          </div>

          {/* Add Comment */}
          {currentUser && (
            <div className="pt-md border-t border-dark-200">
              {replyingTo && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-blue-600 dark:text-blue-400">Replying to a comment</span>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <textarea
                className="textarea-field mb-sm rounded-xl border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-900/80"
                placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                value={comment}
                onChange={handleCommentChange}
                maxLength={200}
                rows={2}
              />
              {userSearchResults.length > 0 && (
                <div className="mt-2 rounded-lg border border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-800">
                  {userSearchResults.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-dark-100 dark:hover:bg-dark-700"
                      onClick={() => handleAddTaggedUserToComment(user)}
                    >
                      <img src={user.profile.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full" />
                      <span>{user.username}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-sm">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleComment}
                  disabled={!comment.trim()}
                >
                  {replyingTo ? 'Reply' : 'Comment'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <CommunityNotes postId={post.id} />

      <PromotionModal
        isOpen={isPromoting}
        onClose={() => setIsPromoting(false)}
        postId={post.id}
      />
      
      {showInstantForm && post.creative?.instantForm && (
        <InstantFormModal
          form={post.creative.instantForm}
          onClose={() => setShowInstantForm(false)}
          onSubmit={async (formData) => {
            try {
              await createLead(post.id, formData);
              addToast('Lead submitted successfully!', 'success');
              setShowInstantForm(false);
            } catch (error) {
              console.error('Failed to submit lead:', error);
              addToast('Failed to submit lead', 'error');
            }
          }}
        />
      )}
    </div>
  );
}