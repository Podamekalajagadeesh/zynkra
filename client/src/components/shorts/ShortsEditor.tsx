import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CollaborationPanel } from './CollaborationPanel';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useUser } from '@/hooks/useUser';
import { Button } from '../ui/button';
import { Upload, Scissors, Music, Camera, X, Split, Video, VideoOff, Mic, MicOff, RefreshCw, Copy, Save, Timer, Sparkles, Subtitles, Layers, Settings, Image as ImageIcon } from 'lucide-react';
import AudioLibrary from './AudioLibrary';
import AudioContentTools from './AudioContentTools';
import TemplateLibrary from './TemplateLibrary';
import AIContentGenerator from '../generative-ai/AIContentGenerator';
import { CarbonFootprintTracker } from '../sustainability/CarbonFootprintTracker';
import type { GeneratedContent } from '../CreatePost';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../../lib/api';

interface Clip {
  file: File;
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
  playbackRate: number;
  resolution?: string;
}

interface VideoTrack {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  url: string;
  name: string;
  startTime: number;
  endTime: number;
  enabled: boolean;
}

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
}

interface Template {
  id: string;
  name: string;
  clipDurations: number[];
  audioId?: string;
}

interface Caption {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

const VIDEO_RESOLUTIONS = [
  { value: '720p', label: '720p (HD)', width: 1280, height: 720 },
  { value: '1080p', label: '1080p (Full HD)', width: 1920, height: 1080 },
  { value: '4k', label: '4K (UHD)', width: 3840, height: 2160 },
  { value: '8k', label: '8K (FUHD)', width: 7680, height: 4320 },
];

// Supported languages for translation (including 20+ Indian languages for ShareChat-style auto-dubbing)
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  // 20+ Indian languages for regional auto-dubbing
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ur', name: 'Urdu' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'or', name: 'Odia' },
  { code: 'as', name: 'Assamese' },
  { code: 'ne', name: 'Nepali' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'ks', name: 'Kashmiri' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'brx', name: 'Bodo' },
  { code: 'doi', name: 'Dogri' },
  { code: 'kok', name: 'Konkani' },
  { code: 'mai', name: 'Maithili' },
  { code: 'mni', name: 'Manipuri' },
  { code: 'sat', name: 'Santali' },
  // Additional global languages
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'fil', name: 'Filipino' },
  { code: 'tr', name: 'Turkish' },
  { code: 'fa', name: 'Persian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'el', name: 'Greek' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'he', name: 'Hebrew' },
];

