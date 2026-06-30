import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FitnessSegment } from '../../lib/types';

interface LogAttemptModalProps {
  segment: FitnessSegment;
  onSubmit: (duration: number) => void;
  onClose: () => void;
}

export default function LogAttemptModal({ segment, onSubmit, onClose }: LogAttemptModalProps) {
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [seconds, setSeconds] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSeconds = 
      (parseInt(hours) || 0) * 3600 + 
      (parseInt(minutes) || 0) * 60 + 
      (parseInt(seconds) || 0);
    
    if (totalSeconds > 0) {
      onSubmit(totalSeconds);
    }
  };

  const calculatePace = () => {
    const totalSeconds = 
      (parseInt(hours) || 0) * 3600 + 
      (parseInt(minutes) || 0) * 60 + 
      (parseInt(seconds) || 0);
    
    if (totalSeconds > 0 && segment.distance > 0) {
      const hoursDecimal = totalSeconds / 3600;
      return (segment.distance / hoursDecimal).toFixed(2);
    }
    return '0.00';
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log your attempt</DialogTitle>
          <p className="text-gray-600 dark:text-gray-400">{segment.name}</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seconds">Seconds</Label>
              <Input
                id="seconds"
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
              />
            </div>
          </div>
          
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Calculated pace:</span>
              <span className="font-medium">{calculatePace()} km/h</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Submit Attempt</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}