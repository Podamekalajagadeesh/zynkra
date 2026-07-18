import { Vector3D } from './spatialAudio';

// Base sensory data interfaces
export interface SensoryData {
  timestamp: number;
  sourceId: string;
  position: Vector3D;
  intensity: number; // 0-1 scale
}

// Touch/Haptic feedback interfaces
export interface HapticFeedback extends SensoryData {
  type: 'pressure' | 'temperature' | 'texture' | 'vibration';
  value: number; // Specific value for the haptic type
  duration: number;
}

// Olfactory (smell) interfaces
export interface OlfactoryStimulus extends SensoryData {
  scentId: string; // Unique identifier for the scent profile
  concentration: number; // 0-1, affects diffusion radius
  decayRate: number; // How quickly the scent fades
}

// Gustatory (taste) interfaces
export interface GustatoryStimulus extends SensoryData {
  tasteProfile: {
    sweet: number;
    sour: number;
    salty: number;
    bitter: number;
    umami: number;
  };
  duration: number;
}

// Visual enhancement (beyond standard 3D)
export interface VisualEffect extends SensoryData {
  type: 'particle' | 'light' | 'shader' | 'postProcess';
  parameters: Record<string, number | string | boolean>;
}

// Full sensory environment configuration
export interface FullSensoryEnvironmentConfig {
  id: string;
  name: string;
  description: string;
  ambientScents: OlfactoryStimulus[];
  ambientHaptics: HapticFeedback[];
  ambientVisuals: VisualEffect[];
  spatialAudioConfig: {
    reverbDecay: number;
    echoDelay: number;
    roomSize: number;
  };
}

// Device connection status
export interface SensoryDeviceStatus {
  hapticSuit: { connected: boolean; batteryLevel: number; firmware: string };
  olfactoryInterface: { connected: boolean; availableScents: string[] };
  gustatoryInterface: { connected: boolean; availableFlavors: string[] };
  neuralInterface: { connected: boolean; latency: number; calibrationComplete: boolean };
}

// State listener type
type SensoryStateListener = (state: FullSensoryState) => void;

// Full sensory state for React components
export interface FullSensoryState {
  isActive: boolean;
  currentEnvironment: string | null;
  activeStimuli: {
    haptics: HapticFeedback[];
    scents: OlfactoryStimulus[];
    tastes: GustatoryStimulus[];
    visuals: VisualEffect[];
  };
  deviceStatus: SensoryDeviceStatus;
}

// Default device status
const DEFAULT_DEVICE_STATUS: SensoryDeviceStatus = {
  hapticSuit: { connected: false, batteryLevel: 0, firmware: '0.0.0' },
  olfactoryInterface: { connected: false, availableScents: [] },
  gustatoryInterface: { connected: false, availableFlavors: [] },
  neuralInterface: { connected: false, latency: 0, calibrationComplete: false },
};

export class FullSensoryMetaverseService {
  private isInitialized = false;
  private listeners: Set<SensoryStateListener> = new Set();
  private state: FullSensoryState = {
    isActive: false,
    currentEnvironment: null,
    activeStimuli: {
      haptics: [],
      scents: [],
      tastes: [],
      visuals: [],
    },
    deviceStatus: { ...DEFAULT_DEVICE_STATUS },
  };

  // Registry of all available sensory environments
  private environments: Map<string, FullSensoryEnvironmentConfig> = new Map();

  // WebSocket for real-time sensory data sync with other users
  private sensorySyncWebSocket: WebSocket | null = null;

  // Animation frame for continuous sensory processing
  private animationFrameId: number | null = null;

  // Initialize the full sensory metaverse service
  async initialize() {
    if (this.isInitialized) return;

    console.log('Initializing full-sensory metaverse integration...');
    
    // Register default environments
    this.registerDefaultEnvironments();
    
    // Attempt to connect to all sensory hardware
    await this.detectAndConnectSensoryDevices();
    
    // Setup WebSocket for multi-user sensory synchronization
    await this.setupSensorySync();
    
    // Start the sensory processing loop
    this.startSensoryProcessingLoop();
    
    this.isInitialized = true;
    this.updateState({ ...this.state, isActive: true });
    console.log('Full-sensory metaverse integration initialized successfully');
  }

