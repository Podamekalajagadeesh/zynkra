import { Room, RemoteParticipant, Track } from 'livekit-client';

// Position interface for 3D spatial positioning
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// Participant position tracking
interface ParticipantPosition {
  participantId: string;
  position: Vector3D;
  lastUpdate: number;
}

// Spatial audio configuration
export interface SpatialAudioConfig {
  enabled: boolean;
  listenerPosition: Vector3D;
  listenerOrientation: Vector3D;
  maxDistance: number;
  rolloffFactor: number;
  referenceDistance: number;
  coneInnerAngle: number;
  coneOuterAngle: number;
  coneOuterGain: number;
}

// Spatial audio state for React components
export interface SpatialAudioState {
  isEnabled: boolean;
  listenerPosition: Vector3D;
  enabledParticipants: string[];
}

// Listener type for state changes
type StateListener = (state: SpatialAudioState) => void;

// Default configuration
const DEFAULT_CONFIG: SpatialAudioConfig = {
  enabled: true,
  listenerPosition: { x: 0, y: 0, z: 0 },
  listenerOrientation: { x: 0, y: 0, z: -1 }, // Looking forward along negative Z axis
  maxDistance: 100,
  rolloffFactor: 1,
  referenceDistance: 1,
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0,
};

export class SpatialAudioService {
  private audioContext: AudioContext | null = null;
  private listener: AudioListener | null = null;
  private participantPanners: Map<string, PannerNode> = new Map();
  private participantSources: Map<string, MediaElementAudioSourceNode> = new Map();
  private participantPositions: Map<string, ParticipantPosition> = new Map();
  private config: SpatialAudioConfig = { ...DEFAULT_CONFIG };
  private room: Room | null = null;
  private isInitialized = false;
  private listeners: Set<StateListener> = new Set();

  // Initialize spatial audio service
  async initialize(room: Room, config?: Partial<SpatialAudioConfig>) {
    if (this.isInitialized) return;
    
    this.room = room;
    this.config = { ...this.config, ...config };
    
    // Create audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.listener = this.audioContext.listener;
    
    // Set initial listener position
    this.updateListenerPosition(this.config.listenerPosition);
    
    // Setup participant tracking
    this.setupParticipantTracking();
    
    this.isInitialized = true;
    console.log('Spatial audio service initialized');
  }

  // Setup WebRTC/LiveKit participant tracking
  private setupParticipantTracking() {
    if (!this.room) return;

    // Handle new participants connecting
    this.room.on('participantConnected', (participant: RemoteParticipant) => {
      this.handleNewParticipant(participant);
    });

    // Handle participants disconnecting
    this.room.on('participantDisconnected', (participant: RemoteParticipant) => {
      this.removeParticipant(participant.identity);
    });

    // Add existing participants
    Array.from(this.room.remoteParticipants.values()).forEach((participant) => {
      this.handleNewParticipant(participant);
    });
  }

  // Handle new remote participant joining
  private async handleNewParticipant(participant: RemoteParticipant) {
    if (!this.audioContext || !this.room) return;

    // Set initial random position in a circle around listener (virtual event space)
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 15; // 5-20 units away
    const position: Vector3D = {
      x: Math.cos(angle) * distance,
      y: 1.7, // Average human height
      z: Math.sin(angle) * distance,
    };

    this.participantPositions.set(participant.identity, {
      participantId: participant.identity,
      position,
      lastUpdate: Date.now(),
    });

    // Create audio panner for spatialization
    const panner = this.audioContext.createPanner();
    this.configurePanner(panner);
    
    // Set panner position based on participant's 3D position
    panner.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
    panner.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
    panner.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);
    
    panner.connect(this.audioContext.destination);
    this.participantPanners.set(participant.identity, panner);

    // Attach to participant's audio track
    Array.from(participant.trackPublications.values()).forEach(async (publication) => {
      if (publication.track && publication.kind === Track.Kind.Audio) {
        const mediaStream = await publication.track.attach();
        if (mediaStream instanceof HTMLMediaElement) {
          const source = this.audioContext!.createMediaElementSource(mediaStream);
          source.connect(panner);
          this.participantSources.set(participant.identity, source);
        }
      }
    });

