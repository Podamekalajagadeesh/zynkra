import React, { useState, useEffect, useCallback } from 'react';
import { Bot, User, Settings, X, MessageCircle, Share2, Calendar, Users, Heart, Save, RefreshCw, Shield, Brain, Activity, Globe, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar } from '../Avatar';
import { useToast } from '../../hooks/useToast';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Types for Digital Twin Persona
interface LegacyConsent {
  id: string;
  familyMemberName: string;
  familyMemberEmail: string;
  familyMemberRelation: string;
  consentGivenAt?: Date;
  consentStatus: 'pending' | 'approved' | 'rejected';
  verified: boolean;
}

interface LegacySettings {
  enabled: boolean;
  autoContinueAfterDeath: boolean;
  limitedInteraction: boolean;
  whoCanInteract: 'everyone' | 'only_followers' | 'only_family' | 'verified_contacts';
  legacyMessage: string;
  memorialized: boolean;
  deathDate?: Date;
  familyConsents: LegacyConsent[];
  contentRetentionPeriod: number; // months
}

interface DigitalTwinProfile {
  id: string;
  name: string;
  avatar: string;
  personalityTraits: string[];
  coreValues: string[];
  communicationStyle: string;
  creationDate: Date;
  lastUpdated: Date;
  accuracyScore: number; // 0-100 - how well it mirrors the user
  activityStats: {
    postsRepresented: number;
    conversationsHandled: number;
    connectionsMade: number;
    uptimeHours: number;
    legacyInteractions: number;
  };
  capabilities: {
    autoRespond: boolean;
    autoPost: boolean;
    attendVirtualEvents: boolean;
    networkConnections: boolean;
    representInMeetings: boolean;
    contentCreation: boolean;
    legacyPreservation: boolean;
  };
  legacySettings: LegacySettings;
  preferences: {
    activeHoursStart: string;
    activeHoursEnd: string;
    maxDailyInteractions: number;
    approvalRequired: boolean;
    privacyLevel: 'conservative' | 'balanced' | 'liberal';
    contentTone: 'professional' | 'casual' | 'inspirational' | 'authentic';
  };
  neuralPatternsLearned: number;
  interactionHistory: TwinInteraction[];
  scheduledActivities: ScheduledActivity[];
}

interface TwinInteraction {
  id: string;
  type: 'post' | 'comment' | 'message' | 'event';
  content: string;
  timestamp: Date;
  recipient?: string;
  approved: boolean;
  userFeedback?: 'positive' | 'negative' | 'neutral';
}

interface ScheduledActivity {
  id: string;
  type: 'event' | 'meeting' | 'networking' | 'social';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

interface ValueAlignmentConfig {
  category: string;
  values: string[];
  selected: string[];
}

// Simple form component for adding family consent
const AddFamilyConsentForm: React.FC<{ onAdd: (member: { name: string; email: string; relation: string }) => void }> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && relation) {
      onAdd({ name, email, relation });
      setName('');
      setEmail('');
      setRelation('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-background">
      <h5 className="font-medium">Add Family Member</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input 
          placeholder="Full name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input 
          type="email" 
          placeholder="Email address" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Select value={relation} onValueChange={setRelation} required>
          <SelectTrigger>
            <SelectValue placeholder="Relationship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spouse">Spouse</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="sibling">Sibling</SelectItem>
            <SelectItem value="legal_rep">Legal Representative</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full md:w-auto">Send Consent Request</Button>
    </form>
  );
};

const defaultValuesConfig: ValueAlignmentConfig[] = [
  {
    category: 'Communication',
    values: ['Honest', 'Respectful', 'Direct', 'Empathetic', 'Diplomatic'],
    selected: ['Honest', 'Respectful', 'Empathetic']
  },
  {
    category: 'Social',
    values: ['Inclusive', 'Collaborative', 'Independent', 'Extroverted', 'Introverted'],
    selected: ['Inclusive', 'Collaborative']
  },
  {
    category: 'Content',
    values: ['Creative', 'Analytical', 'Educational', 'Entertaining', 'Professional'],
    selected: ['Creative', 'Analytical']
  }
];