  // Register built-in sensory environments
  private registerDefaultEnvironments() {
    // Beach environment
    this.environments.set('tropical-beach', {
      id: 'tropical-beach',
      name: 'Tropical Beach',
      description: 'A serene tropical beach with ocean waves, palm trees, and fresh sea breeze',
      ambientScents: [
        {
          timestamp: Date.now(),
          sourceId: 'ocean-breeze',
          position: { x: 0, y: 0, z: 0 },
          intensity: 0.7,
          scentId: 'sea-salt',
          concentration: 0.6,
          decayRate: 0.001,
        },
        {
          timestamp: Date.now(),
          sourceId: 'plumeria-flowers',
          position: { x: 10, y: 2, z: 5 },
          intensity: 0.5,
          scentId: 'tropical-flower',
          concentration: 0.4,
          decayRate: 0.002,
        },
      ],
      ambientHaptics: [
        {
          timestamp: Date.now(),
          sourceId: 'sand-underfoot',
          position: { x: 0, y: 0, z: 0 },
          intensity: 0.3,
          type: 'texture',
          value: 0.4, // Granular texture value
          duration: Infinity,
        },
        {
          timestamp: Date.now(),
          sourceId: 'breeze',
          position: { x: 0, y: 1.7, z: 0 },
          intensity: 0.2,
          type: 'vibration',
          value: 0.1,
          duration: Infinity,
        },
      ],
      ambientVisuals: [
        {
          timestamp: Date.now(),
          sourceId: 'sunlight',
          position: { x: 0, y: 50, z: -100 },
          intensity: 0.9,
          type: 'light',
          parameters: { color: '#FFE4B5', intensity: 1.0, castsShadows: true },
        },
        {
          timestamp: Date.now(),
          sourceId: 'sea-sparkle',
          position: { x: 0, y: 0, z: -50 },
          intensity: 0.3,
          type: 'particle',
          parameters: { particleCount: 1000, velocity: 0.5, lifespan: 5.0 },
        },
      ],
      spatialAudioConfig: {
        reverbDecay: 1.5,
        echoDelay: 0.05,
        roomSize: 500, // Large open space
      },
    });

    // Mountain cabin environment
    this.environments.set('mountain-cabin', {
      id: 'mountain-cabin',
      name: 'Mountain Cabin',
      description: 'A cozy mountain cabin with fireplace, wood smoke, and fresh mountain air',
      ambientScents: [
        {
          timestamp: Date.now(),
          sourceId: 'fireplace',
          position: { x: 5, y: 2, z: 0 },
          intensity: 0.8,
          scentId: 'woodsmoke',
          concentration: 0.7,
          decayRate: 0.0015,
        },
        {
          timestamp: Date.now(),
          sourceId: 'pine-trees',
          position: { x: -20, y: 10, z: -20 },
          intensity: 0.6,
          scentId: 'pine',
          concentration: 0.5,
          decayRate: 0.001,
        },
      ],
      ambientHaptics: [
        {
          timestamp: Date.now(),
          sourceId: 'wood-floor',
          position: { x: 0, y: 0, z: 0 },
          intensity: 0.4,
          type: 'texture',
          value: 0.6, // Wood grain texture
          duration: Infinity,
        },
        {
          timestamp: Date.now(),
          sourceId: 'fire-warmth',
          position: { x: 5, y: 1, z: 0 },
          intensity: 0.5,
          type: 'temperature',
          value: 0.8, // Warmth value
          duration: Infinity,
        },
      ],
      ambientVisuals: [
        {
          timestamp: Date.now(),
          sourceId: 'fireplace-glow',
          position: { x: 5, y: 1.5, z: 0 },
          intensity: 0.7,
          type: 'light',
          parameters: { color: '#FF4500', intensity: 0.8, flicker: true },
        },
        {
          timestamp: Date.now(),
          sourceId: 'fire-sparks',
          position: { x: 5, y: 2, z: 0 },
          intensity: 0.4,
          type: 'particle',
          parameters: { particleCount: 50, velocity: 2.0, lifespan: 1.5 },
        },
      ],
      spatialAudioConfig: {
        reverbDecay: 0.8,
        echoDelay: 0.1,
        roomSize: 50, // Enclosed indoor space
      },
    });

    console.log(`Registered ${this.environments.size} default sensory environments`);
  }