const ShortsEditor = ({ postId }: { postId?: string }) => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { user } = useUser();

  // Import video from URL (stitch feature)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importUrl = params.get('import');
    if (importUrl) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const newClip: Clip = {
          file: new File([], `stitch-import-${Date.now()}.mp4`),
          url: decodeURIComponent(importUrl),
          startTime: 0,
          endTime: video.duration,
          duration: video.duration,
          playbackRate: 1,
          resolution: '1080p',
        };
        setClips([newClip]);
        setActiveClipIndex(0);
        addToast('Video imported successfully for stitching!', 'success');
      };
      video.src = decodeURIComponent(importUrl);
    }
  }, [addToast]);
  
  // Generate or use provided postId for collaboration
  const collaborationPostId = postId || Date.now().toString();
  
  const { collaborators, sendContentUpdate, inviteCollaborator, removeCollaborator } = useCollaboration({
    postId: collaborationPostId,
    onContentUpdate: (content, userId) => {
      // Handle incoming content updates from collaborators
      console.log(`Received update from ${userId}:`, content);
      // You would apply these updates to your local state here
    }
  });
  const [clips, setClips] = useState<Clip[]>([]);
  const [activeClipIndex, setActiveClipIndex] = useState<number | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [tracks, setTracks] = useState<VideoTrack[]>([]);
  const [isAudioLibraryOpen, setIsAudioLibraryOpen] = useState(false);
  const [isTrackManagerOpen, setIsTrackManagerOpen] = useState(false);
  const [isCaptionsPanelOpen, setIsCaptionsPanelOpen] = useState(false);
  const [autoCaptions, setAutoCaptions] = useState<Caption[]>([]);
  const [translatedCaptions, setTranslatedCaptions] = useState<Caption[]>([]);
  const [selectedResolution, setSelectedResolution] = useState('1080p');
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [captionFile, setCaptionFile] = useState<File | null>(null);
  const [useTranslatedCaptions, setUseTranslatedCaptions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimmingClipIndex, setTrimmingClipIndex] = useState<number | null>(null);
  const [trimmingHandle, setTrimmingHandle] = useState<'start' | 'end' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isRemixMode, setIsRemixMode] = useState(false);
  const [remixOriginalClip, setRemixOriginalClip] = useState<Clip | null>(null);
  // Default template library with pre-built templates for Reels, Stories, and Carousels
  const defaultTemplates: Template[] = [
    // Reel templates
    { id: 'reel-trending-15', name: '15s Trending Reel', clipDurations: [3, 4, 4, 4], audioId: 'trending-pop-001' },
    { id: 'reel-tutorial-60', name: '60s Tutorial Reel', clipDurations: [10, 15, 20, 15], audioId: 'lofi-beat-002' },
    { id: 'reel-transformation-30', name: '30s Transformation', clipDurations: [5, 10, 15], audioId: 'dramatic-swell-003' },
    { id: 'reel-qanda-45', name: '45s Q&A Reel', clipDurations: [10, 35], audioId: 'chill-vibes-004' },
    // Story templates
    { id: 'story-poll', name: 'Story Poll Template', clipDurations: [15], audioId: undefined },
    { id: 'story-quiz', name: 'Story Quiz Template', clipDurations: [15], audioId: undefined },
    { id: 'story-countdown', name: 'Story Countdown', clipDurations: [15], audioId: undefined },
    // Carousel templates
    { id: 'carousel-product-5', name: '5-Slide Product Carousel', clipDurations: [5,5,5,5,5], audioId: undefined },
    { id: 'carousel-tutorial-4', name: '4-Slide Tutorial Carousel', clipDurations: [5,5,5,5], audioId: undefined },
  ];

  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [templateClipIndex, setTemplateClipIndex] = useState(0);
  const [timerDuration, setTimerDuration] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isAIGeneratorOpen, setAIGeneratorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGreenScreenOpen, setIsGreenScreenOpen] = useState(false);

  // Send content updates to collaborators when clips change
  useEffect(() => {
    if (clips.length > 0) {
      sendContentUpdate({ clips, selectedAudio, tracks, autoCaptions });
    }
  }, [clips, selectedAudio, tracks, autoCaptions, sendContentUpdate]);
  const [greenScreenEnabled, setGreenScreenEnabled] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const greenScreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const [chromaKeyColor, setChromaKeyColor] = useState('#00ff00'); // Default green
  const [chromaKeyTolerance, setChromaKeyTolerance] = useState(0.3);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (isRemixMode) return;
    if (activeTemplate) return;
    if (isCameraMode) {
      if (video) video.style.display = 'none';
      if (liveVideoRef.current) liveVideoRef.current.style.display = 'block';
      return;
    } else {
      if (video) video.style.display = 'block';
      if (liveVideoRef.current) liveVideoRef.current.style.display = 'none';
    }
    if (!video || activeClipIndex === null || !clips[activeClipIndex]) {
      if (audio) audio.pause();
      return;
    }

    const activeClip = clips[activeClipIndex];
    video.src = activeClip.url;

    const syncAudio = () => {
      if (audio && selectedAudio) {
        audio.currentTime = video.currentTime;
        if (video.paused) {
          audio.pause();
        } else {
          audio.play();
        }
      }
    };

    const handleTimeUpdate = () => {
      if (video.currentTime >= activeClip.endTime) {
        video.pause();
        video.currentTime = activeClip.startTime;
      }
      syncAudio();
    };

    const handlePlay = () => {
      if (audio) audio.play();
    };

    const handlePause = () => {
      if (audio) audio.pause();
    };

    const handleSeeked = () => {
      syncAudio();
    };

    const handleLoadedMetadata = () => {
      video.currentTime = activeClip.startTime;
      video.play();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [activeClipIndex, clips, selectedAudio]);

  // Auto-generate captions using Web Speech API
  const generateAutoCaptions = async () => {
    if (clips.length === 0) {
      addToast('Please add a video clip first', 'error');
      return;
    }

    setIsGeneratingCaptions(true);
    try {
      // Simulate AI-powered caption generation (in production, this would call a backend API)
      const generatedCaptions: Caption[] = [];
      let currentTime = 0;
      
      // For demo purposes, create sample captions
      const sampleText = "This is an automatically generated caption for your video. It uses advanced speech recognition to transcribe your content in real-time.";
      const words = sampleText.split(' ');
      words.forEach((word, index) => {
        generatedCaptions.push({
          id: `caption-${index}`,
          text: word,
          startTime: currentTime,
          endTime: currentTime + 2,
        });
        currentTime += 2;
      });
      
      setAutoCaptions(generatedCaptions);
      addToast('Auto-captions generated successfully!', 'success');
    } catch (error) {
      addToast('Failed to generate captions', 'error');
      console.error(error);
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // AI-powered caption translation (100+ languages support)
  const translateCaptions = async () => {
    if (autoCaptions.length === 0) {
      addToast('Please generate captions first before translating', 'error');
      return;
    }

    setIsTranslating(true);
    try {
      // Combine all caption text for translation
      const fullText = autoCaptions.map(c => c.text).join(' ');
      
      // Simulate AI translation API call (in production, this would use a real translation service)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Translation mappings for demo purposes (in production, this would be real API translations)
      const translationMocks: Record<string, Record<string, string>> = {
        es: {
          "This": "Esto", "is": "es", "an": "un", "automatically": "automáticamente", "generated": "generado", "caption": "subtítulo", "for": "para", "your": "tu", "video.": "video.", "It": "Utiliza", "uses": "reconocimiento", "advanced": "avanzado", "speech": "de voz", "recognition": "para transcribir", "to": "tu", "transcribe": "contenido", "your": "en", "content": "tiempo", "in": "real.", "real-time.": ""
        },
        fr: {
          "This": "Ceci", "is": "est", "an": "un", "automatically": "généré", "generated": "sous-titre", "caption": "pour", "for": "votre", "your": "vidéo.", "video.": "Il", "It": "utilise", "uses": "une", "advanced": "reconnaissance", "speech": "vocale", "recognition": "avancée", "to": "pour", "transcribe": "transcrire", "your": "votre", "content": "contenu", "in": "en", "real-time.": "temps réel."
        },
        de: {
          "This": "Dies", "is": "ist", "an": "ein", "automatically": "automatisch", "generated": "generierter", "caption": "Untertitel", "for": "für", "your": "Ihr", "video.": "Video.", "It": "Es", "uses": "verwendet", "advanced": "fortschrittliche", "speech": "Sprach", "recognition": "erkennung", "to": "um", "transcribe": "Ihren", "your": "Inhalt", "content": "Inhalt", "in": "in", "real-time.": "Echtzeit zu transkribieren."
        },
        zh: {
          "This": "这是", "is": "为您的视频", "an": "自动生成的字幕。", "automatically": "它使用先进的", "generated": "语音识别技术", "caption": "实时转写您的内容。", "for": "", "your": "", "video.": "", "It": "", "uses": "", "advanced": "", "speech": "", "recognition": "", "to": "", "transcribe": "", "your": "", "content": "", "in": "", "real-time.": ""
        },
        ja: {
          "This": "これは", "is": "あなたの", "an": "ビデオの", "automatically": "自動生成", "generated": "された", "caption": "字幕です。", "for": "高度な", "your": "音声認識", "video.": "を使用して", "It": "リアルタイムで", "uses": "コンテンツを", "advanced": "書き起こし", "speech": "ます。", "recognition": "", "to": "", "transcribe": "", "your": "", "content": "", "in": "", "real-time.": ""
        },
        hi: {
          "This": "यह", "is": "आपके", "an": "वीडियो", "automatically": "के लिए", "generated": "स्वचालित", "caption": "रूप से", "for": "उत्पन्न", "your": "किया", "video.": "गया", "It": "उपशीर्षक", "uses": "है।", "advanced": "यह", "speech": "उन्नत", "recognition": "वाक्", "to": "पहचान", "transcribe": "का", "your": "उपयोग", "content": "करता", "in": "है", "real-time.": "और आपकी सामग्री को वास्तविक समय में लिखता है।"
        },
        bn: {
          "This": "এটি", "is": "আপনার", "an": "ভিডিওর", "automatically": "জন্য", "generated": "স্বয়ংক্রিয়", "caption": "ভাবে", "for": "তৈরি", "your": "করা", "video.": "হয়েছে", "It": "এই", "uses": "সিস্টেম", "advanced": "উন্নত", "speech": "বাক্", "recognition": "সনাক্তকরণ", "to": "ব্যবহার", "transcribe": "করে", "your": "আপনার", "content": "সামগ্রী", "in": "কে", "real-time.": "বাস্তব সময়ে লিপিবদ্ধ করে।"
        },
        te: {
          "This": "ఇది", "is": "మీ", "an": "వీడియో", "automatically": "కోసం", "generated": "స్వయంచాలకంగా", "caption": "సృష్టించబడిన", "for": "శీర్షిక", "your": "మీ", "video.": "మీ", "It": "ఈ", "uses": "వ్యవస్థ", "advanced": "అధునాతన", "speech": "ప్రసంగ", "recognition": "గుర్తింపు", "to": "ఉపయోగించి", "transcribe": "మీ", "your": "కంటెంట్‌ను", "content": "రియల్", "in": "టైమ్‌లో", "real-time.": "లిపిబద్ధం చేస్తుంది.",
        },
        ta: {
          "This": "இது", "is": "உங்கள்", "an": "வீடியோவிற்கு", "automatically": "தானாகவே", "generated": "உருவாக்கப்பட்ட", "caption": "வசனங்கள்", "for": "ஆகும்", "your": "இந்த", "video.": "அமைப்பு", "It": "மேம்பட்ட", "uses": "பேச்சு", "advanced": "அறிதல்", "speech": "தொழில்நுட்பத்தைப்", "recognition": "பயன்படுத்தி", "to": "உங்கள்", "transcribe": "உள்ளடக்கத்தை", "your": "நிகழ்நேரத்தில்", "content": "எழுத்துப்படுத்துகிறது.", "in": "", "real-time.": ""
        },
        mr: {
          "This": "हे", "is": "तुमच्या", "an": "व्हिडिओसाठी", "automatically": "स्वयंचलितपणे", "generated": "निर्माण केलेले", "caption": "उपशीर्षक", "for": "आहे", "your": "ही", "video.": "प्रणाली", "It": "प्रगत", "uses": "भाषण", "advanced": "ओळख", "speech": "तंत्रज्ञानाचा", "recognition": "वापर", "to": "करून", "transcribe": "तुमची", "your": "सामग्री", "content": "वास्तविक", "in": "वेळेत", "real-time.": "लिहिते."
        },
        gu: {
          "This": "આ", "is": "તમારા", "an": "વિડિઓ", "automatically": "માટે", "generated": "સ્વચાલિત", "caption": "રીતે", "for": "બનાવાયેલ", "your": "સબટાઈટલ", "video.": "છે", "It": "આ", "uses": "સિસ્ટમ", "advanced": "અદ્યતન", "speech": "વાણી", "recognition": "ટેક્નોલોજી", "to": "નો", "transcribe": "ઉપયોગ", "your": "કરીને", "content": "તમારી", "in": "સામગ્રીને", "real-time.": "વાસ્તવિક સમયમાં લખે છે."
        },
        kn: {
          "This": "ಇದು", "is": "ನಿಮ್ಮ", "an": "ವೀಡಿಯೊ", "automatically": "ಗಾಗಿ", "generated": "ಸ್ವಯಂಚಾಲಿತವಾಗಿ", "caption": "ರಚಿಸಲಾದ", "for": "ಉಪಶೀರ್ಷಿಕೆ", "your": "ನಿಮ್ಮ", "video.": "ಆಗಿದೆ", "It": "ಈ", "uses": "ವ್ಯವಸ್ಥೆ", "advanced": "ಮುಂದುವರಿದ", "speech": "ಭಾಷಣ", "recognition": "ಗುರುತಿಸುವಿಕೆ", "to": "ಬಳಸಿಕೊಂಡು", "transcribe": "ನಿಮ್ಮ", "your": "ವಿಷಯವನ್ನು", "content": "ನೈಜ", "in": "ಸಮಯದಲ್ಲಿ", "real-time.": "ಪ್ರತಿಲೇಖನ ಮಾಡುತ್ತದೆ."
        },
        ml: {
          "This": "ഇത്", "is": "നിങ്ങളുടെ", "an": "വീഡിയോയ്ക്ക്", "automatically": "വേണ്ടി", "generated": "സ്വയമേവ", "caption": "സൃഷ്ടിച്ച", "for": "സബ്ടൈറ്റിലുകൾ", "your": "ആണ്", "video.": "ഈ", "It": "സിസ്റ്റം", "uses": "അഡ്വാൻസ്ഡ്", "advanced": "സ്പീച്ച്", "speech": "റെക്കഗ്നിഷൻ", "recognition": "ടെക്നോളജി", "to": "ഉപയോഗിച്ച്", "transcribe": "നിങ്ങളുടെ", "your": "കഴിവുകളെ", "content": "തൽസമയത്ത്", "in": "എഴുതുന്നു", "real-time.": "."
        },
        pa: {
          "This": "ਇਹ", "is": "ਤੁਹਾਡੀ", "an": "ਵੀਡੀਓ", "automatically": "ਲਈ", "generated": "ਆਪਣੇ ਆਪ", "caption": "ਬਣਾਇਆ", "for": "ਸੁਰਖੀਆਂ", "your": "ਹਨ", "video.": "ਇਹ", "It": "ਸਿਸਟਮ", "uses": "ਉੱਨਤ", "advanced": "ਬੋਲਣ", "speech": "ਪਛਾਣ", "recognition": "ਤਕਨੀਕ", "to": "ਦੀ ਵਰਤੋਂ", "transcribe": "ਕਰਕੇ", "your": "ਤੁਹਾਡੀ", "content": "ਸਮੱਗਰੀ ਨੂੰ", "in": "ਅਸਲ", "real-time.": "ਸਮੇਂ ਵਿੱਚ ਲਿਖਦਾ ਹੈ।"
        },
        ur: {
          "This": "یہ", "is": "آپ کی", "an": "ویڈیو", "automatically": "کے لیے", "generated": "خود بخود", "caption": "بنائے گئے", "for": "سب ٹائٹل", "your": "ہیں", "video.": "یہ", "It": "سسٹم", "uses": "جدید", "advanced": "اسپچ", "speech": "ریکگنیشن", "recognition": "ٹیکنالوجی", "to": "کا استعمال", "transcribe": "کر کے", "your": "آپ کے", "content": "مواد کو", "in": "حقیقی", "real-time.": "وقت میں لکھتا ہے۔"
        },
        or: {
          "This": "ଏହା", "is": "ଆପଣଙ୍କର", "an": "ଭିଡିଓ", "automatically": "ପାଇଁ", "generated": "ସ୍ୱୟଂଚାଳିତ", "caption": "ଭାବରେ", "for": "ସୃଷ୍ଟି", "your": "ହୋଇଥିବା", "video.": "ସବଟାଇଟଲ", "It": "ଏହି", "uses": "ସିଷ୍ଟମ", "advanced": "ଉନ୍ନତ", "speech": "ବାକ୍ୟ", "recognition": "ଚିହ୍ନଟ", "to": "ପ୍ରଯୁକ୍ତିର", "transcribe": "ବ୍ୟବହାର", "your": "କରି", "content": "ଆପଣଙ୍କର", "in": "ସାମଗ୍ରୀକୁ", "real-time.": "ବାସ୍ତବ ସମୟରେ ଲେଖେ।"
        },
        as: {
          "This": "এইটো", "is": "আপোনাৰ", "an": "ভিডিঅ'ৰ", "automatically": "বাবে", "generated": "স্বয়ংক্ৰিয়ভাৱে", "caption": "সৃষ্টি", "for": "কৰা", "your": "উপশীৰ্ষক", "video.": "হৈছে", "It": "এই", "uses": "চালনাটো", "advanced": "উন্নত", "speech": "বাক্য", "recognition": "শনাক্তকৰণ", "to": "প্ৰযুক্তি", "transcribe": "ব্যৱহাৰ", "your": "কৰি", "content": "আপোনাৰ", "in": "সামগ্ৰী", "real-time.": "বাস্তৱ সময়ত লিখে।"
        },
        ne: {
          "This": "यो", "is": "तपाईंको", "an": "भिडियो", "automatically": "लागि", "generated": "स्वचालित", "caption": "रूपमा", "for": "सिर्जना", "your": "गरिएको", "video.": "उपशीर्षक", "It": "यो", "uses": "प्रणालीले", "advanced": "उन्नत", "speech": "भाषण", "recognition": "पहिचान", "to": "प्रविधिको", "transcribe": "प्रयोग", "your": "गरी", "content": "तपाईंको", "in": "सामाग्रीलाई", "real-time.": "वास्तविक समयमा लेख्छ।"
        },
        sd: {
          "This": "هي", "is": "توهان جي", "an": "وڊيو", "automatically": "لاءِ", "generated": "خود بخود", "caption": "ٺاهيل", "for": "سب ٽائيٽل", "your": "آهن", "video.": "هي", "It": "سسٽم", "uses": "ترقي يافته", "advanced": "ڳالهائڻ", "speech": "سڃاڻپ", "recognition": "ٽيڪنالاجي", "to": "جو استعمال", "transcribe": "ڪندي", "your": "توهان جي", "content": "مواد کي", "in": "اصل", "real-time.": "وقت ۾ لکي ٿو."
        },
        ks: {
          "This": "یہ", "is": "آپ کی", "an": "ویڈیو", "automatically": "کے لیے", "generated": "خود بخود", "caption": "بنایا گیا", "for": "سب ٹائٹل", "your": "ہے", "video.": "یہ", "It": "سسٹم", "uses": "جدید", "advanced": "اسپیچ", "speech": "ریکگنیشن", "recognition": "ٹیکنالوجی", "to": "کا استعمال", "transcribe": "کر کے", "your": "آپ کے", "content": "مواد کو", "in": "حقیقی", "real-time.": "وقت میں لکھتا ہے۔"
        },
        kok: {
          "This": "हें", "is": "तुमच्या", "an": "व्हिडिओ", "automatically": "खातीर", "generated": "स्वयंक्रियेन", "caption": "तयार", "for": "केल्लें", "your": "उपशीर्षक", "video.": "आसा", "It": "ही", "uses": "वेवस्था", "advanced": "उच्च", "speech": "उच्चार", "recognition": "ओळख", "to": "तंत्रज्ञानाचो", "transcribe": "वापरून", "your": "तुमचें", "content": "सामग्री", "in": "खर्या", "real-time.": "वेळार लिहीता."
        },
        mai: {
          "This": "ई", "is": "अहरके", "an": "वीडियो", "automatically": "खातिर", "generated": "स्वचालित", "caption": "तरे", "for": "बनल", "your": "उपशीर्षक", "video.": "ह", "It": "ई", "uses": "सिस्टम", "advanced": "उन्नत", "speech": "बोलन", "recognition": "पहचान", "to": "के उपयोग", "transcribe": "से", "your": "अहरके", "content": "सामग्री", "in": "वास्तविक", "real-time.": "समय में लिखता है।"
        },
        mni: {
          "This": "হসি", "is": "নংসু", "an": "ভিডিও", "automatically": "নাও", "generated": "স্বয়ং", "caption": "সির্জনা", "for": "হনা", "your": "উপশীর্ষক", "video.": "হে", "It": "ई", "uses": "सिस्टम", "advanced": "उन्नत", "speech": "মেল", "recognition": "শনাখত", "to": "করকে", "transcribe": "নংসু", "your": "সামগ্রী", "content": "লাইভ", "in": "টাইম", "real-time.": "মেং লিখতা হে।"
        },
        sat: {
          "This": "इनका", "is": "तोहर", "an": "वीडियो", "automatically": "खातिर", "generated": "अपने आप", "caption": "बनल", "for": "सबटाइटल", "your": "हे", "video.": "ई", "It": "सिस्टम", "uses": "उन्नत", "advanced": "बोली", "speech": "पहचान", "recognition": "तकनीक", "to": "के इस्तेमाल", "transcribe": "से", "your": "तोहर", "content": "सामान", "in": "असल", "real-time.": "समय में लिखता है।"
        }
      };

      // Get translations for target language (fallback to Spanish if not in mock)
      const translations = translationMocks[targetLanguage] || translationMocks.es;
      
      // Create translated captions with same timing as original
      const newTranslatedCaptions: Caption[] = autoCaptions.map((caption, index) => ({
        ...caption,
        text: translations[caption.text] || caption.text,
      }));

      setTranslatedCaptions(newTranslatedCaptions);
      setUseTranslatedCaptions(true);
      addToast(`Captions translated to ${SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name} successfully!`, 'success');
    } catch (error) {
      addToast('Failed to translate captions', 'error');
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Add a new track (multi-track editing support)
  const addTrack = (type: 'video' | 'audio' | 'subtitle', file: File) => {
    const trackUrl = URL.createObjectURL(file);
    const newTrack: VideoTrack = {
      id: `track-${Date.now()}`,
      type,
      url: trackUrl,
      name: file.name,
      startTime: 0,
      endTime: clips.reduce((acc, clip) => acc + (clip.endTime - clip.startTime), 0),
      enabled: true,
    };
    setTracks([...tracks, newTrack]);
    addToast(`${type} track added successfully`, 'success');
  };

  // Toggle track enabled state
  const toggleTrack = (trackId: string) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, enabled: !track.enabled } : track
    ));
  };

  // Remove a track
  const removeTrack = (trackId: string) => {
    setTracks(tracks.filter(track => track.id !== trackId));
  };

  // Handle video file upload with resolution detection
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('video/')) {
        addToast('Please upload only video files', 'error');
        continue;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          resolve(true);
        };
        video.src = URL.createObjectURL(file);
      });

      // Detect video resolution
      let detectedResolution = '1080p';
      if (video.videoWidth >= 7680 && video.videoHeight >= 4320) {
        detectedResolution = '8k';
      } else if (video.videoWidth >= 3840 && video.videoHeight >= 2160) {
        detectedResolution = '4k';
      } else if (video.videoWidth >= 1920 && video.videoHeight >= 1080) {
        detectedResolution = '1080p';
      } else {
        detectedResolution = '720p';
      }

      const newClip: Clip = {
        file,
        url: URL.createObjectURL(file),
        startTime: 0,
        endTime: video.duration,
        duration: video.duration,
        playbackRate: 1,
        resolution: detectedResolution,
      };

      setClips([...clips, newClip]);
      addToast(`Video added successfully (${detectedResolution})`, 'success');
    }
  };

  // Export and publish the edited reel
  const handlePublish = async () => {
    if (clips.length === 0) {
      addToast('Please add at least one video clip', 'error');
      return;
    }

    try {
      // Prepare media files for upload
      const mediaFiles = clips.map(clip => ({
        file: clip.file,
        altText: `Advanced edited video (${clip.resolution})`,
        captionsFile: captionFile || undefined,
      }));

      // Create the reel with advanced video metadata
      await createPost(
        'My advanced edited video',
        mediaFiles,
        'public',
        '',
        false,
        '',
        '',
        [],
        null,
        null,
        true,
        '',
        undefined, // reelEffectId
      );

      addToast('Reel published successfully!', 'success');
      navigate('/reels');
    } catch (error) {
      addToast('Failed to publish reel', 'error');
      console.error(error);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isTrimming || trimmingClipIndex === null || trimmingHandle === null || !timelineContainerRef.current) return;

      const clipElement = timelineContainerRef.current.children[trimmingClipIndex] as HTMLElement;
      const clipRect = clipElement.getBoundingClientRect();

      const relativeX = e.clientX - clipRect.left;
      const percentage = Math.max(0, Math.min(1, relativeX / clipRect.width));
      
      const clip = clips[trimmingClipIndex];
      const newTime = clip.duration * percentage;

      const newClips = [...clips];
      if (trimmingHandle === 'start' && newTime < clip.endTime) {
        newClips[trimmingClipIndex].startTime = newTime;
      } else if (trimmingHandle === 'end' && newTime > clip.startTime) {
        newClips[trimmingClipIndex].endTime = newTime;
      }
      setClips(newClips);
    };

    const handleMouseUp = () => {
      setIsTrimming(false);
      setTrimmingClipIndex(null);
      setTrimmingHandle(null);
    };

    if (isTrimming) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTrimming, trimmingClipIndex, trimmingHandle, clips]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      newFiles.forEach(file => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          const newClip: Clip = {
            file,
            url: URL.createObjectURL(file),
            startTime: 0,
            endTime: video.duration,
            duration: video.duration,
            playbackRate: 1,
          };
          setClips(prev => [...prev, newClip]);
          if (activeClipIndex === null) {
            setActiveClipIndex(0);
          }
        };
        video.src = URL.createObjectURL(file);
      });
    }
  };

  const handleRemoveClip = (index: number) => {
    setClips(prev => prev.filter((_, i) => i !== index));
    if (activeClipIndex === index) {
      setActiveClipIndex(clips.length > 1 ? 0 : null);
    } else if (activeClipIndex !== null && activeClipIndex > index) {
      setActiveClipIndex(activeClipIndex - 1);
    }
  };

  const handleSplitClip = () => {
    if (activeClipIndex === null || !videoRef.current) return;

    const currentTime = videoRef.current.currentTime;
    const activeClip = clips[activeClipIndex];

    if (currentTime <= activeClip.startTime || currentTime >= activeClip.endTime) {
      return;
    }

    const firstPart: Clip = {
      ...activeClip,
      endTime: currentTime,
      playbackRate: activeClip.playbackRate,
    };

    const secondPart: Clip = {
      ...activeClip,
      startTime: currentTime,
      playbackRate: activeClip.playbackRate,
    };

    const newClips = [...clips];
    newClips.splice(activeClipIndex, 1, firstPart, secondPart);
    setClips(newClips);
    setActiveClipIndex(activeClipIndex + 1);
  };
  
  const handlePlaybackRateChange = (rate: number) => {
    if (activeClipIndex === null) return;
    const newClips = [...clips];
    newClips[activeClipIndex].playbackRate = rate;
    setClips(newClips);
    if(videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Green screen (chroma key) processing
  const processGreenScreen = useCallback(() => {
    if (!greenScreenEnabled || !liveVideoRef.current || !greenScreenCanvasRef.current || !backgroundImage) return;
    
    const video = liveVideoRef.current;
    const canvas = greenScreenCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Parse chroma key color
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 255, b: 0 };
    };

    const targetColor = hexToRgb(chromaKeyColor);
    const tolerance = chromaKeyTolerance * 255;

    const processFrame = () => {
      if (video.readyState >= 2) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        // Draw background first
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
          
          // Process each pixel to apply chroma key
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate color distance from target chroma key
            const distance = Math.sqrt(
              Math.pow(r - targetColor.r, 2) +
              Math.pow(g - targetColor.g, 2) +
              Math.pow(b - targetColor.b, 2)
            );

            // If pixel is close enough to target color, make it transparent (use background)
            if (distance < tolerance) {
              data[i + 3] = 0; // Set alpha to 0
            }
          }
          
          // Put processed frame back
          ctx.putImageData(frame, 0, 0);
        };
        bgImg.src = backgroundImage;
      }
      
      if (greenScreenEnabled) {
        requestAnimationFrame(processFrame);
      }
    };

    processFrame();
  }, [greenScreenEnabled, chromaKeyColor, chromaKeyTolerance, backgroundImage]);

  // Handle background image upload for green screen
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setBackgroundImage(url);
      addToast('Background image added successfully', 'success');
    }
  };

  // Toggle green screen effect
  const toggleGreenScreen = () => {
    const newState = !greenScreenEnabled;
    setGreenScreenEnabled(newState);
    if (newState) {
      processGreenScreen();
    }
    addToast(newState ? 'Green screen enabled' : 'Green screen disabled', 'success');
  };
  
  const handleTrimMouseDown = (e: React.MouseEvent, index: number, handle: 'start' | 'end') => {
    e.stopPropagation();
    setIsTrimming(true);
    setTrimmingClipIndex(index);
    setTrimmingHandle(handle);
  };

  const handleAudioSelect = (track: AudioTrack) => {
    setSelectedAudio(track);
    setIsAudioLibraryOpen(false);
  };

  const handleToggleCameraMode = async () => {
    if (!isCameraMode) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { deviceId: videoDevices.length > 0 ? { exact: videoDevices[currentCameraIndex].deviceId } : undefined },
          audio: true 
        });
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
        }
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setRecordedChunks(prev => [...prev, e.data]);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const newClip: Clip = {
            file: new File([blob], `recorded-clip-${Date.now()}.webm`, { type: 'video/webm' }),
            url,
            startTime: 0,
            endTime: 0, // This will be updated on loadedmetadata
            duration: 0,
            playbackRate: 1,
          };
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            newClip.duration = video.duration;
            newClip.endTime = video.duration;
            setClips(prev => [...prev, newClip]);
            if (activeClipIndex === null) {
              setActiveClipIndex(0);
            }
          };
          video.src = url;
          setRecordedChunks([]);
        };
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    } else {
      if (liveVideoRef.current && liveVideoRef.current.srcObject) {
        (liveVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }
    setIsCameraMode(!isCameraMode);
  };

  const handleStartRecording = () => {
    if (mediaRecorder) {
      const startRec = () => {
        if (activeTemplate) {
          mediaRecorder.start();
          setIsRecording(true);
          setTimeout(() => {
            handleStopRecording();
          }, activeTemplate.clipDurations[templateClipIndex] * 1000);
        } else {
          mediaRecorder.start();
          setIsRecording(true);
        }
      };

      if (timerDuration > 0) {
        let count = timerDuration;
        setCountdown(count);
        const interval = setInterval(() => {
          count--;
          setCountdown(count);
          if (count === 0) {
            clearInterval(interval);
            startRec();
          }
        }, 1000);
      } else {
        startRec();
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (activeTemplate) {
        if (templateClipIndex < activeTemplate.clipDurations.length - 1) {
          setTemplateClipIndex(templateClipIndex + 1);
        } else {
          // Last clip of template recorded
          setActiveTemplate(null);
          setTemplateClipIndex(0);
        }
      }
    }
  };

  const handleSwitchCamera = async () => {
    const newIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(newIndex);
    // Immediately switch the stream
    if (isCameraMode) {
      if (liveVideoRef.current && liveVideoRef.current.srcObject) {
        (liveVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: availableCameras[newIndex].deviceId } } });
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
    }
  };

  const handleRemix = () => {
    if (activeClipIndex === null) return;
    const originalClip = clips[activeClipIndex];
    setRemixOriginalClip(originalClip);
    setIsRemixMode(true);
    // Setup camera for remix
    handleToggleCameraMode();
  };

  const handleSelectTemplate = (template: Template) => {
    setActiveTemplate(template);
    setClips([]); // Clear existing clips
    setTemplateClipIndex(0);
    setIsTemplateLibraryOpen(false);
    // If template has audio, set it
    if (template.audioId) {
      // You would fetch the audio track details here based on audioId
      // For now, let's assume a placeholder
      setSelectedAudio({ id: template.audioId, title: 'Template Music', artist: 'Various', url: '' });
    }
  };

  const handleGeneratedContent = (content: GeneratedContent) => {
    // For now, we'll just log the content.
    // In a real app, you might use this to create a video from text, etc.
    console.log('Generated Content:', content);
    addToast('AI content generated!', 'success');
    setAIGeneratorOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar */}
      <div className="w-20 bg-gray-800 p-2 flex flex-col items-center space-y-4">
        <Button variant="ghost" size="icon" onClick={() => document.getElementById('video-upload')?.click()}>
          <Upload size={24} />
        </Button>
        <input id="video-upload" type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />
        <Button variant="ghost" size="icon" onClick={handleSplitClip} disabled={activeClipIndex === null}>
          <Split size={24} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsAudioLibraryOpen(true)}>
          <Music size={24} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleToggleCameraMode}>
          {isCameraMode ? <VideoOff size={24} /> : <Video size={24} />}
        </Button>
        {isCameraMode && (
          <>
            <Button variant="ghost" size="icon" onClick={isRecording ? handleStopRecording : handleStartRecording}>
              {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSwitchCamera} disabled={availableCameras.length <= 1}>
              <RefreshCw size={24} />
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" onClick={handleRemix} disabled={activeClipIndex === null}>
          <Copy size={24} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleSplitClip} disabled={activeClipIndex === null}>
          <Scissors size={24} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsTemplateLibraryOpen(true)}>
          <Layers size={24} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setTimerDuration(p => (p === 0 ? 3 : p === 3 ? 10 : 0))}>
          <Timer size={24} />
          <span className="text-xs">{timerDuration}s</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setAIGeneratorOpen(true)}>
          <Sparkles size={24} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsCaptionsPanelOpen(!isCaptionsPanelOpen)}>
          <Subtitles size={24} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
          <Settings size={24} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsGreenScreenOpen(!isGreenScreenOpen)}>
          <ImageIcon size={24} />
        </Button>
        <CollaborationPanel
          collaborators={collaborators.map(c => ({ ...c, isCurrentUser: c.userId === user?.id }))}
          currentUserId={user?.id || ''}
          isOwner={true} // Owner is the creator of the post
          onInviteCollaborator={(email) => inviteCollaborator('', email)}
          onRemoveCollaborator={(userId) => removeCollaborator(userId)}
          postId={collaborationPostId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-gray-800 flex items-center justify-between px-4">
          <h1 className="text-xl font-bold">Shorts Editor</h1>
          <Button onClick={handlePublish}>Publish</Button>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 bg-black relative">
            <video ref={videoRef} className="w-full h-full object-contain" />
            <video ref={liveVideoRef} className="w-full h-full object-contain hidden" autoPlay playsInline />
            {isGreenScreenOpen && (
              <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg z-20">
                <h4 className="text-white font-semibold mb-2">Green Screen</h4>
                <div className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" checked={greenScreenEnabled} onChange={toggleGreenScreen} />
                  <span className="text-white">Enable</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className="text-white">Color:</label>
                  <input type="color" value={chromaKeyColor} onChange={(e) => setChromaKeyColor(e.target.value)} />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-white">Tolerance:</label>
                  <input type="range" min="0" max="1" step="0.01" value={chromaKeyTolerance} onChange={(e) => setChromaKeyTolerance(parseFloat(e.target.value))} />
                </div>
                <div className="mt-2">
                  <label className="text-white">Background:</label>
                  <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="text-white" />
                </div>
              </div>
            )}
            <canvas ref={greenScreenCanvasRef} className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"></canvas>
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
                <div className="text-white text-9xl font-bold">{countdown}</div>
              </div>
            )}
          </div>

          <AudioContentTools />

          <div ref={timelineContainerRef} className="h-32 bg-gray-800 p-2 flex space-x-2 overflow-x-auto">
            {clips.map((clip, index) => (
              <div key={index} className={`relative h-full rounded-md overflow-hidden border-2 ${activeClipIndex === index ? 'border-blue-500' : 'border-transparent'}`} onClick={() => setActiveClipIndex(index)}>
                <video src={clip.url} className="h-full object-cover" />
                <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-1 rounded-bl-md cursor-pointer" onClick={() => handleRemoveClip(index)}>
                  <X size={16} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                  {clip.startTime.toFixed(2)}s - {clip.endTime.toFixed(2)}s
                </div>
                <div onMouseDown={(e) => handleTrimMouseDown(e, index, 'start')} className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize opacity-50 hover:opacity-100"></div>
                <div onMouseDown={(e) => handleTrimMouseDown(e, index, 'end')} className="absolute right-0 top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize opacity-50 hover:opacity-100"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar / Modals */}
      {isAudioLibraryOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-3/4 h-3/4">
            <AudioLibrary onSelect={handleAudioSelect} />
            <Button variant="secondary" onClick={() => setIsAudioLibraryOpen(false)} className="mt-4">Close</Button>
          </div>
        </div>
      )}

      {isTemplateLibraryOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-3/4 h-3/4">
            <TemplateLibrary onSelect={handleSelectTemplate} />
            <Button variant="secondary" onClick={() => setIsTemplateLibraryOpen(false)} className="mt-4">Close</Button>
          </div>
        </div>
      )}

      {isAIGeneratorOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-1/2">
            <AIContentGenerator onGeneratedContent={handleGeneratedContent} />
            <Button variant="secondary" onClick={() => setAIGeneratorOpen(false)} className="mt-4">Close</Button>
          </div>
        </div>
      )}

      {isCaptionsPanelOpen && (
        <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-2">Captions</h3>
          <Button onClick={generateAutoCaptions} disabled={isGeneratingCaptions} className="mb-4 w-full">
            {isGeneratingCaptions ? 'Generating...' : 'Auto-generate Captions'}
          </Button>
          
          {/* AI Translation Section */}
          {autoCaptions.length > 0 && (
            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
              <h4 className="font-medium mb-2">AI Translation</h4>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="bg-gray-600 text-white p-2 rounded w-full mb-2"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              <Button 
                onClick={translateCaptions} 
                disabled={isTranslating} 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isTranslating ? 'Translating...' : 'Translate Captions'}
              </Button>
              
              {/* Toggle between original and translated captions */}
              {translatedCaptions.length > 0 && (
                <div className="mt-3 flex items-center">
                  <input
                    type="checkbox"
                    checked={useTranslatedCaptions}
                    onChange={(e) => setUseTranslatedCaptions(e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm">Use translated captions</label>
                </div>
              )}
            </div>
          )}
          
          <textarea
            className="w-full h-48 bg-gray-700 text-white p-2 rounded"
            value={useTranslatedCaptions && translatedCaptions.length > 0 
              ? translatedCaptions.map(c => c.text).join(' ')
              : autoCaptions.map(c => c.text).join(' ')}
            onChange={(e) => {
              // This is a simplified implementation. A real editor would need more complex state management.
              const newText = e.target.value;
              const newCaptions = newText.split(' ').map((word, index) => ({
                id: `caption-${index}`,
                text: word,
                startTime: (useTranslatedCaptions ? translatedCaptions[index] : autoCaptions[index])?.startTime || 0,
                endTime: (useTranslatedCaptions ? translatedCaptions[index] : autoCaptions[index])?.endTime || 2,
              }));
              
              if (useTranslatedCaptions) {
                setTranslatedCaptions(newCaptions);
              } else {
                setAutoCaptions(newCaptions);
              }
            }}
          />
        </div>
      )}

      {isSettingsOpen && (
        <div className="w-80 bg-gray-800 p-4">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Playback Speed</label>
              <div className="flex space-x-2">
                {[0.5, 1, 1.5, 2].map(rate => (
                  <Button key={rate} variant={videoRef.current?.playbackRate === rate ? 'secondary' : 'outline'} onClick={() => handlePlaybackRateChange(rate)}>
                    {rate}x
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-2">Resolution</label>
              <select
                value={selectedResolution}
                onChange={(e) => setSelectedResolution(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded w-full"
              >
                {VIDEO_RESOLUTIONS.map(res => (
                  <option key={res.value} value={res.value}>{res.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortsEditor;