
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getProfile, updatePrivacy } from '../../lib/api';
import {
  PostVisibility,
  FriendRequestPrivacy,
  UserProfile,
  EmailSearchPrivacy,
  CommentPrivacy,
  TagPrivacy,
  MessagePrivacy,
  ScreenshotProtectionLevel,
  ScreenshotProtectionSettings,
  defaultScreenshotProtectionSettings,
} from '../../lib/types';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';

export function PrivacyShortcutsSettings() {
  const { activeAccount } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [postVisibility, setPostVisibility] = useState<PostVisibility>(
    PostVisibility.PUBLIC,
  );
  const [friendRequestPrivacy, setFriendRequestPrivacy] = useState<FriendRequestPrivacy>(
    FriendRequestPrivacy.EVERYONE,
  );
  const [emailSearchPrivacy, setEmailSearchPrivacy] = useState<EmailSearchPrivacy>(
    EmailSearchPrivacy.EVERYONE,
  );
  const [commentPrivacy, setCommentPrivacy] = useState<CommentPrivacy>(
    CommentPrivacy.EVERYONE,
  );
  const [tagPrivacy, setTagPrivacy] = useState<TagPrivacy>(
    TagPrivacy.EVERYONE,
  );
  const [messagePrivacy, setMessagePrivacy] = useState<MessagePrivacy>(
    MessagePrivacy.EVERYONE,
  );
  const [screenshotProtection, setScreenshotProtection] = useState<ScreenshotProtectionSettings>(
    defaultScreenshotProtectionSettings,
  );

  useEffect(() => {
    const fetchUser = async () => {
      if (activeAccount) {
        const profile = await getProfile();
        setUser(profile);
        setPostVisibility(profile.postVisibility || PostVisibility.PUBLIC);
        setFriendRequestPrivacy(
          profile.friendRequestPrivacy || FriendRequestPrivacy.EVERYONE,
        );
        setEmailSearchPrivacy(
          profile.emailSearchPrivacy || EmailSearchPrivacy.EVERYONE,
        );
        setCommentPrivacy(
          profile.commentPrivacy || CommentPrivacy.EVERYONE,
        );
        setTagPrivacy(
          profile.tagPrivacy || TagPrivacy.EVERYONE,
        );
        setMessagePrivacy(
          profile.messagePrivacy || MessagePrivacy.EVERYONE,
        );
        if (profile.screenshotProtection) {
          setScreenshotProtection(profile.screenshotProtection);
        }
      }
    };
    fetchUser();
  }, [activeAccount]);

  const handlePostVisibilityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVisibility = e.target.value as PostVisibility;
    setPostVisibility(newVisibility);
    try {
      await updatePrivacy({ postVisibility: newVisibility });
      toast.success('Post visibility updated');
    } catch (error) {
      toast.error('Failed to update post visibility');
    }
  };

  const handleFriendRequestPrivacyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrivacy = e.target.value as FriendRequestPrivacy;
    setFriendRequestPrivacy(newPrivacy);
    try {
      await updatePrivacy({ friendRequestPrivacy: newPrivacy });
      toast.success('Friend request privacy updated');
    } catch (error) {
      toast.error('Failed to update friend request privacy');
    }
  };

  const handleEmailSearchPrivacyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrivacy = e.target.value as EmailSearchPrivacy;
    setEmailSearchPrivacy(newPrivacy);
    try {
      await updatePrivacy({ emailSearchPrivacy: newPrivacy });
      toast.success('Email search privacy updated');
    } catch (error) {
      toast.error('Failed to update email search privacy');
    }
  };

  const handleCommentPrivacyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrivacy = e.target.value as CommentPrivacy;
    setCommentPrivacy(newPrivacy);
    try {
      await updatePrivacy({ commentPrivacy: newPrivacy });
      toast.success('Comment privacy updated');
    } catch (error) {
      toast.error('Failed to update comment privacy');
    }
  };

  const handleTagPrivacyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrivacy = e.target.value as TagPrivacy;
    setTagPrivacy(newPrivacy);
    try {
      await updatePrivacy({ tagPrivacy: newPrivacy });
      toast.success('Tag privacy updated');
    } catch (error) {
      toast.error('Failed to update tag privacy');
    }
  };

  const handleMessagePrivacyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrivacy = e.target.value as MessagePrivacy;
    setMessagePrivacy(newPrivacy);
    try {
      await updatePrivacy({ messagePrivacy: newPrivacy });
      toast.success('Message privacy updated');
    } catch (error) {
      toast.error('Failed to update message privacy');
    }
  };

  const handleScreenshotProtectionChange = async (newSettings: Partial<ScreenshotProtectionSettings>) => {
    const updatedSettings = { ...screenshotProtection, ...newSettings };
    setScreenshotProtection(updatedSettings);
    try {
      await updatePrivacy({ screenshotProtection: updatedSettings });
      toast.success('Screenshot protection settings updated');
    } catch (error) {
      toast.error('Failed to update screenshot protection settings');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold">Who can see what you share</h2>
      <p className="text-sm text-gray-500">
        Manage who can see your posts, stories, and other profile information.
      </p>
      <div className="mt-4">
        <label htmlFor="post-visibility" className="block text-sm font-medium text-gray-700">
          Who can see your future posts?
        </label>
        <select
          id="post-visibility"
          name="post-visibility"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={postVisibility}
          onChange={handlePostVisibilityChange}
        >
          <option value={PostVisibility.PUBLIC}>Public</option>
          <option value={PostVisibility.FRIENDS}>Friends</option>
          <option value={PostVisibility.ONLY_ME}>Only Me</option>
        </select>
      </div>
      <div className="mt-4">
        <label htmlFor="friend-request-privacy" className="block text-sm font-medium text-gray-700">
          Who can send you friend requests?
        </label>
        <select
          id="friend-request-privacy"
          name="friend-request-privacy"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={friendRequestPrivacy}
          onChange={handleFriendRequestPrivacyChange}
        >
          <option value={FriendRequestPrivacy.EVERYONE}>Everyone</option>
          <option value={FriendRequestPrivacy.FRIENDS_OF_FRIENDS}>Friends of Friends</option>
        </select>
      </div>
      <div className="mt-4">
        <label htmlFor="email-search-privacy" className="block text-sm font-medium text-gray-700">
          Who can look you up using the email address you provided?
        </label>
        <select
          id="email-search-privacy"
          name="email-search-privacy"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={emailSearchPrivacy}
          onChange={handleEmailSearchPrivacyChange}
        >
          <option value={EmailSearchPrivacy.EVERYONE}>Everyone</option>
          <option value={EmailSearchPrivacy.FRIENDS}>Friends</option>
          <option value={EmailSearchPrivacy.NO_ONE}>No One</option>
        </select>
      </div>
      <h2 className="text-lg font-bold mt-8">Interactions and communications</h2>
      <p className="text-sm text-gray-500">
        Control who can interact with you and send you messages.
      </p>
      <div className="mt-4">
        <label htmlFor="comment-privacy" className="block text-sm font-medium text-gray-700">
          Who can comment on your posts?
        </label>
        <select
          id="comment-privacy"
          name="comment-privacy"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={commentPrivacy}
          onChange={handleCommentPrivacyChange}
        >
          <option value={CommentPrivacy.EVERYONE}>Everyone</option>
          <option value={CommentPrivacy.FRIENDS}>Friends</option>
          <option value={CommentPrivacy.FRIENDS_OF_FRIENDS}>Friends of Friends</option>
          <option value={CommentPrivacy.NO_ONE}>No One</option>
        </select>
      </div>
      <div className="mt-4">
        <label htmlFor="tag-privacy" className="block text-sm font-medium text-gray-700">
          Who can tag you in posts and comments?
        </label>
        <select
          id="tag-privacy"
          name="tag-privacy"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={tagPrivacy}
          onChange={handleTagPrivacyChange}
        >
          <option value={TagPrivacy.EVERYONE}>Everyone</option>
          <option value={TagPrivacy.FRIENDS}>Friends</option>
          <option value={TagPrivacy.FRIENDS_OF_FRIENDS}>Friends of Friends</option>
          <option value={TagPrivacy.NO_ONE}>No One</option>
        </select>
      </div>
      <div className="mt-4">
        <label htmlFor="message-privacy" className="block text-sm font-medium text-gray-700">
          Who can send you direct messages?
        </label>
        <select
          id="message-privacy"
          name="message-privacy"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={messagePrivacy}
          onChange={handleMessagePrivacyChange}
        >
          <option value={MessagePrivacy.EVERYONE}>Everyone</option>
          <option value={MessagePrivacy.FRIENDS}>Friends</option>
          <option value={MessagePrivacy.FRIENDS_OF_FRIENDS}>Friends of Friends</option>
          <option value={MessagePrivacy.NO_ONE}>No One</option>
        </select>
      </div>

      <h2 className="text-lg font-bold mt-8">Screenshot Protection</h2>
      <p className="text-sm text-gray-500">
        Protect your sensitive content from being screenshotted or recorded.
      </p>
      
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="screenshot-protection-enabled" className="block text-sm font-medium text-gray-700">
              Enable screenshot protection
            </label>
            <p className="text-xs text-gray-500">Block or warn when someone tries to screenshot your content</p>
          </div>
          <Switch
            id="screenshot-protection-enabled"
            checked={screenshotProtection.enabled}
            onCheckedChange={(checked) => handleScreenshotProtectionChange({ enabled: checked })}
          />
        </div>

        {screenshotProtection.enabled && (
          <>
            <div className="mt-4">
              <label htmlFor="protection-level" className="block text-sm font-medium text-gray-700">
                Protection level
              </label>
              <select
                id="protection-level"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={screenshotProtection.level}
                onChange={(e) => handleScreenshotProtectionChange({ level: e.target.value as ScreenshotProtectionLevel })}
              >
                <option value={ScreenshotProtectionLevel.WARNING_ONLY}>Warn only (notify when screenshot is detected)</option>
                <option value={ScreenshotProtectionLevel.BLOCK_ALL}>Block all attempts</option>
              </select>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Apply protection to:</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Direct Messages</span>
                <Switch
                  checked={screenshotProtection.applyToDms}
                  onCheckedChange={(checked) => handleScreenshotProtectionChange({ applyToDms: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Your Posts</span>
                <Switch
                  checked={screenshotProtection.applyToPosts}
                  onCheckedChange={(checked) => handleScreenshotProtectionChange({ applyToPosts: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Your Stories</span>
                <Switch
                  checked={screenshotProtection.applyToStories}
                  onCheckedChange={(checked) => handleScreenshotProtectionChange({ applyToStories: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Your Profile</span>
                <Switch
                  checked={screenshotProtection.applyToProfile}
                  onCheckedChange={(checked) => handleScreenshotProtectionChange({ applyToProfile: checked })}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}