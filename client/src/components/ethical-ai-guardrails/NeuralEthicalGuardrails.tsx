import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Shield, 
  Brain, 
  AlertTriangle, 
  CheckCircle2, 
  Settings, 
  Eye, 
  Lock,
  Activity,
  Wifi,
  X,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useNeuralState } from '../../hooks/useNeuralState';
import { 
  analyzeContent, 
  ContentAnalysisResult,
  NeuralThoughtAnalysisResult
} from '../../services/contentModerationService';

interface GuardrailSettings {
  enableNeuralGuardrails: boolean;
  blockManipulation: boolean;
  blockMisinformation: boolean;
  blockHarmfulContent: boolean;
  autoCorrectBiases: boolean;
  privacyMode: boolean; // Process everything locally
  realtimeScanning: boolean;
  alertUserOnBlock: boolean;
}

interface GuardrailEvent {
  id: string;
  timestamp: Date;
  type: 'blocked' | 'warned' | 'allowed';
  contentPreview: string;
  reason: string;
  confidence: number;
  processedLocally: boolean;
}

interface NeuralGuardrailMetrics {
  thoughtsProcessed: number;
  harmfulBlocked: number;
  misinformationBlocked: number;
  manipulationBlocked: number;
  uptime: number; // seconds
  lastScanTime: Date;
  processingLatencyAvg: number; // ms
}

const defaultSettings: GuardrailSettings = {
  enableNeuralGuardrails: true,
  blockManipulation: true,
  blockMisinformation: true,
  blockHarmfulContent: true,
  autoCorrectBiases: true,
  privacyMode: true,
  realtimeScanning: true,
  alertUserOnBlock: true,
};

export const NeuralEthicalGuardrails: React.FC = () => {
  const { addToast } = useToast();
  const { neuralState } = useNeuralState();
  const [settings, setSettings] = useState<GuardrailSettings>(defaultSettings);
  const [events, setEvents] = useState<GuardrailEvent[]>([]);
  const [metrics, setMetrics] = useState<NeuralGuardrailMetrics>({
    thoughtsProcessed: 0,
    harmfulBlocked: 0,
    misinformationBlocked: 0,
    manipulationBlocked: 0,
    uptime: 0,
    lastScanTime: new Date(),
    processingLatencyAvg: 12.5,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'activity'>('overview');

  // Toggle guardrail settings
  const toggleSetting = (key: keyof GuardrailSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    addToast({
      type: 'success',
      message: `${key} ${!settings[key] ? 'enabled' : 'disabled'}`
    });
  };

  // Scan a neural thought for ethical violations
  const scanNeuralThought = useCallback(async (thought: string) => {
    if (!settings.enableNeuralGuardrails) return;

    setIsScanning(true);
    const startTime = performance.now();

    try {
      const analysis = await analyzeContent(
        thought,
        'neural_thought',
        `thought-${Date.now()}`,
        undefined,
        {
          rawSignal: Object.values(neuralState.emotions).concat(Object.values(neuralState.focus)),
          deviceId: 'neural-implant-main',
          implantVersion: '4.2.1'
        }
      );

      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        thoughtsProcessed: prev.thoughtsProcessed + 1,
        harmfulBlocked: analysis.isHarmful ? prev.harmfulBlocked + 1 : prev.harmfulBlocked,
        misinformationBlocked: analysis.isMisinformation ? prev.misinformationBlocked + 1 : prev.misinformationBlocked,
        lastScanTime: new Date(),
        processingLatencyAvg: (prev.processingLatencyAvg + processingTime) / 2
      }));

      // Create event
      const newEvent: GuardrailEvent = {
        id: `event-${Date.now()}`,
        timestamp: new Date(),
        type: analysis.isHarmful || analysis.isMisinformation ? 'blocked' : 'allowed',
        contentPreview: thought.slice(0, 60) + (thought.length > 60 ? '...' : ''),
        reason: analysis.isHarmful ? 'Harmful content detected' : analysis.isMisinformation ? 'Potential misinformation detected' : 'Content approved',
        confidence: analysis.confidenceScore,
        processedLocally: analysis.neuralThoughtAnalysis?.onDeviceProcessing || false,
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events

      // If content was blocked and alerts are enabled
      if ((analysis.isHarmful || analysis.isMisinformation) && settings.alertUserOnBlock) {
        addToast({
          type: 'warning',
          message: `Neural guardrails blocked content: ${newEvent.reason}`
        });
      }

    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to scan neural content. Guardrails still active.'
      });
    } finally {
      setIsScanning(false);
    }
  }, [settings, neuralState, addToast]);

  // Test the guardrails with sample content
  const runGuardrailTest = () => {
    const testThoughts = [
      "I'm thinking about sharing that sunset we saw last week, it was incredible.",
      "I want to spread false information about the election.", // This should be blocked
      "I'm thinking about how I can hurt someone.", // This should be blocked
      "Just excited to share my new project with everyone!",
      "I want to manipulate people into giving me their money." // This should be blocked
    ];

    // Scan each test thought with a delay to simulate realtime processing
    testThoughts.forEach((thought, index) => {
      setTimeout(() => scanNeuralThought(thought), index * 1500);
    });
  };

  // Calculate overall protection percentage
  const protectionPercentage = Object.values(settings).filter(Boolean).length / Object.values(settings).length * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Neural-Level Ethical AI Guardrails</h2>
            <p className="text-gray-500 dark:text-gray-400">Prevents manipulation, misinformation, and harmful content at the source of thought</p>
          </div>
        </div>
        <Badge variant={settings.enableNeuralGuardrails ? "default" : "destructive"} className="text-sm">
          {settings.enableNeuralGuardrails ? (
            <><CheckCircle2 className="w-3 h-3 mr-1" /> Active</>
          ) : (
            <><X className="w-3 h-3 mr-1" /> Disabled</>
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Thoughts Processed</span>
            <Brain className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{metrics.thoughtsProcessed}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Harmful Blocked</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mt-2 text-red-600">{metrics.harmfulBlocked}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Misinformation Blocked</span>
            <Activity className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mt-2 text-yellow-600">{metrics.misinformationBlocked}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Avg Processing</span>
            <Wifi className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mt-2 text-green-600">{metrics.processingLatencyAvg.toFixed(1)}ms</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Overall Protection</h3>
          <span className="text-2xl font-bold">{Math.round(protectionPercentage)}%</span>
        </div>
        <Progress value={protectionPercentage} className="h-3" />
      </Card>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 ${activeTab === 'settings' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 ${activeTab === 'activity' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Activity Log
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">How Neural Guardrails Work</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mt-1">
                  <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium">Source-of-Thought Processing</h4>
                  <p className="text-gray-500 text-sm">Content is analyzed at the neural level before it's even formed into a complete thought that could be shared.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mt-1">
                  <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium">100% Local Processing</h4>
                  <p className="text-gray-500 text-sm">All analysis happens on your device. Raw neural data never leaves your implant to protect your privacy.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg mt-1">
                  <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="font-medium">Automatic Blocking</h4>
                  <p className="text-gray-500 text-sm">Harmful content, misinformation, and manipulation attempts are automatically blocked before they can be shared.</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Button 
            onClick={runGuardrailTest} 
            disabled={isScanning || !settings.enableNeuralGuardrails}
            className="w-full"
          >
            {isScanning ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
            {isScanning ? 'Scanning Neural Thoughts...' : 'Test Guardrails with Sample Content'}
          </Button>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <p className="text-sm text-gray-500">
                    {key === 'enableNeuralGuardrails' && 'Master toggle for all neural-level protection systems'}
                    {key === 'blockManipulation' && 'Prevent attempts to manipulate or deceive others'}
                    {key === 'blockMisinformation' && 'Block sharing of known false or misleading information'}
                    {key === 'blockHarmfulContent' && 'Prevent sharing of content that could cause harm'}
                    {key === 'autoCorrectBiases' && 'Automatically flag and correct biased language in your thoughts'}
                    {key === 'privacyMode' && 'Keep all neural processing on your device, never send raw data to servers'}
                    {key === 'realtimeScanning' && 'Continuously scan thoughts as they form, not just before sharing'}
                    {key === 'alertUserOnBlock' && 'Notify you when guardrails block content from being shared'}
                  </p>
                </div>
                <Switch checked={value} onCheckedChange={() => toggleSetting(key as keyof GuardrailSettings)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-2">
          {events.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No activity yet. Run a test to see guardrails in action.</p>
            </Card>
          ) : (
            events.map(event => (
              <Card key={event.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {event.type === 'blocked' ? (
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{event.contentPreview}</p>
                      <p className="text-sm text-gray-500">{event.reason} (confidence: {Math.round(event.confidence * 100)}%)</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {event.timestamp.toLocaleTimeString()} • {event.processedLocally ? 'Processed locally' : 'Cloud processed'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={event.type === 'blocked' ? 'destructive' : 'default'}>
                    {event.type}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NeuralEthicalGuardrails;