const defaultDigitalTwin: DigitalTwinProfile = {
  id: 'default-twin-1',
  name: 'Your Digital Twin',
  avatar: '',
  personalityTraits: ['Authentic', 'Thoughtful', 'Engaging'],
  coreValues: ['Honesty', 'Respect', 'Creativity'],
  communicationStyle: 'Natural, conversational tone that mirrors your unique voice',
  creationDate: new Date(),
  lastUpdated: new Date(),
  accuracyScore: 72,
  activityStats: {
    postsRepresented: 15,
    conversationsHandled: 32,
    connectionsMade: 8,
    uptimeHours: 124,
    legacyInteractions: 0
  },
  capabilities: {
    autoRespond: true,
    autoPost: false,
    attendVirtualEvents: true,
    networkConnections: true,
    representInMeetings: true,
    contentCreation: true,
    legacyPreservation: false
  },
  legacySettings: {
    enabled: false,
    autoContinueAfterDeath: false,
    limitedInteraction: true,
    whoCanInteract: 'only_followers',
    legacyMessage: 'This digital legacy continues to honor the memory of its creator.',
    memorialized: false,
    familyConsents: [],
    contentRetentionPeriod: 120 // 10 years
  },
  preferences: {
    activeHoursStart: '09:00',
    activeHoursEnd: '17:00',
    maxDailyInteractions: 50,
    approvalRequired: true,
    privacyLevel: 'balanced',
    contentTone: 'casual'
  },
  neuralPatternsLearned: 156,
  interactionHistory: [
    {
      id: 'int-1',
      type: 'comment',
      content: 'Great post! I really enjoyed your perspective on AI ethics.',
      timestamp: new Date(Date.now() - 3600000),
      recipient: 'Sarah Chen',
      approved: true,
      userFeedback: 'positive'
    },
    {
      id: 'int-2',
      type: 'message',
      content: 'Thanks for reaching out! I\'d be happy to connect and discuss potential collaboration.',
      timestamp: new Date(Date.now() - 7200000),
      recipient: 'Alex Rivera',
      approved: true,
      userFeedback: 'neutral'
    },
    {
      id: 'int-3',
      type: 'event',
      content: 'Attended the Web3 Developer Summit networking session',
      timestamp: new Date(Date.now() - 86400000),
      approved: true
    }
  ],
  scheduledActivities: [
    {
      id: 'act-1',
      type: 'meeting',
      title: 'Team Sync',
      description: 'Represent you in the weekly team synchronization meeting',
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 90000000),
      location: 'Virtual Office - Main Conference Room',
      status: 'scheduled'
    },
    {
      id: 'act-2',
      type: 'networking',
      title: 'AI Futures Conference',
      description: 'Attend networking sessions and connect with industry professionals',
      startTime: new Date(Date.now() + 172800000),
      endTime: new Date(Date.now() + 259200000),
      location: 'Metaverse Convention Center',
      status: 'scheduled'
    }
  ]
};