  // Detect and connect to all sensory hardware devices
  private async detectAndConnectSensoryDevices() {
    try {
      // In a real implementation, this would use WebUSB, WebBluetooth, or proprietary APIs
      // to connect to physical haptic suits, olfactory/gustatory hardware, and neural interfaces
      
      // Simulated device detection for demonstration
      const simulatedStatus: SensoryDeviceStatus = {
        hapticSuit: { connected: true, batteryLevel: 92, firmware: '2.4.1' },
        olfactoryInterface: { 
          connected: true, 
          availableScents: ['sea-salt', 'tropical-flower', 'woodsmoke', 'pine', 'coffee', 'fresh-bread'] 
        },
        gustatoryInterface: { 
          connected: true, 
          availableFlavors: ['sweet', 'sour', 'salty', 'bitter', 'umami', 'chocolate', 'citrus'] 
        },
        neuralInterface: { connected: true, latency: 12, calibrationComplete: true },
      };

      this.state.deviceStatus = simulatedStatus;
      console.log('Sensory devices connected:', simulatedStatus);
    } catch (error) {
      console.warn('Some sensory devices could not be connected:', error);
    }
  }

  // Setup WebSocket for real-time sensory synchronization across users
  private async setupSensorySync() {
    try {
      // In production, this would connect to a real WebSocket server
      this.sensorySyncWebSocket = new WebSocket('wss://sensory-metaverse.example.com/sync');
      
      this.sensorySyncWebSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleIncomingSensoryData(data);
      };

      console.log('Sensory synchronization WebSocket connected');
    } catch (error) {
      console.warn('Could not establish sensory sync WebSocket:', error);
    }
  }

  // Process incoming sensory data from other users in the shared environment
  private handleIncomingSensoryData(data: any) {
    switch (data.type) {
      case 'haptic':
        this.addHapticFeedback(data.stimulus);
        break;
      case 'olfactory':
        this.addOlfactoryStimulus(data.stimulus);
        break;
      case 'gustatory':
        this.addGustatoryStimulus(data.stimulus);
        break;
      case 'visual':
        this.addVisualEffect(data.effect);
        break;
    }
  }

  // Start the continuous sensory processing loop
  private startSensoryProcessingLoop() {
    const processFrame = () => {
      this.processExpiredStimuli();
      this.updateSpatialIntensities();
      this.broadcastActiveStimuli();
      
      this.animationFrameId = requestAnimationFrame(processFrame);
    };
    
    this.animationFrameId = requestAnimationFrame(processFrame);
  }

  // Remove stimuli that have expired
  private processExpiredStimuli() {
    const now = Date.now();
    
    // Clean up expired haptics
    this.state.activeStimuli.haptics = this.state.activeStimuli.haptics.filter(
      h => h.duration === Infinity || (h.timestamp + h.duration) > now
    );
    
    // Clean up expired scents (with decay)
    this.state.activeStimuli.scents = this.state.activeStimuli.scents.filter(scent => {
      const age = now - scent.timestamp;
      const remainingIntensity = scent.intensity * Math.exp(-scent.decayRate * age);
      return remainingIntensity > 0.01; // Remove when almost faded
    });
    
    // Similar cleanup for other stimulus types...
  }

  // Update stimulus intensities based on listener's current position
  private updateSpatialIntensities() {
    // In a real implementation, this would calculate distance from listener
    // and adjust stimulus intensity accordingly for true spatial sensing
  }

  // Broadcast local stimuli to other users in the shared environment
  private broadcastActiveStimuli() {
    if (this.sensorySyncWebSocket?.readyState === WebSocket.OPEN) {
      // Throttle broadcasts to avoid network congestion
      // Only send changes, not full state every frame
    }
  }

  // Public API: Load a specific sensory environment
  loadEnvironment(environmentId: string) {
    const environment = this.environments.get(environmentId);
    if (!environment) {
      throw new Error(`Sensory environment "${environmentId}" not found`);
    }

    // Clear all current stimuli
    this.state.activeStimuli = {
      haptics: [],
      scents: [],
      tastes: [],
      visuals: [],
    };

    // Add environment's ambient stimuli
    environment.ambientScents.forEach(scent => this.addOlfactoryStimulus(scent));
    environment.ambientHaptics.forEach(haptic => this.addHapticFeedback(haptic));
    environment.ambientVisuals.forEach(visual => this.addVisualEffect(visual));

    this.updateState({
      ...this.state,
      currentEnvironment: environmentId,
    });

    console.log(`Loaded sensory environment: ${environment.name}`);
  }

  // Public API: Add a haptic feedback stimulus
  addHapticFeedback(haptic: HapticFeedback) {
    this.state.activeStimuli.haptics.push(haptic);
    this.sendHapticToDevice(haptic);
    this.notifyListeners();
  }

  // Send haptic data to the physical haptic suit
  private sendHapticToDevice(haptic: HapticFeedback) {
    if (!this.state.deviceStatus.hapticSuit.connected) return;
    
    // In production, this would send the haptic parameters to the actual hardware
    console.log('Sending haptic to suit:', haptic);
  }

  // Public API: Add an olfactory (smell) stimulus
  addOlfactoryStimulus(scent: OlfactoryStimulus) {
    this.state.activeStimuli.scents.push(scent);
    this.sendScentToDevice(scent);
    this.notifyListeners();
  }

  // Send scent data to the olfactory interface
  private sendScentToDevice(scent: OlfactoryStimulus) {
    if (!this.state.deviceStatus.olfactoryInterface.connected) return;
    
    if (!this.state.deviceStatus.olfactoryInterface.availableScents.includes(scent.scentId)) {
      console.warn(`Scent "${scent.scentId}" not available on olfactory interface`);
      return;
    }
    
    console.log('Dispensing scent:', scent);
  }

  // Public API: Add a gustatory (taste) stimulus
  addGustatoryStimulus(taste: GustatoryStimulus) {
    this.state.activeStimuli.tastes.push(taste);
    this.sendTasteToDevice(taste);
    this.notifyListeners();
  }

  // Send taste data to the gustatory interface
  private sendTasteToDevice(taste: GustatoryStimulus) {
    if (!this.state.deviceStatus.gustatoryInterface.connected) return;
    
    console.log('Generating taste profile:', taste.tasteProfile);
  }

  // Public API: Add a visual effect
  addVisualEffect(effect: VisualEffect) {
    this.state.activeStimuli.visuals.push(effect);
    this.notifyListeners();
  }

  // Update state and notify listeners
  private updateState(newState: FullSensoryState) {
    this.state = newState;
    this.notifyListeners();
  }

  // Notify all state listeners of changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  // Subscribe to state changes
  subscribe(listener: SensoryStateListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Get current state
  getState(): FullSensoryState {
    return { ...this.state };
  }

  // Get all available environments
  getAvailableEnvironments(): FullSensoryEnvironmentConfig[] {
    return Array.from(this.environments.values());
  }

  // Update an existing environment's sensory parameters
  updateEnvironmentParameters(
    environmentId: string, 
    updates: {
      ambientTemperature?: number;
      scentModifications?: Array<{sourceId: string; newIntensity?: number; newConcentration?: number}>;
      hapticModifications?: Array<{sourceId: string; newValue?: number; newIntensity?: number}>;
      lightIntensity?: number;
    }
  ) {
    const environment = this.environments.get(environmentId);
    if (!environment) {
      throw new Error(`Sensory environment "${environmentId}" not found`);
    }

    // Create a deep copy to avoid mutating the original
    const updatedEnvironment = JSON.parse(JSON.stringify(environment)) as FullSensoryEnvironmentConfig;

    // Update temperature (modifies all temperature haptics)
    if (updates.ambientTemperature !== undefined) {
      updatedEnvironment.ambientHaptics = updatedEnvironment.ambientHaptics.map(haptic => {
        if (haptic.type === 'temperature') {
          return {
            ...haptic,
            value: Math.max(0, Math.min(1, updates.ambientTemperature! / 100)), // Normalize 0-100 to 0-1
            intensity: Math.max(0, Math.min(1, updates.ambientTemperature! / 100))
          };
        }
        return haptic;
      });
    }

    // Update scent parameters
    if (updates.scentModifications) {
      updates.scentModifications.forEach(mod => {
        const scentIndex = updatedEnvironment.ambientScents.findIndex(s => s.sourceId === mod.sourceId);
        if (scentIndex !== -1) {
          if (mod.newIntensity !== undefined) {
            updatedEnvironment.ambientScents[scentIndex].intensity = Math.max(0, Math.min(1, mod.newIntensity));
          }
          if (mod.newConcentration !== undefined) {
            updatedEnvironment.ambientScents[scentIndex].concentration = Math.max(0, Math.min(1, mod.newConcentration));
          }
        }
      });
    }

    // Update haptic parameters
    if (updates.hapticModifications) {
      updates.hapticModifications.forEach(mod => {
        const hapticIndex = updatedEnvironment.ambientHaptics.findIndex(h => h.sourceId === mod.sourceId);
        if (hapticIndex !== -1) {
          if (mod.newValue !== undefined) {
            updatedEnvironment.ambientHaptics[hapticIndex].value = Math.max(0, Math.min(1, mod.newValue));
          }
          if (mod.newIntensity !== undefined) {
            updatedEnvironment.ambientHaptics[hapticIndex].intensity = Math.max(0, Math.min(1, mod.newIntensity));
          }
        }
      });
    }

    // Update light intensity
    if (updates.lightIntensity !== undefined) {
      updatedEnvironment.ambientVisuals = updatedEnvironment.ambientVisuals.map(visual => {
        if (visual.type === 'light') {
          return {
            ...visual,
            intensity: Math.max(0, Math.min(1, updates.lightIntensity! / 100)),
            parameters: {
              ...visual.parameters,
              intensity: Math.max(0, Math.min(1, updates.lightIntensity! / 100))
            }
          };
        }
        return visual;
      });
    }

    // Save the updated environment
    this.environments.set(environmentId, updatedEnvironment);
    
    // If this is the currently loaded environment, refresh it to apply changes
    if (this.state.currentEnvironment === environmentId) {
      this.loadEnvironment(environmentId);
    }

    console.log(`Updated sensory parameters for environment: ${updatedEnvironment.name}`);
  }

  // Create a custom sensory environment
  createCustomEnvironment(config: FullSensoryEnvironmentConfig) {
    this.environments.set(config.id, config);
    console.log(`Created custom environment: ${config.name}`);
  }

  // Cleanup resources
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.sensorySyncWebSocket) {
      this.sensorySyncWebSocket.close();
    }
    this.listeners.clear();
    this.isInitialized = false;
    console.log('Full-sensory metaverse service destroyed');
  }
}

// Create and export a singleton instance
export const fullSensoryMetaverseService = new FullSensoryMetaverseService();