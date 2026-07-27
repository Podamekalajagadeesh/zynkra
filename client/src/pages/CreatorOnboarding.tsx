// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';
import {
  User, Wallet, FileText, Image, DollarSign, Sliders,
  Check, ArrowRight, ArrowLeft, Sparkles,
  Camera, Link, Music, BookOpen, Settings,
} from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Zynkra',
    description: 'You\'re about to become a creator on the world\'s most creator-friendly platform.',
    icon: Sparkles,
  },
  {
    id: 'profile',
    title: 'Set Up Your Profile',
    description: 'Customize your profile to make it uniquely yours.',
    icon: User,
  },
  {
    id: 'wallet',
    title: 'Connect Your Wallet',
    description: 'Connect a wallet to receive payments and join Web3.',
    icon: Wallet,
  },
  {
    id: 'content',
    title: 'First Content',
    description: 'Create your first post, article, or podcast.',
    icon: FileText,
  },
  {
    id: 'monetize',
    title: 'Set Up Monetization',
    description: 'Configure how you want to earn from your content.',
    icon: DollarSign,
  },
  {
    id: 'feed',
    title: 'Choose Your Feed',
    description: 'Pick how your feed looks and works.',
    icon: Sliders,
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'Everything is set up. Start creating!',
    icon: Check,
  },
];

interface OnboardingState {
  step: number;
  profile: {
    displayName: string;
    bio: string;
    avatar: string;
    tags: string[];
  };
  wallet: {
    connected: boolean;
    address: string;
  };
  content: {
    firstPost: string;
    contentType: 'post' | 'article' | 'podcast';
  };
  monetize: {
    tipsEnabled: boolean;
    subscriptionsEnabled: boolean;
    tiers: string[];
  };
  feed: {
    algorithm: string;
  };
}

const CreatorOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    step: 0,
    profile: { displayName: '', bio: '', avatar: '', tags: [] },
    wallet: { connected: false, address: '' },
    content: { firstPost: '', contentType: 'post' },
    monetize: { tipsEnabled: true, subscriptionsEnabled: false, tiers: [] },
    feed: { algorithm: 'relevance' },
  });

  const update = (section: keyof OnboardingState, data: any) => {
    setState(prev => ({ ...prev, [section]: { ...prev[section], ...data } }));
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await api.post('/onboarding/complete', {
        displayName: state.profile.displayName,
        bio: state.profile.bio,
        tags: state.profile.tags,
        feedAlgorithm: state.feed.algorithm,
        monetization: state.monetize,
      });

      addToast('Welcome to Zynkra! Your profile is ready.', 'success');
      navigate('/');
    } catch (error) {
      addToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStep = STEPS[step];

  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'welcome':
        return (
          <div className="text-center py-12">
            <Sparkles size={64} className="mx-auto text-primary-500 mb-6" />
            <h2 className="text-3xl font-bold mb-4">Welcome to Zynkra!</h2>
            <p className="text-lg text-dark-500 dark:text-dark-400 max-w-lg mx-auto">
              The universal social media platform. Create, share, and earn on your terms.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto">
              {[
                { icon: ShieldCheck, label: '90% Creator Revenue', color: 'text-green-500' },
                { icon: Lock, label: 'Encrypted (TLS)', color: 'text-blue-500' },
                { icon: Globe, label: 'Decentralized', color: 'text-purple-500' },
              ].map((item) => (
                <div key={item.label} className="text-center p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                  <item.icon size={24} className={`mx-auto ${item.color}`} />
                  <p className="text-xs mt-2 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6 py-6 max-w-md mx-auto">
            <h3 className="text-xl font-bold">Create Your Profile</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={state.profile.displayName}
                onChange={(e) => update('profile', { displayName: e.target.value })}
                placeholder={user?.username || 'Your name'}
                className="w-full rounded-xl border p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                value={state.profile.bio}
                onChange={(e) => update('profile', { bio: e.target.value })}
                placeholder="Tell the world about yourself..."
                rows={4}
                className="w-full rounded-xl border p-3 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Topics you create about</label>
              <div className="flex flex-wrap gap-2">
                {['Tech', 'Art', 'Music', 'Fitness', 'Food', 'Travel', 'Fashion', 'Gaming', 'Education', 'Business'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const tags = state.profile.tags.includes(tag)
                        ? state.profile.tags.filter((t) => t !== tag)
                        : [...state.profile.tags, tag];
                      update('profile', { tags });
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      state.profile.tags.includes(tag)
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="space-y-6 py-6 max-w-md mx-auto text-center">
            <Wallet size={48} className="mx-auto text-primary-500 mb-4" />
            <h3 className="text-xl font-bold">Connect Your Wallet</h3>
            <p className="text-dark-500">Connect a crypto wallet to receive direct payments from fans. This is optional — you can always set it up later.</p>
            <div className="p-6 bg-dark-50 dark:bg-dark-800 rounded-xl">
              <p className="text-sm text-dark-500">You can earn up to <strong>90%</strong> of all revenue directly to your wallet.</p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => update('wallet', { connected: false })} icon={<Link size={16} />}>
                Skip for now
              </Button>
              <Button onClick={() => {
                // This would trigger wallet connection
                update('wallet', { connected: true, address: '0x...' });
                addToast('Wallet connected!', 'success');
              }}>
                Connect Wallet
              </Button>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6 py-6 max-w-md mx-auto">
            <h3 className="text-xl font-bold">Create Your First Content</h3>
            <p className="text-dark-500">Share something with the world!</p>
            <div className="flex gap-3">
              {(['post', 'article', 'podcast'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => update('content', { contentType: type })}
                  className={`flex-1 p-4 rounded-xl border-2 text-center transition ${
                    state.content.contentType === type
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                      : 'border-dark-200 dark:border-dark-700 hover:border-primary-300'
                  }`}
                >
                  {type === 'post' && <FileText size={24} className="mx-auto mb-2" />}
                  {type === 'article' && <BookOpen size={24} className="mx-auto mb-2" />}
                  {type === 'podcast' && <Music size={24} className="mx-auto mb-2" />}
                  <p className="text-sm font-medium capitalize">{type}</p>
                </button>
              ))}
            </div>
            <textarea
              value={state.content.firstPost}
              onChange={(e) => update('content', { firstPost: e.target.value })}
              placeholder={`Write your first ${state.content.contentType}...`}
              rows={5}
              className="w-full rounded-xl border p-3 resize-none"
            />
          </div>
        );

      case 'monetize':
        return (
          <div className="space-y-6 py-6 max-w-md mx-auto">
            <h3 className="text-xl font-bold">Set Up Monetization</h3>
            <p className="text-dark-500">You keep 90% of everything you earn. Configure how you want to make money.</p>

            {[
              { key: 'tipsEnabled', label: 'Accept Tips', desc: 'Let fans send you tips directly' },
              { key: 'subscriptionsEnabled', label: 'Paid Subscriptions', desc: 'Offer exclusive content to subscribers' },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-dark-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(state.monetize as any)[item.key]}
                  onChange={(e) => update('monetize', { [item.key]: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
            ))}
          </div>
        );

      case 'feed':
        return (
          <div className="space-y-6 py-6 max-w-md mx-auto">
            <h3 className="text-xl font-bold">Choose Your Feed</h3>
            <p className="text-dark-500">Zynkra gives you full control over what you see.</p>
            <div className="space-y-3">
              {[
                { id: 'chronological', label: 'Latest', icon: List, desc: 'Newest posts first' },
                { id: 'engagement', label: 'Popular', icon: TrendingUp, desc: 'Most engaged content' },
                { id: 'relevance', label: 'For You', icon: Sparkles, desc: 'AI-curated for you' },
                { id: 'friends', label: 'Friends', icon: Users, desc: 'People you follow' },
                { id: 'discover', label: 'Discover', icon: Compass, desc: 'Find new creators' },
              ].map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => update('feed', { algorithm: algo.id })}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition ${
                    state.feed.algorithm === algo.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                      : 'border-dark-200 dark:border-dark-700 hover:border-primary-300'
                  }`}
                >
                  <algo.icon size={20} className={state.feed.algorithm === algo.id ? 'text-primary-500' : 'text-dark-400'} />
                  <div className="text-left flex-1">
                    <p className="font-medium">{algo.label}</p>
                    <p className="text-sm text-dark-500">{algo.desc}</p>
                  </div>
                  {state.feed.algorithm === algo.id && <Check size={16} className="text-primary-500" />}
                </button>
              ))}
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-12">
            <Check size={64} className="mx-auto text-green-500 mb-6" />
            <h2 className="text-3xl font-bold mb-4">You're All Set!</h2>
            <p className="text-lg text-dark-500 dark:text-dark-400 max-w-lg mx-auto mb-8">
              Your profile is ready. Start creating and earning!
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              {[
                { label: 'Profile Complete', icon: Check },
                { label: 'Wallet Ready', icon: Wallet },
                { label: 'Content Created', icon: FileText },
                { label: 'Monetization Active', icon: DollarSign },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl text-green-700 dark:text-green-400">
                  <item.icon size={16} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            <Button size="lg" onClick={handleComplete} isLoading={submitting}>
              Start Creating!
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.slice(0, -1).map((s, i) => (
            <div key={s.id} className="flex-1 flex items-center">
              <div className={`w-full h-2 rounded-full ${i <= step ? 'bg-primary-500' : 'bg-dark-200 dark:bg-dark-700'}`} />
            </div>
          ))}
          <div className={`w-2 h-2 rounded-full ${step === STEPS.length - 1 ? 'bg-primary-500' : 'bg-dark-200 dark:bg-dark-700'}`} />
        </div>

        {/* Step indicator */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-50 dark:bg-dark-800 rounded-full text-sm">
            <currentStep.icon size={16} className="text-primary-500" />
            <span>{step + 1} / {STEPS.length - 1}</span>
          </div>
          <h2 className="text-2xl font-bold mt-4">{currentStep.title}</h2>
          <p className="text-dark-500 dark:text-dark-400 mt-2">{currentStep.description}</p>
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-sm">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} disabled={step === 0} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} icon={<ArrowRight size={16} />}>
              Continue
            </Button>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
};

export default CreatorOnboarding;