    console.log(`Added spatial audio for participant: ${participant.identity} at position`, position);
  }

  // Configure panner node with spatial audio settings
  private configurePanner(panner: PannerNode) {
    panner.panningModel = 'HRTF'; // High-quality spatialization using Head-Related Transfer Function
    panner.distanceModel = 'inverse';
    panner.refDistance = this.config.referenceDistance;
    panner.maxDistance = this.config.maxDistance;
    panner.rolloffFactor = this.config.rolloffFactor;
    panner.coneInnerAngle = this.config.coneInnerAngle;
    panner.coneOuterAngle = this.config.coneOuterAngle;
    panner.coneOuterGain = this.config.coneOuterGain;
  }

  // Update listener orientation (where they're looking)
  updateListenerOrientation(forward: Vector3D, up: Vector3D) {
    if (!this.listener || !this.audioContext) return;
    
    this.listener.forwardX.setValueAtTime(forward.x, this.audioContext.currentTime);
    this.listener.forwardY.setValueAtTime(forward.y, this.audioContext.currentTime);
    this.listener.forwardZ.setValueAtTime(forward.z, this.audioContext.currentTime);
    
    this.listener.upX.setValueAtTime(up.x, this.audioContext.currentTime);
    this.listener.upY.setValueAtTime(up.y, this.audioContext.currentTime);
    this.listener.upZ.setValueAtTime(up.z, this.audioContext.currentTime);
  }

  // Update a participant's 3D position (for movement in virtual space)
  updateParticipantPosition(participantId: string, position: Vector3D) {
    const panner = this.participantPanners.get(participantId);
    if (!panner || !this.audioContext) return;

    // Smoothly interpolate position for natural movement
    const currentTime = this.audioContext.currentTime;
    panner.positionX.linearRampToValueAtTime(position.x, currentTime + 0.1);
    panner.positionY.linearRampToValueAtTime(position.y, currentTime + 0.1);
    panner.positionZ.linearRampToValueAtTime(position.z, currentTime + 0.1);

    // Update stored position
    const stored = this.participantPositions.get(participantId);
    if (stored) {
      stored.position = position;
      stored.lastUpdate = Date.now();
    }
  }

  // Move a participant to a new position with animation
  animateParticipantToPosition(participantId: string, targetPosition: Vector3D, duration: number = 1000) {
    const stored = this.participantPositions.get(participantId);
    const panner = this.participantPanners.get(participantId);
    if (!stored || !panner || !this.audioContext) return;

    const startPos = { ...stored.position };
    const startTime = this.audioContext.currentTime;
    const endTime = startTime + (duration / 1000);

    // Create smooth animation using AudioParam automation
    const animate = () => {
      const currentTime = this.audioContext!.currentTime;
      if (currentTime >= endTime) {
        panner.positionX.setValueAtTime(targetPosition.x, endTime);
        panner.positionY.setValueAtTime(targetPosition.y, endTime);
        panner.positionZ.setValueAtTime(targetPosition.z, endTime);
        stored.position = targetPosition;
        stored.lastUpdate = Date.now();
        return;
      }

      const progress = (currentTime - startTime) / (endTime - startTime);
      const eased = this.easeInOutCubic(progress);
      
      panner.positionX.setValueAtTime(
        startPos.x + (targetPosition.x - startPos.x) * eased,
        currentTime
      );
      panner.positionY.setValueAtTime(
        startPos.y + (targetPosition.y - startPos.y) * eased,
        currentTime
      );
      panner.positionZ.setValueAtTime(
        startPos.z + (targetPosition.z - startPos.z) * eased,
        currentTime
      );

      requestAnimationFrame(animate);
    };

    animate();
  }

  // Easing function for smooth animations
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Calculate distance between listener and participant for volume calculation
  getParticipantDistance(participantId: string): number | null {
    const participant = this.participantPositions.get(participantId);
    if (!participant) return null;

    const dx = participant.position.x - this.config.listenerPosition.x;
    const dy = participant.position.y - this.config.listenerPosition.y;
    const dz = participant.position.z - this.config.listenerPosition.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Enable/disable spatial audio
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;

    if (!enabled) {
      // Bypass spatialization by connecting sources directly to destination
      this.participantSources.forEach((source) => {
        source.disconnect();
        source.connect(this.audioContext!.destination);
      });
    } else {
      // Reconnect through panners for spatialization
      this.participantSources.forEach((source, participantId) => {
        const panner = this.participantPanners.get(participantId);
        if (panner) {
          source.disconnect();
          source.connect(panner);
        }
      });
    }

    this.notifyListeners();
  }

  // Remove a participant from spatial tracking
  private removeParticipant(participantId: string) {
    const panner = this.participantPanners.get(participantId);
    const source = this.participantSources.get(participantId);
    
    if (panner) {
      panner.disconnect();
      this.participantPanners.delete(participantId);
    }
    
    if (source) {
      source.disconnect();
      this.participantSources.delete(participantId);
    }
    
    this.participantPositions.delete(participantId);
    console.log(`Removed spatial audio for participant: ${participantId}`);
  }

  // Cleanup and dispose resources
  dispose() {
    this.participantPanners.forEach(panner => panner.disconnect());
    this.participantSources.forEach(source => source.disconnect());
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.participantPanners.clear();
    this.participantSources.clear();
    this.participantPositions.clear();
    this.room = null;
    this.isInitialized = false;
    
    console.log('Spatial audio service disposed');
  }

  // Get all participants with their positions
  getAllParticipantPositions(): Map<string, Vector3D> {
    const positions = new Map<string, Vector3D>();
    this.participantPositions.forEach((value, key) => {
      positions.set(key, { ...value.position });
    });
    return positions;
  }

  // Get current configuration
  getConfig(): SpatialAudioConfig {
    return { ...this.config };
  }

  // Get current state for React components
  getState(): SpatialAudioState {
    return {
      isEnabled: this.config.enabled,
      listenerPosition: { ...this.config.listenerPosition },
      enabledParticipants: Array.from(this.participantPanners.keys()),
    };
  }

  // Subscribe to state changes
  subscribe(listener: StateListener) {
    this.listeners.add(listener);
    // Send initial state
    listener(this.getState());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  // Update listener position and notify subscribers
  setParticipantPosition(participantId: string, position: Vector3D) {
    this.updateParticipantPosition(participantId, position);
    this.notifyListeners();
  }

  // Update listener position and notify subscribers
  updateListenerPosition(position: Vector3D) {
    if (!this.listener || !this.audioContext) return;

    this.config.listenerPosition = position;

    // Update Web Audio API listener position
    this.listener.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
    this.listener.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
    this.listener.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);

    this.notifyListeners();
  }

  // Arrange all participants in a circle around the listener
  arrangeParticipantsInCircle(radius: number = 10) {
    const participants = Array.from(this.participantPositions.keys());
    const angleStep = (Math.PI * 2) / participants.length;
    
    participants.forEach((participantId, index) => {
      const angle = index * angleStep;
      const position: Vector3D = {
        x: Math.cos(angle) * radius,
        y: 1.7,
        z: Math.sin(angle) * radius
      };
      this.animateParticipantToPosition(participantId, position, 1000);
    });
  }

  // Arrange participants in a theater layout facing a stage (at negative Z)
  arrangeParticipantsInTheater(seatsPerRow: number = 8, rowSpacing: number = 5, startZ: number = -15) {
    const participants = Array.from(this.participantPositions.keys());
    
    participants.forEach((participantId, index) => {
      const row = Math.floor(index / seatsPerRow);
      const seatInRow = index % seatsPerRow;
      const offset = (seatInRow - (seatsPerRow - 1) / 2) * 3; // Spread seats horizontally
      
      const newPosition: Vector3D = {
        x: offset,
        y: 1.7,
        z: startZ - (row * rowSpacing) // Place rows behind each other
      };
      
      this.animateParticipantToPosition(participantId, newPosition, 1000);
    });
  }

}

export const spatialAudioService = new SpatialAudioService();