export const DigitalTwinPersona: React.FC = () => {
  const [twin, setTwin] = useState<DigitalTwinProfile>(defaultDigitalTwin);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();
  const [valuesConfig, setValuesConfig] = useState<ValueAlignmentConfig[]>(defaultValuesConfig);

  // Calculate twin's current status
  const isCurrentlyActive = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime >= twin.preferences.activeHoursStart && currentTime <= twin.preferences.activeHoursEnd;
  };

  // Update twin capabilities
  // Update legacy settings
  const updateLegacySetting = <K extends keyof DigitalTwinProfile['legacySettings']>(
    key: K, 
    value: DigitalTwinProfile['legacySettings'][K]
  ) => {
    setTwin(prev => ({
      ...prev,
      legacySettings: {
        ...prev.legacySettings,
        [key]: value
      },
      lastUpdated: new Date()
    }));
  };

  // Add family member consent
  const addFamilyConsent = (familyMember: { name: string; email: string; relation: string }) => {
    const newConsent: LegacyConsent = {
      id: `consent-${Date.now()}`,
      familyMemberName: familyMember.name,
      familyMemberEmail: familyMember.email,
      familyMemberRelation: familyMember.relation,
      consentStatus: 'pending',
      verified: false
    };
    
    setTwin(prev => ({
      ...prev,
      legacySettings: {
        ...prev.legacySettings,
        familyConsents: [...prev.legacySettings.familyConsents, newConsent]
      },
      lastUpdated: new Date()
    }));
    
    toast({
      title: 'Family Member Added',
      description: 'Consent request has been sent to the family member.'
    });
  };

  // Verify family consent (simulated)
  const verifyFamilyConsent = (consentId: string) => {
    setTwin(prev => ({
      ...prev,
      legacySettings: {
        ...prev.legacySettings,
        familyConsents: prev.legacySettings.familyConsents.map(c => 
          c.id === consentId ? { 
            ...c, 
            consentStatus: 'approved' as const,
            consentGivenAt: new Date(),
            verified: true 
          } : c
        )
      },
      lastUpdated: new Date()
    }));
    
    toast({
      title: 'Consent Verified',
      description: 'Family member has approved the legacy preservation.'
    });
  };

  // Memorialize the profile (activate legacy mode)
  const memorializeProfile = () => {
    const hasAllConsents = twin.legacySettings.familyConsents.length > 0 && 
      twin.legacySettings.familyConsents.every(c => c.consentStatus === 'approved');
    
    if (!hasAllConsents) {
      toast({
        title: 'Cannot Memorialize',
        description: 'All family members must provide consent first.',
        variant: 'destructive'
      });
      return;
    }
    
    setTwin(prev => ({
      ...prev,
      legacySettings: {
        ...prev.legacySettings,
        memorialized: true,
        deathDate: new Date()
      },
      capabilities: {
        ...prev.capabilities,
        legacyPreservation: true
      },
      lastUpdated: new Date()
    }));
    
    toast({
      title: 'Legacy Activated',
      description: 'Your digital twin will now maintain your legacy indefinitely.'
    });
  };

  const updateCapability = (capability: keyof DigitalTwinProfile['capabilities'], value: boolean) => {
    setTwin(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [capability]: value
      },
      lastUpdated: new Date()
    }));
  };

  // Update twin preferences
  const updatePreference = <K extends keyof DigitalTwinProfile['preferences']>(
    key: K, 
    value: DigitalTwinProfile['preferences'][K]
  ) => {
    setTwin(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      },
      lastUpdated: new Date()
    }));
  };

  // Train the twin (simulate learning)
  const trainTwin = () => {
    setTwin(prev => ({
      ...prev,
      accuracyScore: Math.min(100, prev.accuracyScore + 5),
      neuralPatternsLearned: prev.neuralPatternsLearned + 10,
      lastUpdated: new Date()
    }));
    toast({
      title: 'Digital Twin Trained',
      description: 'Your twin has learned from additional interactions. Accuracy improved!'
    });
  };

  // Approve a pending interaction
  const approveInteraction = (id: string) => {
    setTwin(prev => ({
      ...prev,
      interactionHistory: prev.interactionHistory.map(int => 
        int.id === id ? { ...int, approved: true } : int
      ),
      lastUpdated: new Date()
    }));
    toast({
      title: 'Interaction Approved',
      description: 'Your digital twin\'s interaction has been approved.'
    });
  };

  // Toggle value selection
  const toggleValue = (categoryIndex: number, value: string) => {
    setValuesConfig(prev => {
      const newConfig = [...prev];
      const category = { ...newConfig[categoryIndex] };
      if (category.selected.includes(value)) {
        category.selected = category.selected.filter(v => v !== value);
      } else {
        category.selected = [...category.selected, value];
      }
      newConfig[categoryIndex] = category;
      
      // Update twin's core values
      const allSelected = newConfig.flatMap(c => c.selected);
      setTwin(prevTwin => ({
        ...prevTwin,
        coreValues: allSelected,
        lastUpdated: new Date()
      }));
      
      return newConfig;
    });
  };

  const activeStatus = isCurrentlyActive();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar 
              src={twin.avatar} 
              name={twin.name}
              size={80}
              className={activeStatus ? 'ring-4 ring-green-500 ring-opacity-50' : ''}
            />
            {activeStatus && (
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{twin.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={activeStatus ? 'default' : 'secondary'}>
                {activeStatus ? 'Active Now' : 'Currently Offline'}
              </Badge>
              <Badge variant="outline">Accuracy: {twin.accuracyScore}%</Badge>
            </div>
            <p className="text-muted-foreground mt-2">{twin.communicationStyle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={trainTwin} variant="secondary">
            <RefreshCw className="mr-2 h-4 w-4" />
            Train Twin
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configure Your Digital Twin</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="capabilities">
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  <TabsTrigger value="values">Value Alignment</TabsTrigger>
                  <TabsTrigger value="legacy">Legacy Preservation</TabsTrigger>
                  <TabsTrigger value="training">Training</TabsTrigger>
                </TabsList>
                
                <TabsContent value="capabilities" className="space-y-4 py-4">
                  <h3 className="text-lg font-semibold">Enable/Disable Twin Capabilities</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.keys(twin.capabilities) as Array<keyof typeof twin.capabilities>).map((key) => (
                      <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-sm text-muted-foreground">Allow your twin to {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
                        </div>
                        <Switch 
                          checked={twin.capabilities[key]}
                          onCheckedChange={(checked) => updateCapability(key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="preferences" className="space-y-4 py-4">
                  <h3 className="text-lg font-semibold">Twin Behavior Preferences</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Active Hours Start</label>
                        <Input 
                          type="time" 
                          value={twin.preferences.activeHoursStart}
                          onChange={(e) => updatePreference('activeHoursStart', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Active Hours End</label>
                        <Input 
                          type="time" 
                          value={twin.preferences.activeHoursEnd}
                          onChange={(e) => updatePreference('activeHoursEnd', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Max Daily Interactions: {twin.preferences.maxDailyInteractions}</label>
                        <Slider 
                          value={[twin.preferences.maxDailyInteractions]}
                          min={10}
                          max={200}
                          step={10}
                          onValueChange={([value]) => updatePreference('maxDailyInteractions', value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Require Approval</p>
                          <p className="text-sm text-muted-foreground">Twin must get your approval before acting</p>
                        </div>
                        <Switch 
                          checked={twin.preferences.approvalRequired}
                          onCheckedChange={(checked) => updatePreference('approvalRequired', checked)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Privacy Level</label>
                        <Select 
                          value={twin.preferences.privacyLevel}
                          onValueChange={(value: any) => updatePreference('privacyLevel', value)}
                        >
                          <SelectItem value="conservative">Conservative - Minimal sharing</SelectItem>
                          <SelectItem value="balanced">Balanced - Standard privacy</SelectItem>
                          <SelectItem value="liberal">Liberal - Extensive engagement</SelectItem>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Content Tone</label>
                        <Select 
                          value={twin.preferences.contentTone}
                          onValueChange={(value: any) => updatePreference('contentTone', value)}
                        >
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="inspirational">Inspirational</SelectItem>
                          <SelectItem value="authentic">Authentic</SelectItem>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="values" className="space-y-4 py-4">
                  <h3 className="text-lg font-semibold">Value Alignment Configuration</h3>
                  <p className="text-muted-foreground">Select the values that define you - your twin will align its behavior with these.</p>
                  {valuesConfig.map((category, idx) => (
                    <div key={category.category} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{category.category} Values</h4>
                      <div className="flex flex-wrap gap-2">
                        {category.values.map(value => (
                          <Badge 
                            key={value}
                            variant={category.selected.includes(value) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleValue(idx, value)}
                          >
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="legacy" className="space-y-6 py-4">
                  <div className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-r-lg">
                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">AI Legacy Preservation</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Set up your digital twin to maintain your legacy after your physical death. Requires family consent to activate.</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Legacy Main Toggle */}
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">Enable Legacy Preservation</h4>
                          <p className="text-sm text-muted-foreground">Allow your digital twin to continue operating after your passing</p>
                        </div>
                        <Switch 
                          checked={twin.legacySettings.enabled}
                          onCheckedChange={(checked) => updateLegacySetting('enabled', checked)}
                        />
                      </div>
                    </Card>

                    {twin.legacySettings.enabled && (
                      <>
                        {/* Legacy Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Auto-continue after death</p>
                                <p className="text-sm text-muted-foreground">Automatically activate legacy mode when account is inactive</p>
                              </div>
                              <Switch 
                                checked={twin.legacySettings.autoContinueAfterDeath}
                                onCheckedChange={(checked) => updateLegacySetting('autoContinueAfterDeath', checked)}
                              />
                            </div>
                          </Card>
                          
                          <Card className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Limited interactions only</p>
                                <p className="text-sm text-muted-foreground">Restrict twin to only respond to direct questions</p>
                              </div>
                              <Switch 
                                checked={twin.legacySettings.limitedInteraction}
                                onCheckedChange={(checked) => updateLegacySetting('limitedInteraction', checked)}
                              />
                            </div>
                          </Card>
                        </div>

                        {/* Interaction Permissions */}
                        <Card className="p-4">
                          <div className="mb-4">
                            <label className="text-sm font-medium">Who can interact with your legacy twin?</label>
                            <Select 
                              value={twin.legacySettings.whoCanInteract}
                              onValueChange={(value: any) => updateLegacySetting('whoCanInteract', value)}
                            >
                              <SelectItem value="everyone">Everyone - Public access</SelectItem>
                              <SelectItem value="only_followers">Only Followers - Verified connections</SelectItem>
                              <SelectItem value="only_family">Only Family - Approved family members</SelectItem>
                              <SelectItem value="verified_contacts">Verified Contacts - Trusted people only</SelectItem>
                            </Select>
                          </div>
                        </Card>

                        {/* Legacy Message */}
                        <Card className="p-4">
                          <label className="text-sm font-medium">Legacy Message (displayed on your memorial profile)</label>
                          <Textarea 
                            value={twin.legacySettings.legacyMessage}
                            onChange={(e) => updateLegacySetting('legacyMessage', e.target.value)}
                            className="mt-2 min-h-[100px]"
                            placeholder="Write a message that will be visible to everyone who visits your memorial profile..."
                          />
                        </Card>

                        {/* Content Retention */}
                        <Card className="p-4">
                          <div className="mb-4">
                            <label className="text-sm font-medium">Content retention period: {twin.legacySettings.contentRetentionPeriod} months ({Math.round(twin.legacySettings.contentRetentionPeriod/12)} years)</label>
                            <Slider 
                              value={[twin.legacySettings.contentRetentionPeriod]}
                              min={12}
                              max={240}
                              step={12}
                              onValueChange={([value]) => updateLegacySetting('contentRetentionPeriod', value)}
                              className="mt-4"
                            />
                          </div>
                        </Card>

                        {/* Family Consent Management */}
                        <Card className="p-6">
                          <h4 className="font-semibold mb-4">Family Member Consent Requirements</h4>
                          <p className="text-sm text-muted-foreground mb-4">Add family members who must approve legacy activation. All listed members must provide consent before memorialization.</p>
                          
                          {/* List existing consents */}
                          {twin.legacySettings.familyConsents.length > 0 && (
                            <div className="space-y-3 mb-6">
                              {twin.legacySettings.familyConsents.map(consent => (
                                <div key={consent.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                  <div>
                                    <p className="font-medium">{consent.familyMemberName} ({consent.familyMemberRelation})</p>
                                    <p className="text-sm text-muted-foreground">{consent.familyMemberEmail}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={consent.consentStatus === 'approved' ? 'default' : consent.consentStatus === 'pending' ? 'secondary' : 'destructive'}>
                                      {consent.consentStatus}
                                    </Badge>
                                    {consent.consentStatus === 'pending' && (
                                      <Button size="sm" onClick={() => verifyFamilyConsent(consent.id)}>
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Verify
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Add new family member form - simplified */}
                          <AddFamilyConsentForm onAdd={addFamilyConsent} />
                        </Card>

                        {/* Memorialization Status */}
                        <Card className={`p-6 ${twin.legacySettings.memorialized ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : 'bg-gray-50 dark:bg-gray-900/50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {twin.legacySettings.memorialized ? 'Legacy Active' : 'Activate Memorial Mode'}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {twin.legacySettings.memorialized 
                                  ? `Your digital twin has been maintaining your legacy since ${twin.legacySettings.deathDate?.toLocaleDateString()}`
                                  : 'Once all family members have approved, you can activate memorial mode to test your legacy twin.'
                                }
                              </p>
                              {twin.legacySettings.memorialized && (
                                <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                                  Legacy interactions so far: {twin.activityStats.legacyInteractions}
                                </p>
                              )}
                            </div>
                            {!twin.legacySettings.memorialized && (
                              <Button onClick={memorializeProfile} disabled={!twin.legacySettings.familyConsents.some(c => c.consentStatus === 'approved')}>
                                <Shield className="mr-2 h-4 w-4" />
                                Activate Legacy
                              </Button>
                            )}
                          </div>
                        </Card>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="training" className="space-y-4 py-4">
                  <h3 className="text-lg font-semibold">Twin Training Status</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Personality Accuracy</span>
                        <span>{twin.accuracyScore}%</span>
                      </div>
                      <Progress value={twin.accuracyScore} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <Brain className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-2xl font-bold">{twin.neuralPatternsLearned}</p>
                            <p className="text-sm text-muted-foreground">Neural Patterns Learned</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <Activity className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-2xl font-bold">{twin.activityStats.uptimeHours}h</p>
                            <p className="text-sm text-muted-foreground">Total Active Time</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                    <Button onClick={trainTwin} className="w-full">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Run Additional Training Cycle
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{twin.activityStats.conversationsHandled}</p>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{twin.activityStats.postsRepresented}</p>
                  <p className="text-sm text-muted-foreground">Posts Represented</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{twin.activityStats.connectionsMade}</p>
                  <p className="text-sm text-muted-foreground">New Connections</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{twin.activityStats.uptimeHours}h</p>
                  <p className="text-sm text-muted-foreground">Active Hours</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Core Values & Personality</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Core Values</p>
                  <div className="flex flex-wrap gap-2">
                    {twin.coreValues.map(value => (
                      <Badge key={value} variant="secondary">{value}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Personality Traits</p>
                  <div className="flex flex-wrap gap-2">
                    {twin.personalityTraits.map(trait => (
                      <Badge key={trait}>{trait}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Active Capabilities</h3>
              <div className="space-y-3">
                {(Object.entries(twin.capabilities) as [keyof typeof twin.capabilities, boolean][]).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {enabled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Upcoming Activities */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Upcoming Scheduled Activities</h3>
            <div className="space-y-4">
              {twin.scheduledActivities.slice(0, 3).map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Globe className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(activity.startTime).toLocaleDateString()}</p>
                    <Badge variant="outline">{activity.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Recent Interactions</h3>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {twin.interactionHistory.map(interaction => (
                  <div key={interaction.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge>{interaction.type}</Badge>
                        {interaction.recipient && (
                          <span className="text-sm text-muted-foreground">To: {interaction.recipient}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(interaction.timestamp).toLocaleString()}
                        </span>
                        {!interaction.approved && twin.preferences.approvalRequired && (
                          <Button size="sm" onClick={() => approveInteraction(interaction.id)}>
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm">{interaction.content}</p>
                    {interaction.userFeedback && (
                      <div className="mt-2">
                        <Badge variant={interaction.userFeedback === 'positive' ? 'default' : 'secondary'}>
                          Your feedback: {interaction.userFeedback}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Scheduled Activities</h3>
            <div className="space-y-4">
              {twin.scheduledActivities.map(activity => (
                <div key={activity.id} className="p-6 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>{activity.type}</Badge>
                        <Badge variant="outline">{activity.status}</Badge>
                      </div>
                      <h4 className="text-lg font-semibold">{activity.title}</h4>
                      <p className="text-muted-foreground">{activity.description}</p>
                      <p className="text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {activity.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{new Date(activity.startTime).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.startTime).toLocaleTimeString()} - {new Date(activity.endTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Accuracy Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Twin Accuracy Score</span>
                    <span>{twin.accuracyScore}%</span>
                  </div>
                  <Progress value={twin.accuracyScore} className="h-4" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your digital twin's accuracy improves as it learns from your interactions and feedback. 
                  Continue to provide feedback on its interactions to help it better represent you.
                </p>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Activity Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{twin.activityStats.conversationsHandled}</p>
                  <p className="text-sm text-muted-foreground">Total Conversations</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{twin.activityStats.postsRepresented}</p>
                  <p className="text-sm text-muted-foreground">Posts Represented</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{twin.activityStats.connectionsMade}</p>
                  <p className="text-sm text-muted-foreground">New Connections</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{twin.neuralPatternsLearned}</p>
                  <p className="text-sm text-muted-foreground">Patterns Learned</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DigitalTwinPersona;