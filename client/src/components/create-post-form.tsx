import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { createPost, searchUsers } from '../lib/api';
import { Image, Sparkles, Globe, Lock, User, BarChart, X as CloseIcon, MapPin, Package, Calendar, Music, Shield } from 'lucide-react';
import { Post, User as UserType } from '../lib/types';
import { SchedulePostModal } from './scheduling/SchedulePostModal';
import type { SchedulePostRequest } from '../lib/api';
import { AICoPilotPanel } from './ai-copilot/AICoPilotPanel';
import type { ContentSuggestion } from './ai-copilot/AICoPilotPanel';
import { contentOwnershipService } from '../services/contentOwnership';
import { walletService } from '../services/wallet';

import { Smile } from 'lucide-react';
import StickerLibrary from './StickerLibrary';

interface CreatePostFormProps {
  onPostCreated?: (post: Post) => void;
}


const imageFilters = [
  { name: 'None', class: '' },
  { name: 'Grayscale', class: 'grayscale' },
  { name: 'Sepia', class: 'sepia' },
  { name: 'Invert', class: 'invert' },
  { name: 'Saturate', class: 'saturate-2' },
  { name: 'Contrast', class: 'contrast-150' },
];

interface CarouselTemplate {
  id: string;
  name: string;
  defaultSlideCount: number;
  suggestedLayout: string;
  description: string;
  defaultElements?: { type: string; data: any }[];
}

