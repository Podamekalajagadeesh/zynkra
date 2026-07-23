import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { CommunityList } from '../components/communities/CommunityList';
import { ThreadList } from '../components/communities/ThreadList';
import { ThreadDetail } from '../components/communities/ThreadDetail';
import { CreateCommunityForm } from '../components/communities/CreateCommunityForm';
import { CreateThreadForm } from '../components/communities/CreateThreadForm';
import { Community, Thread, CommunityChannel } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { ServerChannelsList } from '../components/communities/ServerChannelsList';
import { VoiceChannelView } from '../components/communities/VoiceChannelView';
import { StageChannelView } from '../components/communities/StageChannelView';
import { ForumChannelView } from '../components/communities/ForumChannelView';
import { ProfessionalCommunityView } from '../components/communities/ProfessionalCommunityView';

// Mock data - in a real app this would come from an API
const initialCommunities: Community[] = [
  {
    id: '1',
    name: 'technology',
    description: 'Discuss the latest in tech, gadgets, and software',
    createdAt: new Date('2024-01-01').toISOString(),
    createdBy: { id: 'admin', email: null, walletAddress: null },
    members: [{ id: 'current-user', role: 'member' as const }],
    flairs: [
      { id: '1', name: 'News', color: '#3b82f6', textColor: '#ffffff' },
      { id: '2', name: 'Discussion', color: '#10b981', textColor: '#ffffff' },
      { id: '3', name: 'Hardware', color: '#f59e0b', textColor: '#ffffff' },
    ],
    isPrivate: false,
    isNsfw: false,
    memberCount: 125000,
    onlineCount: 3400,
    communityType: 'general',
    // Discord-style server channels and categories
    categories: [
      { id: 'cat1', name: 'TEXT CHANNELS', position: 0 },
      { id: 'cat2', name: 'VOICE CHANNELS', position: 1 },
      { id: 'cat3', name: 'STAGES & EVENTS', position: 2 },
      { id: 'cat4', name: 'FORUMS', position: 3 },
    ],
    channels: [
      // Text channels
      { id: 'c1', name: 'general', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat1' },
      { id: 'c2', name: 'news', type: 'text' as const, isPrivate: false, position: 1, categoryId: 'cat1' },
      { id: 'c3', name: 'showcase', type: 'text' as const, isPrivate: false, position: 2, categoryId: 'cat1' },
      // Voice channels
      { id: 'c4', name: 'General Voice', type: 'voice' as const, isPrivate: false, position: 0, categoryId: 'cat2' },
      { id: 'c5', name: 'Tech Support', type: 'voice' as const, isPrivate: false, position: 1, categoryId: 'cat2' },
      // Stage channels
      { id: 'c6', name: 'Weekly Tech Talk', type: 'stage' as const, isPrivate: false, position: 0, categoryId: 'cat3' },
      // Forum channels
      { id: 'c7', name: 'hardware-discussions', type: 'forum' as const, isPrivate: false, position: 0, categoryId: 'cat4' },
      { id: 'c8', name: 'software-development', type: 'forum' as const, isPrivate: false, position: 1, categoryId: 'cat4' },
    ],
    activeVoiceChannels: {
      'c4': ['user1', 'user2', 'user3'],
    },
    activeStageChannels: {
      'c6': [
        { userId: 'host1', isSpeaker: true, isMuted: false },
        { userId: 'guest1', isSpeaker: true, isMuted: false },
        { userId: 'user1', isSpeaker: false, isMuted: true },
        { userId: 'user2', isSpeaker: false, isMuted: true },
      ],
    },
  },
  {
    id: '2',
    name: 'gaming',
    description: 'All things gaming - PC, console, mobile, and more',
    createdAt: new Date('2024-01-05').toISOString(),
    createdBy: { id: 'admin', email: null, walletAddress: null },
    members: [{ id: 'current-user', role: 'member' as const }],
    flairs: [
      { id: '1', name: 'PC Gaming', color: '#8b5cf6', textColor: '#ffffff' },
      { id: '2', name: 'Console', color: '#ec4899', textColor: '#ffffff' },
      { id: '3', name: 'News', color: '#ef4444', textColor: '#ffffff' },
    ],
    isPrivate: false,
    isNsfw: false,
    memberCount: 289000,
    onlineCount: 8700,
    communityType: 'general',
    // Discord-style server channels and categories
    categories: [
      { id: 'cat1', name: 'TEXT CHANNELS', position: 0 },
      { id: 'cat2', name: 'VOICE CHANNELS', position: 1 },
      { id: 'cat3', name: 'LFG (LOOKING FOR GROUP)', position: 2 },
    ],
    channels: [
      // Text channels
      { id: 'c1', name: 'general-chat', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat1' },
      { id: 'c2', name: 'game-updates', type: 'text' as const, isPrivate: false, position: 1, categoryId: 'cat1' },
      // Voice channels
      { id: 'c3', name: 'Gaming Lobby 1', type: 'voice' as const, isPrivate: false, position: 0, categoryId: 'cat2' },
      { id: 'c4', name: 'Gaming Lobby 2', type: 'voice' as const, isPrivate: false, position: 1, categoryId: 'cat2' },
      { id: 'c5', name: 'Spectator Stream', type: 'voice' as const, isPrivate: false, position: 2, categoryId: 'cat2' },
      // LFG forum channels
      { id: 'c6', name: 'looking-for-team', type: 'forum' as const, isPrivate: false, position: 0, categoryId: 'cat3' },
    ],
    activeVoiceChannels: {
      'c3': ['user4', 'user5', 'user6', 'user7'],
      'c4': ['user8', 'user9'],
    },
    activeStageChannels: {},
  },
  // Local community example (Nextdoor-style) - Downtown Brooklyn Neighborhood
  {
    id: '3',
    name: 'Downtown Brooklyn Neighbors',
    description: 'Connect with your neighbors, find local businesses, and stay updated on neighborhood news',
    createdAt: new Date('2024-02-10').toISOString(),
    createdBy: { id: 'local-admin', email: null, walletAddress: null },
    members: [{ id: 'current-user', role: 'member' as const }],
    flairs: [
      { id: '1', name: 'Local News', color: '#22c55e', textColor: '#ffffff' },
      { id: '2', name: 'Business', color: '#3b82f6', textColor: '#ffffff' },
      { id: '3', name: 'Lost & Found', color: '#f59e0b', textColor: '#ffffff' },
      { id: '4', name: 'Alert', color: '#ef4444', textColor: '#ffffff' },
    ],
    isPrivate: false,
    isNsfw: false,
    memberCount: 8450,
    onlineCount: 127,
    communityType: 'local',
    location: {
      city: 'New York',
      state: 'NY',
      zipCode: '11201',
      latitude: 40.6937,
      longitude: -73.9862,
      radius: 2 // 2 mile radius for the neighborhood
    },
    // Local business listings (Nextdoor-style)
    localBusinessListings: [
      {
        id: 'b1',
        businessName: 'Brooklyn Bagel Co.',
        description: 'Family-owned bagel shop serving fresh bagels, coffee, and breakfast sandwiches since 1998',
        address: '123 Fulton St, Brooklyn, NY 11201',
        phone: '(718) 555-1234',
        website: 'https://brooklynbagelco.example.com',
        category: 'restaurant',
        rating: 4.7,
        reviewCount: 328,
        createdAt: new Date('2024-02-11').toISOString(),
        addedBy: 'local-admin'
      },
      {
        id: 'b2',
        businessName: 'Downtown Grocers',
        description: 'Your neighborhood full-service grocery store with fresh produce and local products',
        address: '456 Smith St, Brooklyn, NY 11201',
        phone: '(718) 555-5678',
        category: 'grocery',
        rating: 4.3,
        reviewCount: 156,
        createdAt: new Date('2024-02-12').toISOString(),
        addedBy: 'local-admin'
      },
      {
        id: 'b3',
        businessName: 'Main Street Hardware',
        description: 'Everything you need for your home improvement projects, plus expert advice',
        address: '789 Atlantic Ave, Brooklyn, NY 11201',
        phone: '(718) 555-9012',
        category: 'services',
        rating: 4.5,
        reviewCount: 89,
        createdAt: new Date('2024-02-15').toISOString(),
        addedBy: 'local-admin'
      }
    ],
    // Neighborhood alerts
    neighborhoodAlerts: [
      {
        id: 'a1',
        title: 'Street Cleaning Tomorrow - Front St',
        content: 'Street cleaning will occur on Front St between 9AM-12PM. Please move your vehicles to avoid tickets.',
        createdAt: new Date('2026-06-22').toISOString(),
        createdBy: 'local-admin',
        isUrgent: false,
        expiresAt: new Date('2026-06-24').toISOString()
      },
      {
        id: 'a2',
        title: 'Water Main Break - Jay St',
        content: 'Water service will be interrupted on Jay St from 10AM-4PM today for repairs. Please plan accordingly.',
        createdAt: new Date('2026-06-23').toISOString(),
        createdBy: 'local-admin',
        isUrgent: true
      }
    ],
    // Lost & Found posts
    lostAndFoundPosts: [
      {
        id: 'lf1',
        title: 'LOST: Golden Retriever in Brooklyn Bridge Park',
        description: 'Missing male golden retriever, answers to Max. Last seen near the pier. Wearing a red collar. Reward offered for safe return.',
        isLost: true,
        location: 'Brooklyn Bridge Park',
        contactInfo: 'Please call (718) 555-4321 if found',
        media: [{ url: 'https://example.com/max.jpg', type: 'image' }],
        createdAt: new Date('2026-06-21').toISOString(),
        createdBy: 'user123',
        isResolved: false
      }
    ],
    // Classifieds listings
    classifieds: [
      {
        id: 'c1',
        title: 'FREE: Couch - Good condition',
        description: 'Free grey couch, 3 seater. Needs to be picked up this week. Minor wear but still very comfortable.',
        price: 0,
        category: 'free',
        media: [{ url: 'https://example.com/couch.jpg', type: 'image' }],
        createdAt: new Date('2026-06-20').toISOString(),
        createdBy: 'user456',
        isActive: true
      },
      {
        id: 'c2',
        title: 'Bicycle for sale - Trek mountain bike',
        description: '2022 Trek Marlin 5, size medium. Great condition, only ridden a few times. Includes helmet and lock.',
        price: 500,
        category: 'for sale',
        contactInfo: 'Text for more photos or to view',
        media: [{ url: 'https://example.com/bike.jpg', type: 'image' }],
        createdAt: new Date('2026-06-18').toISOString(),
        createdBy: 'user789',
        isActive: true
      }
    ],
    // Server channels specific to local community
    categories: [
      { id: 'cat1', name: 'GENERAL', position: 0 },
      { id: 'cat2', name: 'LOCAL BUSINESSES', position: 1 },
      { id: 'cat3', name: 'DISCUSSIONS', position: 2 },
    ],
    channels: [
      // Text channels
      { id: 'lc1', name: 'general-chat', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat1' },
      { id: 'lc2', name: 'neighborhood-alerts', type: 'text' as const, isPrivate: false, position: 1, categoryId: 'cat1' },
      { id: 'lc3', name: 'local-business-recommendations', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat2' },
      { id: 'lc4', name: 'lost-found', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat3' },
      { id: 'lc5', name: 'buy-sell-trade', type: 'text' as const, isPrivate: false, position: 1, categoryId: 'cat3' },
    ],
    activeVoiceChannels: {},
    activeStageChannels: {},
  },
  // Professional community example (LinkedIn-style) - Tech Industry Professionals Network
  {
    id: '4',
    name: 'Tech Industry Professionals',
    description: 'Connect with fellow tech professionals, share career opportunities, and build your professional network',
    createdAt: new Date('2024-03-15').toISOString(),
    createdBy: { id: 'recruiter-pro', email: null, walletAddress: null },
    members: [{ id: 'current-user', role: 'member' as const }],
    flairs: [
      { id: '1', name: 'Career Advice', color: '#2563eb', textColor: '#ffffff' },
      { id: '2', name: 'Job Opportunity', color: '#16a34a', textColor: '#ffffff' },
      { id: '3', name: 'Industry News', color: '#9333ea', textColor: '#ffffff' },
    ],
    isPrivate: false,
    isNsfw: false,
    memberCount: 45200,
    onlineCount: 892,
    communityType: 'professional',
    industryTags: ['Software Development', 'Data Science', 'Product Management', 'Cloud Computing', 'AI/ML'],
    // Professional community features (LinkedIn-style)
    jobListings: [
      {
        id: 'job1',
        title: 'Senior Software Engineer',
        company: 'Tech Giants Inc.',
        location: 'San Francisco, CA (Hybrid)',
        jobType: 'full-time',
        description: 'We are looking for a senior software engineer to lead the development of our core platform. You will work with a talented team of engineers to build scalable, high-performance systems that serve millions of users.',
        requirements: ['5+ years of experience with React and TypeScript', 'Strong understanding of distributed systems', 'Experience with cloud platforms (AWS/GCP)', 'Track record of leading technical projects'],
        responsibilities: ['Lead architecture decisions for core features', 'Mentor junior and mid-level engineers', 'Collaborate with product teams to define roadmap', 'Drive best practices and code quality'],
        salary: { min: 150000, max: 220000, currency: 'USD' },
        postedBy: 'hr-techgiants',
        postedAt: new Date('2026-06-10').toISOString(),
        applicationUrl: 'https://techgiants.example.com/careers/sse',
        applications: []
      },
      {
        id: 'job2',
        title: 'Product Manager',
        company: 'StartupXYZ',
        location: 'Remote',
        jobType: 'remote',
        description: 'Join our fast-growing startup as a product manager to shape the future of our AI-powered productivity tool. You will work closely with engineering, design, and marketing teams to deliver exceptional products.',
        requirements: ['3+ years of product management experience', 'Experience with B2B SaaS products', 'Strong analytical and problem-solving skills', 'Excellent communication and leadership abilities'],
        responsibilities: ['Define product strategy and roadmap', 'Gather and prioritize user requirements', 'Work with engineering to deliver features on time', 'Analyze product metrics to drive decisions'],
        salary: { min: 130000, max: 180000, currency: 'USD' },
        postedBy: 'founder-startupxyz',
        postedAt: new Date('2026-06-15').toISOString(),
        applications: []
      }
    ],
    professionalProfiles: [
      {
        userId: 'user-johndoe',
        profile: {
          userId: 'user-johndoe',
          headline: 'CTO at TechCorp | Cloud Architect | Startup Advisor',
          currentCompany: 'TechCorp',
          industry: 'Software',
          location: 'Seattle, WA',
          about: 'Passionate technologist with 15+ years of experience building scalable cloud systems. I love mentoring engineers and helping early-stage startups with their technical strategy.',
          experience: [
            {
              id: 'exp1',
              title: 'CTO',
              company: 'TechCorp',
              location: 'Seattle, WA',
              employmentType: 'full-time',
              startDate: '2020-01',
              description: 'Leading a team of 50+ engineers, responsible for the entire technology stack of the company.'
            }
          ],
          education: [
            {
              id: 'edu1',
              school: 'Stanford University',
              degree: 'MS',
              fieldOfStudy: 'Computer Science',
              startDate: '2005-09',
              endDate: '2007-06'
            }
          ],
          skills: [
            { skillId: 'skill-1', name: 'JavaScript', endorsements: [] },
            { skillId: 'skill-2', name: 'TypeScript', endorsements: [] },
            { skillId: 'skill-5', name: 'Python', endorsements: [] }
          ],
          certifications: [],
          projects: []
        }
      },
      {
        userId: 'user-janedoe',
        profile: {
          userId: 'user-janedoe',
          headline: 'Senior Product Manager at AI Solutions | Ex-Google | MBA',
          currentCompany: 'AI Solutions',
          industry: 'Artificial Intelligence',
          location: 'New York, NY',
          about: 'Product leader with 8+ years of experience building consumer and enterprise products. Specializing in AI and machine learning applications.',
          experience: [
            {
              id: 'exp1',
              title: 'Senior Product Manager',
              company: 'AI Solutions',
              location: 'New York, NY',
              employmentType: 'full-time',
              startDate: '2021-03',
              description: 'Leading product development for our flagship AI-powered analytics platform.'
            }
          ],
          education: [
            {
              id: 'edu1',
              school: 'Harvard Business School',
              degree: 'MBA',
              fieldOfStudy: 'Business Administration',
              startDate: '2015-09',
              endDate: '2017-06'
            }
          ],
          skills: [
            { skillId: 'skill-8', name: 'Product Management', endorsements: [] },
            { skillId: 'skill-10', name: 'Data Analysis', endorsements: [] }
          ],
          certifications: [],
          projects: []
        }
      }
    ],
    // Server channels for professional community
    categories: [
      { id: 'cat1', name: 'GENERAL', position: 0 },
      { id: 'cat2', name: 'CAREER DISCUSSIONS', position: 1 },
      { id: 'cat3', name: 'NETWORKING', position: 2 },
      { id: 'cat4', name: 'JOB BOARD', position: 3 },
    ],
    channels: [
      // Text channels
      { id: 'pc1', name: 'general', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat1' },
      { id: 'pc2', name: 'career-advice', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat2' },
      { id: 'pc3', name: 'interview-experiences', type: 'text' as const, isPrivate: false, position: 1, categoryId: 'cat2' },
      { id: 'pc4', name: 'introduce-yourself', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat3' },
      { id: 'pc5', name: 'job-opportunities', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat4' },
    ],
    activeVoiceChannels: {},
    activeStageChannels: {},
  },
];

const initialThreads: Thread[] = [
  {
    id: '1',
    title: 'What are your thoughts on the latest AI developments in 2026?',
    content: 'The pace of AI advancement has been incredible this year. From multimodal models to AGI prototypes, it feels like we\'re at a turning point. What do you think will be the biggest impact on everyday life?',
    createdAt: new Date('2026-06-20').toISOString(),
    createdBy: { id: 'techenthusiast', email: null, walletAddress: null, profile: { avatarUrl: '' } },
    communityId: '1',
    flairs: [{ id: '1', name: 'Discussion', color: '#10b981', textColor: '#ffffff' }],
    isPinned: false,
    isLocked: false,
    isMegathread: false,
    upvotes: [{ id: 'user1' }, { id: 'user2' }, { id: 'user3' }],
    downvotes: [],
    comments: [
      {
        id: 'c1',
        content: 'I think the biggest change will be in education - personalized AI tutors will completely transform how we learn',
        createdAt: new Date('2026-06-20').toISOString(),
        user: { id: 'educator', email: null, walletAddress: null },
        replies: [
          {
            id: 'c1r1',
            content: 'Absolutely agree! My kids already use AI to help with their homework and it\'s night and day compared to when I was growing up',
            createdAt: new Date('2026-06-21').toISOString(),
            user: { id: 'parent123', email: null, walletAddress: null },
          }
        ]
      }
    ],
    viewCount: 4520,
  },
  {
    id: '2',
    title: '[MEGATHREAD] Q3 2026 Technology Release Discussion',
    content: 'Use this thread to discuss all the major tech releases coming this quarter. This includes the new iPhone 18, Samsung Galaxy S27, NVIDIA RTX 5090, and more!',
    createdAt: new Date('2026-06-15').toISOString(),
    createdBy: { id: 'mod1', email: null, walletAddress: null },
    communityId: '1',
    flairs: [{ id: '1', name: 'News', color: '#3b82f6', textColor: '#ffffff' }],
    isPinned: true,
    isLocked: false,
    isMegathread: true,
    upvotes: [{ id: 'user1' }, { id: 'user2' }, { id: 'user3' }, { id: 'user4' }, { id: 'user5' }],
    downvotes: [],
    comments: [],
    viewCount: 12800,
  },
];

export const CommunitiesPage = () => {
  const { activeAccount } = useAuth();
  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | undefined>();
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>();
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>();
  const [userVotes, setUserVotes] = useState<{ [threadId: string]: 'up' | 'down' | null }>({});

  // Get the currently selected channel if one is active
  const selectedChannel = selectedCommunity?.channels.find(c => c.id === selectedChannelId);

  // Handler to join a voice channel
  const handleJoinVoiceChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    setSelectedThreadId(undefined);
  };

  // Handler to join a stage channel
  const handleJoinStageChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    setSelectedThreadId(undefined);
  };

  // Handler to leave the current channel
  const handleLeaveChannel = () => {
    setSelectedChannelId(undefined);
  };

  // Handler to select a text channel
  const handleSelectTextChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    setSelectedThreadId(undefined);
  };

  const selectedCommunity = communities.find((c) => c.id === selectedCommunityId);
  const selectedThread = threads.find((t) => t.id === selectedThreadId);
  const communityThreads = threads.filter((t) => t.communityId === selectedCommunityId);

  const handleCreateCommunity = (newCommunityData: {
    name: string;
    description: string;
    isPrivate: boolean;
    isNsfw: boolean;
    flairs: any[];
    communityType?: 'general' | 'local' | 'professional' | 'fan' | 'other';
    location?: {
      city: string;
      state: string;
      zipCode: string;
      latitude: number;
      longitude: number;
      radius: number;
    };
  }) => {
    // Create default categories and channels based on community type
    let defaultCategories, defaultChannels;
    
    if (newCommunityData.communityType === 'local') {
      // Local community (Nextdoor-style) default channels
      defaultCategories = [
        { id: 'cat1', name: 'GENERAL', position: 0 },
        { id: 'cat2', name: 'LOCAL BUSINESSES', position: 1 },
        { id: 'cat3', name: 'DISCUSSIONS', position: 2 },
      ];
      defaultChannels = [
        // Text channels for local community
        { id: Date.now().toString() + '-lc1', name: 'general-chat', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat1' },
        { id: Date.now().toString() + '-lc2', name: 'neighborhood-alerts', type: 'text' as const, isPrivate: false, position: 1, categoryId: 'cat1' },
        { id: Date.now().toString() + '-lc3', name: 'local-business-recommendations', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat2' },
        { id: Date.now().toString() + '-lc4', name: 'lost-found', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat3' },
        { id: Date.now().toString() + '-lc5', name: 'buy-sell-trade', type: 'text' as const, isPrivate: false, position: 1, categoryId: 'cat3' },
      ];
    } else if (newCommunityData.communityType === 'fan') {
      // Fan/creator community (Patreon/Discord-style) default channels with exclusive creator spaces
      defaultCategories = [
        { id: 'cat1', name: 'FAN GENERAL', position: 0 },
        { id: 'cat2', name: 'EXCLUSIVE CREATOR CONTENT', position: 1 },
        { id: 'cat3', name: 'FAN VOICE CHATS', position: 2 },
        { id: 'cat4', name: 'CREATOR STAGES & AMAs', position: 3 },
      ];
      defaultChannels = [
        // Public fan channels
        { id: Date.now().toString() + '-fc1', name: 'fan-introductions', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat1' },
        { id: Date.now().toString() + '-fc2', name: 'general-fan-chat', type: 'text' as const, isPrivate: false, position: 1, categoryId: 'cat1' },
        // Exclusive creator-only channels (requires membership)
        { id: Date.now().toString() + '-fc3', name: 'creator-updates', type: 'text' as const, isPrivate: true, position: 0, categoryId: 'cat2' },
        { id: Date.now().toString() + '-fc4', name: 'exclusive-media', type: 'text' as const, isPrivate: true, position: 1, categoryId: 'cat2' },
        { id: Date.now().toString() + '-fc5', name: 'behind-the-scenes', type: 'text' as const, isPrivate: true, position: 2, categoryId: 'cat2' },
        // Fan voice channels
        { id: Date.now().toString() + '-fc6', name: 'Fan Hangout 1', type: 'voice' as const, isPrivate: false, position: 0, categoryId: 'cat3' },
        { id: Date.now().toString() + '-fc7', name: 'Fan Hangout 2', type: 'voice' as const, isPrivate: false, position: 1, categoryId: 'cat3' },
        // Creator AMA/stage channel
        { id: Date.now().toString() + '-fc8', name: 'Monthly Creator AMA', type: 'stage' as const, isPrivate: true, position: 0, categoryId: 'cat4' },
      ];
    } else {
      // General community default channels
      defaultCategories = [
        { id: 'cat1', name: 'TEXT CHANNELS', position: 0 },
        { id: 'cat2', name: 'VOICE CHANNELS', position: 1 },
      ];
      defaultChannels = [
        { id: Date.now().toString() + '-c1', name: 'general', type: 'text' as const, isPrivate: false, position: 0, categoryId: 'cat1' },
        { id: Date.now().toString() + '-c2', name: 'General Voice', type: 'voice' as const, isPrivate: false, position: 0, categoryId: 'cat2' },
      ];
    }
    
    const newCommunity: Community = {
      id: Date.now().toString(),
      ...newCommunityData,
      createdAt: new Date().toISOString(),
      createdBy: { id: activeAccount?.id || 'current-user', email: null, walletAddress: null },
      members: [{ id: activeAccount?.id || 'current-user', role: 'owner' as const }],
      memberCount: 1,
      onlineCount: 1,
      categories: defaultCategories,
      channels: defaultChannels,
      activeVoiceChannels: {},
      activeStageChannels: {},
      // Initialize local-specific fields for local communities
      ...(newCommunityData.communityType === 'local' && {
        localBusinessListings: [],
        neighborhoodAlerts: [],
        lostAndFoundPosts: [],
        classifieds: []
      }),
      // Initialize professional-specific fields for professional communities
      ...(newCommunityData.communityType === 'professional' && {
        jobListings: [],
        professionalProfiles: [],
        industryTags: []
      }),
      // Initialize creator/fan-specific fields for fan communities
      ...(newCommunityData.communityType === 'fan' && {
        tieredMembership: true, // Enable tiered subscriptions for fan clubs
        membershipTiers: [
          { name: 'Basic Fan', price: 0, benefits: ['Access to public fan channels'] },
          { name: 'Super Fan', price: 5, benefits: ['Access to all exclusive content', 'Early access to creator posts'] },
          { name: 'Ultimate Fan', price: 15, benefits: ['1-on-1 creator Q&As', 'Exclusive merch discounts', 'Custom fan badge'] }
        ],
        creatorId: activeAccount?.id || 'current-user', // Link community to the creator who owns it
        fanBadges: [],
        exclusiveContentPosts: []
      })
    };
    setCommunities([...communities, newCommunity]);
  };

  const handleCreateThread = (newThreadData: {
    title: string;
    content: string;
    flairs: any[];
    isMegathread: boolean;
    media?: { url: string; type: 'image' | 'video' }[];
  }) => {
    if (!selectedCommunityId) return;
    
    const newThread: Thread = {
      id: Date.now().toString(),
      ...newThreadData,
      createdAt: new Date().toISOString(),
      createdBy: { id: activeAccount?.id || 'current-user', email: null, walletAddress: null, profile: { avatarUrl: '' } },
      communityId: selectedCommunityId,
      isPinned: newThreadData.isMegathread,
      isLocked: false,
      upvotes: [],
      downvotes: [],
      comments: [],
      viewCount: 0,
    };
    setThreads([...threads, newThread]);
  };

  const handleVote = (threadId: string, voteType: 'up' | 'down') => {
    const currentVote = userVotes[threadId];
    const userId = activeAccount?.id || 'current-user';

    setThreads(threads.map((thread) => {
      if (thread.id === threadId) {
        let newUpvotes = [...thread.upvotes];
        let newDownvotes = [...thread.downvotes];

        // Remove existing vote if any
        newUpvotes = newUpvotes.filter((u) => u.id !== userId);
        newDownvotes = newDownvotes.filter((u) => u.id !== userId);

        // Add new vote if it's different from current
        if (currentVote !== voteType) {
          if (voteType === 'up') {
            newUpvotes.push({ id: userId });
          } else {
            newDownvotes.push({ id: userId });
          }
          setUserVotes({ ...userVotes, [threadId]: voteType });
        } else {
          // User clicked the same vote, remove it
          setUserVotes({ ...userVotes, [threadId]: null });
        }

        return { ...thread, upvotes: newUpvotes, downvotes: newDownvotes };
      }
      return thread;
    }));
  };

  const handleAddComment = (threadId: string, content: string, parentId?: string) => {
    const newComment = {
      id: Date.now().toString(),
      content,
      createdAt: new Date().toISOString(),
      user: { id: activeAccount?.id || 'current-user', email: null, walletAddress: null },
    };

    setThreads(threads.map((thread) => {
      if (thread.id === threadId) {
        if (parentId) {
          // Add reply to existing comment
          const addReplyToComment = (comments: any[]): any[] => {
            return comments.map((comment) => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment],
                };
              }
              if (comment.replies) {
                return { ...comment, replies: addReplyToComment(comment.replies) };
              }
              return comment;
            });
          };
          return {
            ...thread,
            comments: addReplyToComment([...thread.comments]),
          };
        } else {
          // Add top-level comment
          return {
            ...thread,
            comments: [...thread.comments, newComment],
          };
        }
      }
      return thread;
    }));
  };

  return (
    <PageShell title="Communities" description="Reddit-style forum discussions">
      <div className="grid grid-cols-[3fr_5fr_13fr] gap-6 h-full">
        {/* Left sidebar - Community list and create form */}
        <div className="border-r border-dark-200 dark:border-dark-700 pr-4">
          <CreateCommunityForm onCreateCommunity={handleCreateCommunity} />
          <CommunityList
            communities={communities}
            onSelectCommunity={(id) => {
              setSelectedCommunityId(id);
              setSelectedThreadId(undefined);
              setSelectedChannelId(undefined);
            }}
            selectedId={selectedCommunityId}
          />
        </div>

        {/* Middle sidebar - Server channels (only show when a community is selected) */}
        {selectedCommunity && (
          <div className="border-r border-dark-200 dark:border-dark-700 pr-4 overflow-y-auto">
            <ServerChannelsList
              community={selectedCommunity}
              selectedChannelId={selectedChannelId}
              onSelectChannel={handleSelectTextChannel}
              onJoinVoiceChannel={handleJoinVoiceChannel}
              onJoinStageChannel={handleJoinStageChannel}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {selectedCommunity ? (
            selectedCommunity.communityType === 'professional' ? (
              <ProfessionalCommunityView
                community={selectedCommunity}
                currentUserId={activeAccount?.id || 'current-user'}
              />
            ) : selectedChannel ? (
              selectedChannel.type === 'voice' ? (
                <VoiceChannelView
                  channelName={selectedChannel.name}
                  participants={selectedCommunity.activeVoiceChannels[selectedChannel.id] || []}
                  onLeave={handleLeaveChannel}
                />
              ) : selectedChannel.type === 'stage' ? (
                <StageChannelView
                  channelName={selectedChannel.name}
                  participants={selectedCommunity.activeStageChannels[selectedChannel.id] || []}
                  onLeave={handleLeaveChannel}
                />
              ) : selectedChannel.type === 'forum' ? (
                <ForumChannelView channelName={selectedChannel.name} />
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">#{selectedChannel.name}</h2>
                    <CreateThreadForm
                      community={selectedCommunity}
                      onCreateThread={handleCreateThread}
                    />
                  </div>
                  <ThreadList
                    threads={communityThreads}
                    community={selectedCommunity}
                    onSelectThread={setSelectedThreadId}
                    onVote={handleVote}
                    userVotes={userVotes}
                  />
                </div>
              )
            ) : selectedThread ? (
              <ThreadDetail
                thread={selectedThread}
                community={selectedCommunity}
                onBack={() => setSelectedThreadId(undefined)}
                onAddComment={(content, parentId) => handleAddComment(selectedThread.id, content, parentId)}
                onVote={(voteType) => handleVote(selectedThread.id, voteType)}
                userVote={userVotes[selectedThread.id] || null}
              />
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">{selectedCommunity.name}</h2>
                  <CreateThreadForm
                    community={selectedCommunity}
                    onCreateThread={handleCreateThread}
                  />
                </div>
                <ThreadList
                  threads={communityThreads}
                  community={selectedCommunity}
                  onSelectThread={setSelectedThreadId}
                  onVote={handleVote}
                  userVotes={userVotes}
                />
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-dark-500 dark:text-dark-400 h-full">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Select a community</h3>
                <p>Choose a community from the list or create your own to start discussing!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default CommunitiesPage;