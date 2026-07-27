import { useState, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { createPost } from '../lib/api';
import { Button } from './ui/button';
import { X, Image as ImageIcon, Video as VideoIcon, Smile, User, Sparkles, Edit as EditIcon, Mic as MicIcon, Brain as BrainIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../lib/types';
import StickerLibrary from './StickerLibrary';
import { TagFriendsModal } from './dms/TagFriendsModal';
import AIContentGenerator from './generative-ai/AIContentGenerator';
import { PhotoEditor } from './PhotoEditor';
import PodcastRecorder from './podcast/PodcastRecorder';
import { analyzeContent, ContentAnalysisResult } from '../services/contentModerationService';
import { ContentWarningBanner } from './moderation/ContentWarningBanner';
import { AutoTag } from '../lib/types';

// Generate mock auto-tags based on post content for demonstration
function generateMockAutoTags(content: string, mediaPreviews: string[]): AutoTag[] {
  const tags: AutoTag[] = [];
  let tagId = 1;

  // Common topic keywords and their categories
  const keywordCategories: Record<string, { category: 'topic' | 'genre' | 'format'; name: string }> = {
    'technology': { category: 'topic', name: 'technology' },
    'tech': { category: 'topic', name: 'technology' },
    'AI': { category: 'topic', name: 'artificial-intelligence' },
    'artificial intelligence': { category: 'topic', name: 'artificial-intelligence' },
    'gaming': { category: 'topic', name: 'gaming' },
    'game': { category: 'topic', name: 'gaming' },
    'music': { category: 'topic', name: 'music' },
    'song': { category: 'topic', name: 'music' },
    'travel': { category: 'topic', name: 'travel' },
    'vacation': { category: 'topic', name: 'travel' },
    'food': { category: 'topic', name: 'food' },
    'cooking': { category: 'topic', name: 'food' },
    'fitness': { category: 'topic', name: 'fitness' },
    'workout': { category: 'topic', name: 'fitness' },
    'photography': { category: 'topic', name: 'photography' },
    'photo': { category: 'topic', name: 'photography' },
    'art': { category: 'topic', name: 'art' },
    'creative': { category: 'topic', name: 'art' },
    'science': { category: 'topic', name: 'science' },
    'research': { category: 'topic', name: 'science' },
    'news': { category: 'topic', name: 'news' },
    'politics': { category: 'topic', name: 'politics' },
    'sports': { category: 'topic', name: 'sports' },
    'football': { category: 'topic', name: 'sports' },
    'soccer': { category: 'topic', name: 'sports' },
    'basketball': { category: 'topic', name: 'sports' },
    'fashion': { category: 'topic', name: 'fashion' },
    'style': { category: 'topic', name: 'fashion' },
    'beauty': { category: 'topic', name: 'beauty' },
    'makeup': { category: 'topic', name: 'beauty' },
    'nature': { category: 'topic', name: 'nature' },
    'outdoors': { category: 'topic', name: 'nature' },
    'pets': { category: 'topic', name: 'pets' },
    'dog': { category: 'topic', name: 'pets' },
    'cat': { category: 'topic', name: 'pets' },
    'education': { category: 'topic', name: 'education' },
    'learning': { category: 'topic', name: 'education' },
    'study': { category: 'topic', name: 'education' },
    'business': { category: 'topic', name: 'business' },
    'entrepreneur': { category: 'topic', name: 'business' },
    'startup': { category: 'topic', name: 'business' },
    'finance': { category: 'topic', name: 'finance' },
    'money': { category: 'topic', name: 'finance' },
    'investing': { category: 'topic', name: 'finance' },
    'health': { category: 'topic', name: 'health' },
    'wellness': { category: 'topic', name: 'health' },
    'mental health': { category: 'topic', name: 'health' },
    'relationship': { category: 'topic', name: 'relationships' },
    'love': { category: 'topic', name: 'relationships' },
    'family': { category: 'topic', name: 'family' },
    'friends': { category: 'topic', name: 'friends' },
    'lifestyle': { category: 'topic', name: 'lifestyle' },
    'daily': { category: 'topic', name: 'lifestyle' },
    'vlog': { category: 'format', name: 'vlog' },
    'blog': { category: 'format', name: 'blog' },
    'tutorial': { category: 'format', name: 'tutorial' },
    'review': { category: 'format', name: 'review' },
    'unboxing': { category: 'format', name: 'unboxing' },
    'reaction': { category: 'format', name: 'reaction' },
    'podcast': { category: 'format', name: 'podcast' },
    'stream': { category: 'format', name: 'livestream' },
    'live': { category: 'format', name: 'livestream' },
    'short film': { category: 'format', name: 'short-film' },
    'documentary': { category: 'genre', name: 'documentary' },
    'comedy': { category: 'genre', name: 'comedy' },
    'funny': { category: 'genre', name: 'comedy' },
    'drama': { category: 'genre', name: 'drama' },
    'action': { category: 'genre', name: 'action' },
    'horror': { category: 'genre', name: 'horror' },
    'scary': { category: 'genre', name: 'horror' },
    'thriller': { category: 'genre', name: 'thriller' },
    'romance': { category: 'genre', name: 'romance' },
    'sci-fi': { category: 'genre', name: 'sci-fi' },
    'science fiction': { category: 'genre', name: 'sci-fi' },
    'fantasy': { category: 'genre', name: 'fantasy' },
    'animation': { category: 'genre', name: 'animation' },
    'anime': { category: 'genre', name: 'anime' },
    'manga': { category: 'genre', name: 'anime' },
  };

  const lowerContent = content.toLowerCase();
  const addedTags = new Set<string>();

  // Check content for keywords and add matching tags
  for (const [keyword, tagInfo] of Object.entries(keywordCategories)) {
    if (lowerContent.includes(keyword.toLowerCase()) && !addedTags.has(tagInfo.name)) {
      tags.push({
        id: `tag-${tagId++}`,
        name: tagInfo.name,
        category: tagInfo.category,
        confidence: 0.7 + Math.random() * 0.25, // Random confidence between 70-95%
      });
      addedTags.add(tagInfo.name);
    }
  }

  // Add format tags based on media presence
  if (mediaPreviews.length > 0) {
    const hasVideo = mediaPreviews.some(url => url.includes('video') || url.includes('mp4') || url.includes('webm'));
    if (hasVideo && !addedTags.has('video')) {
      tags.push({
        id: `tag-${tagId++}`,
        name: 'video-content',
        category: 'format',
        confidence: 0.95,
      });
      addedTags.add('video-content');
    } else if (!addedTags.has('photo')) {
      tags.push({
        id: `tag-${tagId++}`,
        name: 'photography',
        category: 'format',
        confidence: 0.92,
      });
      addedTags.add('photography');
    }
  }

  // If no tags were found, add some default ones
  if (tags.length === 0) {
    tags.push({
      id: `tag-${tagId++}`,
      name: 'general',
      category: 'topic',
      confidence: 0.85,
    });
    tags.push({
      id: `tag-${tagId++}`,
      name: 'text-post',
      category: 'format',
      confidence: 0.98,
    });
  }

  // Limit to max 5 tags
  return tags.slice(0, 5);
}

interface GeneratedContent {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  url?: string;
  content?: string;
  prompt: string;
  createdAt: Date;
}

export function CreatePost() {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [postType, setPostType] = useState<'text' | 'media'>('text');
  const [activity, setActivity] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<UserProfile[]>([]);
  const [isTaggingModalOpen, setTaggingModalOpen] = useState(false);
  const [isStickerModalOpen, setStickerModalOpen] = useState(false);
  const [isAIGeneratorOpen, setAIGeneratorOpen] = useState(false);
  const [isPhotoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [isPodcastRecorderOpen, setIsPodcastRecorderOpen] = useState(false);
  const [isNeuralCaptureActive, setIsNeuralCaptureActive] = useState(false);
  const [isNeuralProcessing, setIsNeuralProcessing] = useState(false);
  const [neuralCaptureStream, setNeuralCaptureStream] = useState<MediaStream | null>(null);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [stickerUrl, setStickerUrl] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [generatedAIContent, setGeneratedAIContent] = useState<GeneratedContent | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Neural thought-to-post capture functionality with integrated neural moderation
  const startNeuralCapture = async () => {
    try {
      // Request access to simulate neural interface (in a real app this would connect to a neural implant API)
      setIsNeuralCaptureActive(true);
      setIsNeuralProcessing(true);
      addToast('Neural interface connected! Your thoughts are being processed locally to protect privacy.', 'success');
      
      // Simulate neural signal processing that converts brain activity to text
      const neuralProcessingInterval = setInterval(async () => {
        // In a real implementation, this would use a trained ML model to interpret brain signals
        // For this demo, we include a harmful thought to test the moderation system
        const commonThoughts = [
          "Just had the most amazing coffee at this new café downtown! The ambiance is incredible, and their latte art is next level. ☕✨",
          "Spent the afternoon hiking in the mountains - the view from the summit took my breath away. Nature really is the best therapy. 🏔️🌲",
          "Can't stop thinking about that new album that just dropped. I've had it on repeat all day, every track is a masterpiece. 🎵🔥",
          "Had such a wonderful reunion with old friends last night. Laughter, memories, and so much love shared. Grateful for these moments. ❤️👯",
          "Working on a new project that I'm really passionate about. It's challenging, but every small win feels so rewarding. Let's build something great! 💪🚀",
          "Just finished reading that book everyone's been talking about. The ending completely caught me off guard, still processing it. 📚🤯",
          "Sunset at the beach never gets old. The way the colors paint the sky... nothing beats this feeling. 🌅🌊",
          "Learned something new today that completely changed my perspective. Always keep growing and learning, that's what life's about. 🧠💡",
          // Test harmful thought to demonstrate moderation: "I want to harm someone who hurt me recently, this anger is overwhelming."
        ];
        
        // 10% chance to pick a harmful thought for testing, 90% pick a normal one
        const useHarmfulThought = Math.random() < 0.1;
        const randomThought = useHarmfulThought 
          ? "I want to harm someone who hurt me recently, this anger is overwhelming."
          : commonThoughts[Math.floor(Math.random() * commonThoughts.length)];
        
        setContent(randomThought);
        clearInterval(neuralProcessingInterval);
        
        // Run neural moderation BEFORE the thought is even displayed to the user or sent anywhere
        setIsAnalyzing(true);
        try {
          const tempId = `neural-thought-${Date.now()}`;
          // Pass neural signal data to the moderation system
          const analysis = await analyzeContent(
            randomThought, 
            'neural_thought', 
            tempId, 
            [],
            {
              deviceId: 'neural-implant-prototype-001',
              implantVersion: '2.4.1',
              rawSignal: Array.from({length: 100}, () => Math.random()) // Mock raw neural signal data
            }
          );
          setContentAnalysis(analysis);
          
          // If content is automatically removed, prevent submission and warn the user
          if (analysis.recommendedAction === 'auto_remove') {
            addToast('Our neural moderation system detected potentially harmful thoughts. Your thought has not been shared to protect everyone\'s safety. All processing happened locally on your device to preserve your privacy.', 'error');
            setContent(''); // Clear the harmful thought
            setIsNeuralCaptureActive(false);
            setIsNeuralProcessing(false);
          } else {
            setIsNeuralProcessing(false);
            if (analysis.neuralThoughtAnalysis) {
              addToast(`Thought captured! Clarity: ${Math.round(analysis.neuralThoughtAnalysis.thoughtClarity)}% | Emotions: ${analysis.neuralThoughtAnalysis.emotionalContext.join(', ')}`, 'success');
            } else {
              addToast('Thought captured successfully! Ready to post.', 'success');
            }
          }
        } catch (error) {
          console.error('Failed to analyze neural thought:', error);
          addToast('Failed to process your thought. Please try again.', 'error');
          setIsNeuralCaptureActive(false);
          setIsNeuralProcessing(false);
        } finally {
          setIsAnalyzing(false);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Failed to connect to neural interface:', error);
      addToast('Failed to connect to neural implant. Please check your device settings.', 'error');
      setIsNeuralCaptureActive(false);
      setIsNeuralProcessing(false);
    }
  };

  const stopNeuralCapture = () => {
    setIsNeuralCaptureActive(false);
    setIsNeuralProcessing(false);
    if (neuralCaptureStream) {
      neuralCaptureStream.getTracks().forEach(track => track.stop());
      setNeuralCaptureStream(null);
    }
    addToast('Neural capture stopped', 'info');
  };

  // Analyze content for harmful content/misinformation when content changes
  const analyzePostContent = async () => {
    if (!content.trim()) {
      setContentAnalysis(null);
      return;
    }
    
    setIsAnalyzing(true);
    try {
      // Generate temporary ID for the post (will be replaced by actual ID after creation)
      const tempId = `temp-${Date.now()}`;
      const analysis = await analyzeContent(content, 'post', tempId, mediaPreviews);
      // If no auto-tags were returned from the API, generate mock ones for demonstration
      if (!analysis.autoTags || analysis.autoTags.length === 0) {
        analysis.autoTags = generateMockAutoTags(content, mediaPreviews);
      }
      setContentAnalysis(analysis);
      
      // If content is automatically removed, prevent submission
      if (analysis.recommendedAction === 'auto_remove') {
        addToast('Your post contains content that violates our community guidelines', 'error');
      }
    } catch (error) {
      console.error('Failed to analyze content:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Watch for content changes to trigger analysis
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Debounce analysis to avoid excessive API calls
    clearTimeout(window.contentAnalysisTimeout);
    window.contentAnalysisTimeout = setTimeout(() => {
      analyzePostContent();
    }, 1000);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      if (mediaFiles.length + files.length > 4) {
        addToast('Maximum of 4 media items allowed per post.', 'warning');
        return;
      }
      setMediaFiles(prev => [...prev, ...files]);

      const previews = files.map(file => URL.createObjectURL(file));
      setMediaPreviews(prev => [...prev, ...previews]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      newPreviews.forEach(preview => URL.revokeObjectURL(preview));
      return newPreviews;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (postType === 'text' && !content.trim() && !activity.trim()) {
      addToast('Please add some content or an activity to your post.', 'warning');
      return;
    }
    if (postType === 'media' && mediaFiles.length === 0) {
      addToast('Please add some media to your post.', 'warning');
      return;
    }

    // Block submission if content is automatically flagged for removal
    if (contentAnalysis && contentAnalysis.recommendedAction === 'auto_remove') {
      addToast('Cannot create post: content violates community guidelines', 'error');
      return;
    }

    try {
      // Pass auto-tags to createPost if they exist
      const autoTags = contentAnalysis?.autoTags;
      // Format media files to match API's expected structure
      const formattedMedia = postType === 'media' ? mediaFiles.map(file => ({ file, altText: '' })) : [];
      await createPost(
        content,
        formattedMedia,
        'public',
        selectedFilter,
        false,
        false,
        '',
        '',
        taggedUsers.map(u => u.id),
        null,
        null,
        true,
        activity,
        stickerUrl ? [{ url: stickerUrl, x: 0, y: 0 }] : undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        false,
        autoTags
      );
      addToast('Post created successfully!', 'success');
      navigate('/');
    } catch (error) {
      console.error('Failed to create post:', error);
      addToast('Failed to create post. Please try again.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create Post</h2>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => navigate(-1)} ariaLabel="Close create post dialog">
            <X className="h-6 w-6" />
          </Button>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-2 border rounded-md bg-gray-100 dark:bg-dark-700 dark:text-white"
            rows={4}
            placeholder="What's on your mind?"
            value={content}
            onChange={handleContentChange}
          />
          {isAnalyzing && (
            <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
              Analyzing content for safety...
            </div>
          )}
          {isNeuralProcessing && (
            <div className="mt-2 text-sm text-purple-500 flex items-center gap-2">
              <div className="animate-pulse h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full"></div>
              Neural interface active: capturing your thoughts...
            </div>
          )}
          {contentAnalysis && (contentAnalysis.isHarmful || contentAnalysis.isMisinformation) && (
            <div className="mt-3">
              <ContentWarningBanner analysis={contentAnalysis} />
            </div>
          )}
          
          {/* AI-generated auto-tags display */}
          {contentAnalysis?.autoTags && contentAnalysis.autoTags.length > 0 && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-300">AI-generated content tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {contentAnalysis.autoTags.map(tag => (
                  <span 
                    key={tag.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200"
                  >
                    #{tag.name}
                    <span className="ml-1 text-xs opacity-75">({Math.round(tag.confidence * 100)}%)</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          <input
            type="text"
            className="w-full p-2 mt-2 border rounded-md bg-gray-100 dark:bg-dark-700 dark:text-white"
            placeholder="What are you feeling or doing?"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          />
          <div className="flex items-center space-x-4 mt-4">
            <Button type="button" onClick={() => setPostType('text')}>
              Text
            </Button>
            <Button type="button" onClick={() => { setPostType('media'); fileInputRef.current?.click(); }}>
              <ImageIcon className="mr-2" />
              Photo
            </Button>
            <Button type="button" onClick={() => { setPostType('media'); fileInputRef.current?.click(); }}>
              <VideoIcon className="mr-2" />
              Video
            </Button>
            <Button type="button" onClick={() => setTaggingModalOpen(true)}>
              <User className="mr-2" />
              Tag People
            </Button>
            <Button type="button" onClick={() => { /* Open feeling/activity modal */ }}>
              <Smile className="mr-2" />
              Feeling/Activity
            </Button>
            <Button type="button" onClick={() => { setStickerModalOpen(true); }}>
              <Smile className="mr-2" />
              GIF
            </Button>
            <Button type="button" onClick={() => { setAIGeneratorOpen(true); }}>
              <Sparkles className="mr-2" />
              AI Generate
            </Button>
            <Button type="button" onClick={() => { setIsPodcastRecorderOpen(true); }}>
              <MicIcon className="mr-2" />
              Podcast
            </Button>
            <Button 
              type="button" 
              onClick={isNeuralCaptureActive ? stopNeuralCapture : startNeuralCapture}
              variant={isNeuralCaptureActive ? "destructive" : "default"}
            >
              <BrainIcon className="mr-2" />
              {isNeuralCaptureActive ? (isNeuralProcessing ? "Capturing..." : "Stop Capture") : "Thought-to-Post"}
            </Button>
            {mediaPreviews.length > 0 && mediaFiles.some((file, idx) => mediaPreviews[idx] && file.type.startsWith('image/')) && (
              <Button type="button" onClick={() => {
                // Find first image to edit
                const firstImageIndex = mediaFiles.findIndex(file => file.type.startsWith('image/'));
                if (firstImageIndex !== -1) {
                  setCurrentEditIndex(firstImageIndex);
                  setPhotoEditorOpen(true);
                }
              }}>
                <EditIcon className="mr-2" />
                Edit Photo
              </Button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {taggedUsers.map(user => (
              <div key={user.id} className="flex items-center bg-gray-200 dark:bg-dark-600 rounded-full px-3 py-1 text-sm">
                <img src={user.pfp} alt={user.username} className="w-5 h-5 rounded-full mr-2" />
                {user.username}
              </div>
            ))}
          </div>
          {isTaggingModalOpen && (
            <TagFriendsModal
              onClose={() => setTaggingModalOpen(false)}
              onTagUsers={setTaggedUsers}
              taggedUsers={taggedUsers}
            />
          )}
          {isStickerModalOpen && (
            <StickerLibrary
              onClose={() => setStickerModalOpen(false)}
              onSelect={(url) => {
                setStickerUrl(url);
                setStickerModalOpen(false);
              }}
            />
          )}
          
          {isAIGeneratorOpen && (
            <AIContentGenerator
              onClose={() => setAIGeneratorOpen(false)}
              onInsertContent={(aiContent) => {
                setGeneratedAIContent(aiContent);
                if (aiContent.type === 'text' && aiContent.content) {
                  setContent(aiContent.content);
                } else if (aiContent.url) {
                  // Convert AI generated media URL to File object for media files
                  fetch(aiContent.url)
                    .then(res => res.blob())
                    .then(blob => {
                      const file = new File([blob], `ai-generated-${aiContent.type}-${Date.now()}.${aiContent.type === 'audio' ? 'mp3' : aiContent.type === 'video' ? 'mp4' : 'jpg'}`, { type: blob.type });
                      setMediaFiles(prev => [...prev, file]);
                      setMediaPreviews(prev => [...prev, aiContent.url!]);
                      setPostType('media');
                    });
                }
              }}
            />
          )}
          {stickerUrl && (
            <div className="relative mt-2">
              <img src={stickerUrl} alt="selected sticker" className="w-full h-auto rounded-md" />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => setStickerUrl(null)}
                ariaLabel="Remove sticker"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {postType === 'media' && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt="media preview" className="w-full h-full object-cover rounded-md" />
                  {mediaFiles[index]?.type.startsWith('image/') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-1 left-1 h-6 w-6 p-0"
                      onClick={() => {
                        setCurrentEditIndex(index);
                        setPhotoEditorOpen(true);
                      }}
                      ariaLabel={`Edit media ${index + 1}`}
                    >
                      <EditIcon className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => handleRemoveMedia(index)}
                    ariaLabel={`Remove media ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {isPhotoEditorOpen && currentEditIndex !== null && (
            <PhotoEditor
              imageUrl={mediaPreviews[currentEditIndex]}
              onClose={() => {
                setPhotoEditorOpen(false);
                setCurrentEditIndex(null);
              }}
              onSave={(editedImageUrl, filter) => {
                // Update the preview with edited image
                const newPreviews = [...mediaPreviews];
                newPreviews[currentEditIndex] = editedImageUrl;
                setMediaPreviews(newPreviews);
                setSelectedFilter(filter);
                setPhotoEditorOpen(false);
                setCurrentEditIndex(null);
              }}
            />
          )}
          <div className="mt-6 flex justify-end">
            <Button type="submit">Post</Button>
          </div>
        </form>

        {/* Podcast Recorder Modal */}
        {isPodcastRecorderOpen && (
          <PodcastRecorder
            onClose={() => setIsPodcastRecorderOpen(false)}
            onSave={(audioBlob, metadata) => {
              // Convert blob to File object
              const file = new File([audioBlob], `podcast-${Date.now()}.webm`, { type: 'audio/webm' });
              setMediaFiles(prev => [...prev, file]);
              const url = URL.createObjectURL(file);
              setMediaPreviews(prev => [...prev, url]);
              setPostType('media');
              // Add podcast title to post content
              setContent(prev => prev ? `${prev}\n\n🎙️ Podcast: ${metadata.title}` : `🎙️ Podcast: ${metadata.title}`);
              addToast('Podcast saved successfully!', 'success');
              setIsPodcastRecorderOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}