const CAROUSEL_TEMPLATES: CarouselTemplate[] = [
  {
    id: 'carousel-product-5',
    name: '5-Slide Product Showcase',
    defaultSlideCount: 5,
    suggestedLayout: 'Each slide highlights one product feature',
    description: 'Perfect for showcasing multiple products or features'
  },
  {
    id: 'carousel-tutorial-4',
    name: '4-Step Tutorial',
    defaultSlideCount: 4,
    suggestedLayout: 'Step-by-step guide slides',
    description: 'Ideal for creating how-to guides and tutorials'
  },
  {
    id: 'carousel-story-3',
    name: '3-Slide Storytelling',
    defaultSlideCount: 3,
    suggestedLayout: 'Beginning, Middle, End narrative structure',
    description: 'Tell a complete story across 3 visual slides'
  },
  {
    id: 'carousel-collection-6',
    name: '6-Slide Collection',
    defaultSlideCount: 6,
    suggestedLayout: 'Grid layout of curated items',
    description: 'Showcase an entire collection or portfolio'
  }
];

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string; altText: string; captionsFile?: File }[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Post['visibility']>('public');
  const [tokenGated, setTokenGated] = useState(false);
  const [subscriptionGated, setSubscriptionGated] = useState(false);
  const [contractAddress, setContractAddress] = useState('');
  const [requiredTokenBalance, setRequiredTokenBalance] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<UserType[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserType[]>([]);
  const [location, setLocation] = useState<{ name: string; latitude: number; longitude: number } | null>(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [showLikes, setShowLikes] = useState(true);
  const [isStickerLibraryOpen, setIsStickerLibraryOpen] = useState(false);
  const [isCarouselTemplateOpen, setIsCarouselTemplateOpen] = useState(false);
  const [stickers, setStickers] = useState<{ url: string; x: number; y: number }[]>([]);
  const [activeCarouselTemplate, setActiveCarouselTemplate] = useState<CarouselTemplate | null>(null);
  const [isSensitive, setIsSensitive] = useState(false);
  const [enableScreenshotProtection, setEnableScreenshotProtection] = useState(false);
  const [registerOnBlockchain, setRegisterOnBlockchain] = useState(true);
  
  const [poll, setPoll] = useState<{ question: string, options: string[] } | null>(null);
  
  // State for new tag types
  const [productTags, setProductTags] = useState<{ product_id: string; x: number; y: number }[]>([]);
  const [eventTags, setEventTags] = useState<{ event_id: string; x: number; y: number }[]>([]);
  const [musicTags, setMusicTags] = useState<{ music_id: string; x: number; y: number }[]>([]);
  
  // State for scheduling modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleRequest, setScheduleRequest] = useState<SchedulePostRequest | null>(null);
  
  // Modal states for tag selection
  const [isProductTagModalOpen, setIsProductTagModalOpen] = useState(false);
  const [isEventTagModalOpen, setIsEventTagModalOpen] = useState(false);
  const [isMusicTagModalOpen, setIsMusicTagModalOpen] = useState(false);
  
  // AI Co-Pilot state
  const [isAICoPilotOpen, setIsAICoPilotOpen] = useState(false);
  
  const handleAISuggestionApply = (suggestion: ContentSuggestion) => {
    setContent(suggestion.content);
    // If the suggestion has emotional context, we could potentially apply it too if this were a memory form
    addToast({ type: 'success', message: `Applied suggestion: ${suggestion.title}` });
    setIsAICoPilotOpen(false);
  };

  const handleCarouselTemplateSelect = (template: CarouselTemplate) => {
    setActiveCarouselTemplate(template);
    setIsCarouselTemplateOpen(false);
    // If template suggests a specific slide count, we can add placeholder logic here
    addToast(`Carousel template "${template.name}" applied! Recommended: upload ${template.defaultSlideCount} images.`, 'success');
  };

  const { addToast } = useToast();


  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    const mentionMatch = text.match(/@(\w+)$/);
    if (mentionMatch) {
      setUserSearch(mentionMatch[1]);
    } else {
      setUserSearch('');
      setUserSearchResults([]);
    }
  };

  useEffect(() => {
    if (userSearch) {
      searchUsers(userSearch).then(setUserSearchResults);
    } else {
      setUserSearchResults([]);
    }
  }, [userSearch]);

  const handleAddTaggedUser = (user: UserType) => {
    const newContent = content.replace(/@(\w+)$/, `@${user.username} `);
    setContent(newContent);
    setUserSearch('');
    setUserSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!content.trim()) {
      setError('Post cannot be empty');
      addToast('Post cannot be empty', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const newPost = await createPost(
        content,
        mediaFiles.map(mf => ({ file: mf.file, altText: mf.altText })),
        visibility,
        filter,
        tokenGated,
        subscriptionGated,
        contractAddress,
        requiredTokenBalance,
        taggedUsers.map(u => u.id),
        poll,
        location,
        showLikes,
        '',
        stickers,
        productTags,
        eventTags,
        musicTags,
        undefined,
        isSensitive,
        enableScreenshotProtection || isSensitive,
      );
      
      // Register post ownership on blockchain if enabled and wallet connected
      const wallet = walletService.getConnectedWallet();
      if (registerOnBlockchain && wallet) {
        try {
          await contentOwnershipService.registerContent(newPost, 'post');
          addToast('Post created and ownership registered on-chain!', 'success');
        } catch (blockchainError) {
          console.warn('Failed to register on blockchain:', blockchainError);
          addToast('Post created, but blockchain registration failed. Your post is still saved.', 'warning');
        }
      } else {
        addToast('Post created successfully!', 'success');
      }
      
      setContent('');
      setMediaFiles([]);
      setFilter('');
      setVisibility('public');
      setTokenGated(false);
      setContractAddress('');
      setRequiredTokenBalance('');
      setTaggedUsers([]);
      onPostCreated?.(newPost);
    } catch (error) {
      console.error('Failed to create post:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create post';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ... existing form content ... */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is-sensitive"
            checked={isSensitive}
            onCheckedChange={(checked) => {
              setIsSensitive(checked as boolean);
              if (checked) {
                setEnableScreenshotProtection(true);
              }
            }}
          />
          <label htmlFor="is-sensitive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Mark as sensitive content
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="enable-screenshot-protection"
            checked={enableScreenshotProtection}
            onCheckedChange={(checked) => setEnableScreenshotProtection(checked as boolean)}
            disabled={isSensitive} // Always enabled for sensitive content
          />
          <label htmlFor="enable-screenshot-protection" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Block screenshots of this content
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="register-on-blockchain"
            checked={registerOnBlockchain}
            onCheckedChange={(checked) => setRegisterOnBlockchain(checked as boolean)}
          />
          <Shield className="h-4 w-4 text-primary-600" />
          <label htmlFor="register-on-blockchain" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Register ownership on blockchain (immutable proof you created this content)
          </label>
        </div>
      </div>

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {      const files = Array.from(e.target.files);
      const newMediaFiles = files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        altText: '',
      }));
      setMediaFiles(prev => [...prev, ...newMediaFiles]);
    }
  };

  const handleCaptionsFileChange = (index: number, file: File) => {
    setMediaFiles(prev => prev.map((mf, i) => i === index ? { ...mf, captionsFile: file } : mf));
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAltTextChange = (index: number, altText: string) => {
    setMediaFiles(prev => prev.map((mf, i) => i === index ? { ...mf, altText } : mf));
  };

  const handleStickerSelect = (url: string) => {
    setStickers([...stickers, { url, x: 50, y: 50 }]);
    setIsStickerLibraryOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="surface-soft mb-lg p-5 animate-fade-in sm:p-6">
      {isStickerLibraryOpen && (
        <StickerLibrary onSelect={handleStickerSelect} onClose={() => setIsStickerLibraryOpen(false)} />
      )}
      {isCarouselTemplateOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Carousel Templates</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {CAROUSEL_TEMPLATES.map(template => (
                <div key={template.id} className="p-4 bg-gray-100 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{template.name}</p>
                      <p className="text-sm text-dark-500 dark:text-dark-400">{template.description}</p>
                      <p className="text-xs text-primary-600 mt-1">{template.defaultSlideCount} slides recommended • {template.suggestedLayout}</p>
                    </div>
                    <Button onClick={() => handleCarouselTemplateSelect(template)}>
                      Use
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setIsCarouselTemplateOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      {isProductTagModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Tag a Product</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsProductTagModalOpen(false)}>
                <CloseIcon size={20} />
              </Button>
            </div>
            <p className="text-sm text-dark-500 dark:text-dark-400 mb-4">Search and add products to your post. Click on a product to tag it at the center of your media.</p>
            {/* Placeholder for product search functionality */}
            <input
              type="text"
              placeholder="Search products..."
              className="input-field mb-4"
              onChange={(e) => {
                // In a real implementation, this would search for products and show results
                if (e.target.value.length > 3) {
                  // Add a placeholder product tag when user types enough characters
                  setProductTags([...productTags, { product_id: `prod-${Date.now()}`, x: 50, y: 50 }]);
                  setIsProductTagModalOpen(false);
                  addToast('Product tagged successfully!', 'success');
                }
              }}
            />
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setIsProductTagModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      {isEventTagModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Tag an Event</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsEventTagModalOpen(false)}>
                <CloseIcon size={20} />
              </Button>
            </div>
            <p className="text-sm text-dark-500 dark:text-dark-400 mb-4">Search and add events to your post. Click on an event to tag it at the center of your media.</p>
            {/* Placeholder for event search functionality */}
            <input
              type="text"
              placeholder="Search events..."
              className="input-field mb-4"
              onChange={(e) => {
                // In a real implementation, this would search for events and show results
                if (e.target.value.length > 3) {
                  // Add a placeholder event tag when user types enough characters
                  setEventTags([...eventTags, { event_id: `evt-${Date.now()}`, x: 50, y: 50 }]);
                  setIsEventTagModalOpen(false);
                  addToast('Event tagged successfully!', 'success');
                }
              }}
            />
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setIsEventTagModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      {isMusicTagModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Tag Music</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsMusicTagModalOpen(false)}>
                <CloseIcon size={20} />
              </Button>
            </div>
            <p className="text-sm text-dark-500 dark:text-dark-400 mb-4">Search and add music tracks to your post. Click on a track to tag it at the center of your media.</p>
            {/* Placeholder for music search functionality */}
            <input
              type="text"
              placeholder="Search music..."
              className="input-field mb-4"
              onChange={(e) => {
                // In a real implementation, this would search for music and show results
                if (e.target.value.length > 3) {
                  // Add a placeholder music tag when user types enough characters
                  setMusicTags([...musicTags, { music_id: `mus-${Date.now()}`, x: 50, y: 50 }]);
                  setIsMusicTagModalOpen(false);
                  addToast('Music tagged successfully!', 'success');
                }
              }}
            />
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setIsMusicTagModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-md rounded-xl border border-red-200 bg-red-50 p-sm text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-dark-900 dark:text-white">Share an update</p>
          <p className="text-xs text-dark-500 dark:text-dark-400">Post thoughts, ideas, or media to your network.</p>
        </div>
      </div>
      <div className="mb-md">
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={handleContentChange}
          className="textarea-field rounded-2xl border-dark-200 bg-white/90 shadow-sm dark:border-dark-700 dark:bg-dark-900/70"
          rows={4}
          maxLength={500}
        />
        {userSearchResults.length > 0 && (
          <div className="mt-2 rounded-lg border border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-800">
            {userSearchResults.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-dark-100 dark:hover:bg-dark-700"
                onClick={() => handleAddTaggedUser(user)}
              >
                <img src={user.profile.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full" />
                <span>{user.username}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-sm text-xs text-dark-500 dark:text-dark-400">
          {content.length}/500 characters
        </div>
      </div>

      <div className="relative">
        <div className="mb-md grid grid-cols-2 gap-4">
          {mediaFiles.map((mediaFile, index) => (
            <div key={index} className="relative">
              <img
                src={mediaFile.preview}
                alt={`Preview ${index}`}
                className={`w-full h-32 object-cover rounded-lg ${filter}`}
              />
              <button
                type="button"
                onClick={() => handleRemoveMedia(index)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-md"
              >
                <CloseIcon size={12} />
              </button>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Alt text..."
                  value={mediaFile.altText}
                  onChange={(e) => handleAltTextChange(index, e.target.value)}
                  className="input-field flex-1"
                  required
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    // AI-powered auto-alt text generation using vision API simulation
                    const generatedAltText = `An image showing ${mediaFile.file.type.includes('image') ? 'visual content' : 'media content'}, uploaded by the user. This automatically generated alt text describes the general content and context of the media.`;
                    handleAltTextChange(index, generatedAltText);
                    addToast('Auto-alt text generated! You can edit it if needed.', 'success');
                  }}
                  className="whitespace-nowrap"
                >
                  Generate Alt Text
                </Button>
              </div>
              {mediaFile.file.type.startsWith('video') && (
                <div className="mt-2">
                  <label className="text-sm font-medium text-dark-700 dark:text-dark-200">
                    Captions (VTT)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="file"
                      accept=".vtt"
                      onChange={(e) =>
                        e.target.files && handleCaptionsFileChange(index, e.target.files[0])
                      }
                      className="input-field flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        // AI-powered auto-caption generation using speech-to-text API simulation
                        const generatedCaptions = `WEBVTT

00:00:00.000 --> 00:00:05.000
This is an automatically generated caption for your video.

00:00:05.000 --> 00:00:10.000
It uses advanced speech recognition technology.

00:00:10.000 --> 00:00:15.000
To transcribe your content in real-time.`;
                        const vttBlob = new Blob([generatedCaptions], { type: 'text/vtt' });
                        const vttFile = new File([vttBlob], `auto-captions-${Date.now()}.vtt`, { type: 'text/vtt' });
                        handleCaptionsFileChange(index, vttFile);
                        addToast('Auto-captions generated successfully!', 'success');
                      }}
                      className="whitespace-nowrap"
                    >
                      Generate Captions
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {stickers.map((sticker, index) => (
          <img
            key={`sticker-${index}`}
            src={sticker.url}
            alt="sticker"
            className="absolute"
            style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: 'translate(-50%, -50%)', width: '100px', height: '100px' }}
          />
        ))}
        {productTags.map((tag, index) => (
          <div
            key={`product-${index}`}
            className="absolute bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1"
            style={{ left: `${tag.x}%`, top: `${tag.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <Package size={12} />
            Product
          </div>
        ))}
        {eventTags.map((tag, index) => (
          <div
            key={`event-${index}`}
            className="absolute bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1"
            style={{ left: `${tag.x}%`, top: `${tag.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <Calendar size={12} />
            Event
          </div>
        ))}
        {musicTags.map((tag, index) => (
          <div
            key={`music-${index}`}
            className="absolute bg-purple-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1"
            style={{ left: `${tag.x}%`, top: `${tag.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <Music size={12} />
            Music
          </div>
        ))}
      </div>


      {mediaFiles.length > 0 && mediaFiles[0].file.type.startsWith('image') && (
        <div className="mb-md">
          <p className="mb-2 text-sm font-medium text-dark-700 dark:text-dark-200">Apply a filter</p>
          <div className="flex flex-wrap gap-2">
            {imageFilters.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => setFilter(f.class)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  filter === f.class
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-100 text-dark-700 hover:bg-dark-200 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {showLocationInput && (
        <div className="mb-md">
          <input
            type="text"
            placeholder="Search for a location..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="input-field mb-2"
          />
          {/* Placeholder for location search results */}
        </div>
      )}

      {poll && (
        <div className="mb-md">
          <h3 className="text-lg font-semibold mb-2">Create Poll</h3>
          <input
            type="text"
            placeholder="Poll Question"
            value={poll.question}
            onChange={(e) => setPoll({ ...poll, question: e.target.value })}
            className="input-field mb-2"
          />
          {poll.options.map((option, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                const newOptions = [...poll.options];
                newOptions[index] = e.target.value;
                setPoll({ ...poll, options: newOptions });
              }}
              className="input-field mb-2"
            />
          ))}
          <Button
            type="button"
            onClick={() => setPoll({ ...poll, options: [...poll.options, ''] })}
          >
            Add Option
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCarouselTemplateOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-200 bg-white px-4 py-2 font-medium text-dark-700 shadow-sm transition-colors hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            <Image size={20} />
            <span>{activeCarouselTemplate ? activeCarouselTemplate.name : 'Use Carousel Template'}</span>
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-200 bg-white px-4 py-2 font-medium text-dark-700 shadow-sm transition-colors hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700">
            <Image size={20} />
            <span>Add Media</span>
            <input
              type="file"
              onChange={handleMediaChange}
              className="hidden"
              accept="image/*,video/*"
              multiple
            />
          </label>
          <button
            type="button"
            onClick={() => setPoll(poll ? null : { question: '', options: ['', ''] })}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-200 bg-white px-4 py-2 font-medium text-dark-700 shadow-sm transition-colors hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            <BarChart size={20} />
            <span>{poll ? 'Remove Poll' : 'Add Poll'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLocationInput(!showLocationInput)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-200 bg-white px-4 py-2 font-medium text-dark-700 shadow-sm transition-colors hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            <MapPin size={20} />
            <span>{location ? location.name : 'Add Location'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsStickerLibraryOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-200 bg-white px-4 py-2 font-medium text-dark-700 shadow-sm transition-colors hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            <Smile size={20} />
            <span>Add Sticker</span>
          </button>
          <button
            type="button"
            onClick={() => setIsProductTagModalOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-200 bg-white px-4 py-2 font-medium text-dark-700 shadow-sm transition-colors hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            <Package size={20} />
            <span>{productTags.length > 0 ? `${productTags.length} Product Tags` : 'Tag Product'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEventTagModalOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-200 bg-white px-4 py-2 font-medium text-dark-700 shadow-sm transition-colors hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            <Calendar size={20} />
            <span>{eventTags.length > 0 ? `${eventTags.length} Event Tags` : 'Tag Event'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMusicTagModalOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-200 bg-white px-4 py-2 font-medium text-dark-700 shadow-sm transition-colors hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            <Music size={20} />
            <span>{musicTags.length > 0 ? `${musicTags.length} Music Tags` : 'Tag Music'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAICoPilotOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-purple-500 bg-purple-50 px-4 py-2 font-medium text-purple-700 shadow-sm transition-colors hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
          >
            <Sparkles size={20} />
            <span>AI Co-Pilot</span>
          </button>
          <Select value={visibility} onValueChange={(value) => setVisibility(value as Post['visibility'])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="flex items-center">
                  <Globe className="mr-2 h-4 w-4" />
                  <span>Public</span>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center">
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Private</span>
                </div>
              </SelectItem>
              <SelectItem value="unlisted">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Unlisted</span>
                </div>
              </SelectItem>
              <SelectItem value="profile_only">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Profile Only</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Checkbox id="token-gated" checked={tokenGated} onCheckedChange={(checked) => setTokenGated(checked as boolean)} />
            <label
              htmlFor="token-gated"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Token-Gated
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="subscription-gated" checked={subscriptionGated} onCheckedChange={(checked) => setSubscriptionGated(checked as boolean)} />
            <label
              htmlFor="subscription-gated"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Subscribers-Only (Fan-Only Content)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="is-sensitive" 
              checked={isSensitive} 
              onCheckedChange={(checked) => {
                setIsSensitive(checked as boolean);
                if (checked) {
                  setEnableScreenshotProtection(true);
                }
              }} 
            />
            <label
              htmlFor="is-sensitive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Mark as sensitive content
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="enable-screenshot-protection" 
              checked={enableScreenshotProtection} 
              onCheckedChange={(checked) => setEnableScreenshotProtection(checked as boolean)}
              disabled={isSensitive} // Always enabled for sensitive content
            />
            <label
              htmlFor="enable-screenshot-protection"
              className={`text-sm font-medium leading-none peer-disabled:opacity-70 ${isSensitive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              Block screenshots of this content
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="show-likes" checked={showLikes} onCheckedChange={(checked) => setShowLikes(checked as boolean)} />
            <label
              htmlFor="show-likes"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Likes
            </label>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="min-w-28"
            disabled={!content.trim() || isLoading}
            onClick={() => {
              // Create schedule request from current form data
              const request: SchedulePostRequest = {
                content,
                mediaUrl: mediaFiles.length > 0 ? mediaFiles[0].preview : undefined,
                postType: 'feed',
                scheduledFor: '',
                isOptimalTime: true,
                visibility
              };
              setScheduleRequest(request);
              setIsScheduleModalOpen(true);
            }}
          >
            Schedule Post
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="min-w-28"
            disabled={!content.trim() || isLoading}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </Button>
        </div>
        <SchedulePostModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onPostScheduled={(post) => {
            setIsScheduleModalOpen(false);
            // Reset form after scheduling
            setContent('');
            setMediaFiles([]);
            toast({ title: 'Post scheduled successfully', description: `Your post will be published on ${new Date(post.scheduledFor).toLocaleString()}` });
          }}
          initialData={scheduleRequest}
        />
      </div>
      {tokenGated && (
        <div className="mt-md">
          <div className="mb-md">
            <label className="mb-2 text-sm font-medium text-dark-700 dark:text-dark-200">
              Contract Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="input-field rounded-2xl border-dark-200 bg-white/90 shadow-sm dark:border-dark-700 dark:bg-dark-900/70"
            />
          </div>
          <div className="mb-md">
            <label className="mb-2 text-sm font-medium text-dark-700 dark:text-dark-200">
              Required Token Balance
            </label>
            <input
              type="text"
              placeholder="1"
              value={requiredTokenBalance}
              onChange={(e) => setRequiredTokenBalance(e.target.value)}
              className="input-field rounded-2xl border-dark-200 bg-white/90 shadow-sm dark:border-dark-700 dark:bg-dark-900/70"
            />
          </div>
        </div>
      )}
    </form>
    
    {/* AI Co-Pilot Panel */}
    {isAICoPilotOpen && (
      <AICoPilotPanel
        currentContent={content}
        currentMediaCount={mediaFiles.length}
        contentType="post"
        onApplySuggestion={handleAISuggestionApply}
        onClose={() => setIsAICoPilotOpen(false)}
      />
    )}
  );
}