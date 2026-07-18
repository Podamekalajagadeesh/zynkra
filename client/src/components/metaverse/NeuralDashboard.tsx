import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  useNeuralState, 
  NeuralState 
} from '../../hooks/useNeuralState';
import { ConsciousAvatar } from './ConsciousAvatar';
import {
  Brain,
  Heart,
  Activity,
  Settings,
  Share2,
  Eye,
  EyeOff,
  Play,
  Pause,
  RefreshCw,
  Wifi,
  WifiOff,
  Shield,
  Users,
  Calendar,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface PrivacySettings {
  shareEmotions: boolean;
  shareFocus: boolean;
  sharePhysicalState: boolean;
  shareHeartRate: boolean;
  allowNeuralTracking: boolean;
  showInVirtualWorlds: boolean;
  showInProfile: boolean;
  shareWithFriendsOnly: boolean;
}

const NeuralDashboard: React.FC = () => {
  const {
    neuralState,
    isTracking,
    startTracking,
    stopTracking,
    getDominantEmotion,
    getOverallState,
  } = useNeuralState();

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    shareEmotions: true,
    shareFocus: true,
    sharePhysicalState: true,
    shareHeartRate: true,
    allowNeuralTracking: true,
    showInVirtualWorlds: true,
    showInProfile: true,
    shareWithFriendsOnly: true,
  });

  const [activeTab, setActiveTab] = React.useState('overview');
  const overallState = getOverallState();
  const dominantEmotion = getDominantEmotion();

  const togglePrivacySetting = (key: keyof PrivacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const NeuralMetric: React.FC<{
    label: string;
    value: number;
    maxValue?: number;
    icon: React.ReactNode;
    color: string;
    description?: string;
  }> = ({ label, value, maxValue = 100, icon, color, description }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{label}</span>
        </div>
        <span className="text-sm text-gray-500">{Math.round(value)}/{maxValue}</span>
      </div>
      <Progress value={(value / maxValue) * 100} className={`h-2 ${color}`} />
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );

  const StateBadge: React.FC<{ isActive: boolean; label: string }> = ({ isActive, label }) => (
    <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500" : ""}>
      {isActive ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Brain className="h-10 w-10 text-purple-500" />
          <div>
            <h1 className="text-4xl font-bold">Consciousness Presence</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time neural state tracking for your metaverse avatar
            </p>
          </div>
        </div>
      </div>

      {/* Hero section with avatar preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="p-6">
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-6">Your Conscious Avatar</h3>
            <ConsciousAvatar 
              username={useNeuralState.toString()}
              neuralState={neuralState}
              size={150}
              showStatus={true}
              showAura={true}
            />
            <div className="mt-8 text-center">
              <p className="text-lg font-semibold">Current State</p>
              <p className="text-gray-600 dark:text-gray-400 capitalize mb-4">
                {dominantEmotion[0]} ({Math.round(dominantEmotion[1])}%)
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <StateBadge isActive={overallState.isCalm} label="Calm" />
                <StateBadge isActive={overallState.isFocused} label="Focused" />
                <StateBadge isActive={!overallState.isStressed} label="Not Stressed" />
                <StateBadge isActive={overallState.isEnergetic} label="Energetic" />
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button 
                onClick={isTracking ? stopTracking : startTracking}
                variant={isTracking ? "destructive" : "default"}
              >
                {isTracking ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isTracking ? 'Pause Tracking' : 'Start Tracking'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Real-time metrics */}
        <Card className="p-6 lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="emotions" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Emotions
              </TabsTrigger>
              <TabsTrigger value="focus" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Focus
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Real-time Neural Metrics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Physical State</h4>
                  <NeuralMetric
                    label="Heart Rate"
                    value={neuralState.physical.heart_rate}
                    maxValue={180}
                    icon={<Heart className="h-4 w-4 text-red-500" />}
                    color="bg-red-500"
                    description={`${Math.round(neuralState.physical.heart_rate)} BPM currently`}
                  />
                  <NeuralMetric
                    label="Energy Level"
                    value={neuralState.physical.energy_level}
                    icon={<Zap className="h-4 w-4 text-yellow-500" />}
                    color="bg-yellow-500"
                    description="Your current physical energy"
                  />
                  <NeuralMetric
                    label="Muscle Tension"
                    value={neuralState.physical.muscle_tension}
                    icon={<Activity className="h-4 w-4 text-orange-500" />}
                    color="bg-orange-500"
                    description="Lower is better for relaxation"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Cognitive State</h4>
                  <NeuralMetric
                    label="Overall Wellness"
                    value={overallState.overallWellness}
                    icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                    color="bg-green-500"
                    description="Combined wellness score"
                  />
                  <NeuralMetric
                    label="Attention"
                    value={neuralState.focus.attention}
                    icon={<Brain className="h-4 w-4 text-blue-500" />}
                    color="bg-blue-500"
                    description="Current focus level"
                  />
                  <NeuralMetric
                    label="Mindfulness"
                    value={neuralState.focus.mindfulness}
                    icon={<Activity className="h-4 w-4 text-teal-500" />}
                    color="bg-teal-500"
                    description="Present moment awareness"
                  />
                </div>
              </div>

              {/* Connection status */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {neuralState.connectionQuality === 'excellent' || neuralState.connectionQuality === 'good' ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">Neural Link Status</p>
                      <p className="text-sm text-gray-500">
                        Connection quality: {neuralState.connectionQuality} • Last updated: {neuralState.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Calibrate
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="emotions" className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Emotional State Tracking</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(neuralState.emotions).map(([key, value]) => (
                  <NeuralMetric
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={value}
                    icon={<Heart className="h-4 w-4 text-pink-500" />}
                    color="bg-pink-500"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="focus" className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Focus & Cognitive Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(neuralState.focus).map(([key, value]) => (
                  <NeuralMetric
                    key={key}
                    label={key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    value={value}
                    icon={<Brain className="h-4 w-4 text-purple-500" />}
                    color="bg-purple-500"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Privacy & Sharing Settings</h3>
              
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Control what neural data you share with others in virtual worlds and on your profile.
                  Your neural data is always end-to-end encrypted and only visible to those you choose.
                </p>

                <div className="space-y-4">
                  {[
                    { key: 'shareEmotions' as const, label: 'Share emotional state', description: 'Let others see your current emotional state' },
                    { key: 'shareFocus' as const, label: 'Share focus levels', description: 'Display your attention and engagement levels' },
                    { key: 'shareHeartRate' as const, label: 'Share heart rate', description: 'Show your real-time heart rate to connections' },
                    { key: 'showInVirtualWorlds' as const, label: 'Enable in virtual worlds', description: 'Show your neural avatar in all metaverse spaces' },
                    { key: 'showInProfile' as const, label: 'Show on public profile', description: 'Display your current state on your profile page' },
                    { key: 'shareWithFriendsOnly' as const, label: 'Friends-only sharing', description: 'Only share neural data with confirmed friends' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-gray-500">{description}</p>
                      </div>
                      <Switch
                        checked={privacySettings[key]}
                        onCheckedChange={() => togglePrivacySetting(key)}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Neural Privacy Guarantee</p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        Your neural data is never sold, shared with third parties, or used for advertising.
                        You maintain full ownership and control over all your biological and cognitive data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Features section */}
      <Card className="p-6">
        <h3 className="text-2xl font-semibold mb-6">What Consciousness Presence Enables</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
            <Users className="h-8 w-8 text-purple-500 mb-3" />
            <h4 className="font-semibold mb-2">Authentic Connections</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share your true emotional state with friends, creating deeper, more meaningful connections in virtual spaces.
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
            <Calendar className="h-8 w-8 text-blue-500 mb-3" />
            <h4 className="font-semibold mb-2">Better Collaboration</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Teams can understand when members are stressed, focused, or need support, leading to better collaboration outcomes.
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
            <Activity className="h-8 w-8 text-green-500 mb-3">
            </Activity>
            <h4 className="font-semibold mb-2">Mental Wellness</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your own cognitive and emotional states over time to improve your mental wellbeing and work-life balance.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NeuralDashboard;