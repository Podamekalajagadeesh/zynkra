import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { 
  Volume2,
  VolumeX,
  Move3d,
  Settings,
  MapPin,
  Volume,
  Zap
} from 'lucide-react';
import { useSpatialAudio } from '../hooks/useSpatialAudio';
import { Vector3D } from '../services/spatialAudio';

interface SpatialAudioControlsProps {
  roomName: string;
  isHost: boolean;
}

const SpatialAudioControls: React.FC<SpatialAudioControlsProps> = ({ roomName, isHost }) => {
  const spatialAudio = useSpatialAudio();
  const [isEnabled, setIsEnabled] = useState(true);
  const [listenerPosition, setListenerPosition] = useState<Vector3D>({ x: 0, y: 1.7, z: 0 });
  const [participantCount, setParticipantCount] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [maxDistance, setMaxDistance] = useState(100);
  const [rolloffFactor, setRolloffFactor] = useState(1);

  // Update participant count
  useEffect(() => {
    const updateCount = () => {
      const positions = spatialAudio.getAllParticipantPositions();
      setParticipantCount(positions.size);
    };
    
    // Update initially and set interval
    updateCount();
    const interval = setInterval(updateCount, 1000);
    return () => clearInterval(interval);
  }, [spatialAudio]);

  // Toggle spatial audio on/off
  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    spatialAudio.setEnabled(newEnabled);
  };

  // Update listener position (move in virtual space)
  const handlePositionChange = (axis: keyof Vector3D, value: number[]) => {
    const newPosition = { ...listenerPosition, [axis]: value[0] };
    setListenerPosition(newPosition);
    spatialAudio.updateListenerPosition(newPosition);
  };

  // Reset to center position
  const handleResetPosition = () => {
    const centerPos = { x: 0, y: 1.7, z: 0 };
    setListenerPosition(centerPos);
    spatialAudio.updateListenerPosition(centerPos);
  };

  // Quick teleport to front row
  const handleTeleportFrontRow = () => {
    const frontPos = { x: 0, y: 1.7, z: -10 };
    setListenerPosition(frontPos);
    spatialAudio.animateParticipantToPosition('self', frontPos, 500); // Animate movement
  };

  // Update advanced audio settings
  const handleMaxDistanceChange = (value: number[]) => {
    setMaxDistance(value[0]);
  };

  const handleRolloffFactorChange = (value: number[]) => {
    setRolloffFactor(value[0]);
  };

  // Place all participants in a theatre-style seating arrangement
  const handleArrangeParticipantsTheatre = () => {
    if (!isHost) return;
    
    const positions = spatialAudio.getAllParticipantPositions();
    let index = 0;
    const seatsPerRow = 8;
    const rowDepth = 5;
    
    positions.forEach((_, participantId) => {
      const row = Math.floor(index / seatsPerRow);
      const seatInRow = index % seatsPerRow;
      const offset = (seatInRow - (seatsPerRow - 1) / 2) * 3; // Spread seats horizontally
      
      const newPosition: Vector3D = {
        x: offset,
        y: 1.7,
        z: -15 - (row * rowDepth) // Place rows behind each other
      };
      
      spatialAudio.animateParticipantToPosition(participantId, newPosition, 1000);
      index++;
    });
  };

  return (
    <Card className="p-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Move3d className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Spatial Audio</h3>
        </div>
        <Switch 
          checked={isEnabled} 
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-blue-500"
        />
      </div>

      {isEnabled && (
        <div className="space-y-4">
          <div className="text-sm text-gray-300">
            <p className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              {participantCount} participants with spatial audio
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Audio is spatialized in 3D space based on participant positions
            </p>
          </div>

          {/* Movement controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-300">Your Position</Label>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleResetPosition}
                className="text-xs"
              >
                Reset
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4">X</span>
                <Slider
                  value={[listenerPosition.x]}
                  min={-50}
                  max={50}
                  step={1}
                  onValueChange={(v) => handlePositionChange('x', v)}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400 w-8">{listenerPosition.x.toFixed(1)}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4">Z</span>
                <Slider
                  value={[listenerPosition.z]}
                  min={-50}
                  max={50}
                  step={1}
                  onValueChange={(v) => handlePositionChange('z', v)}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400 w-8">{listenerPosition.z.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleTeleportFrontRow}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Front Row
            </Button>
            
            {isHost && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleArrangeParticipantsTheatre}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Zap className="h-3 w-3 mr-1" />
                Arrange Seats
              </Button>
            )}
          </div>

          {/* Advanced settings toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full text-xs text-gray-400 hover:text-white"
          >
            <Settings className="h-3 w-3 mr-1" />
            {showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
          </Button>

          {/* Advanced settings */}
          {showAdvancedSettings && (
            <div className="space-y-3 pt-2 border-t border-gray-700">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">Max Distance</Label>
                  <span className="text-xs text-gray-400">{maxDistance}</span>
                </div>
                <Slider
                  value={[maxDistance]}
                  min={10}
                  max={200}
                  step={5}
                  onValueChange={handleMaxDistanceChange}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">Audio Falloff</Label>
                  <span className="text-xs text-gray-400">{rolloffFactor.toFixed(1)}</span>
                </div>
                <Slider
                  value={[rolloffFactor]}
                  min={0.1}
                  max={3}
                  step={0.1}
                  onValueChange={handleRolloffFactorChange}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!isEnabled && (
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <VolumeX className="h-4 w-4" />
          Spatial audio is disabled
        </div>
      )}
    </Card>
  );
};

export default SpatialAudioControls;