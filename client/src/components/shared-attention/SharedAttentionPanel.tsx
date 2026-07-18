import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar } from '../../Avatar';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { 
  Users, 
  Wifi, 
  WifiOff, 
  Play, 
  Pause, 
  Plus, 
  Copy, 
  Share2, 
  X,
  Brain,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useSharedAttention } from '../../hooks/useSharedAttention';
import { useUser } from '../../hooks/useUser';
import { useToast } from '../../hooks/useToast';

export const SharedAttentionPanel: React.FC = () => {
  const {
    currentSession,
    participants,
    syncQuality,
    isSynchronizing,
    sessionError,
    createSession,
    joinSession,
    leaveSession,
    sendPlaybackCommand,
    isInSession
  } = useSharedAttention();
  
  const { user } = useUser();
  const { addToast } = useToast();
  const [sessionCode, setSessionCode] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const handleCreateSession = async () => {
    await createSession({
      type: 'virtual-event',
      id: 'default-content',
      title: 'New Shared Experience',
      timestamp: Date.now()
    });
    setIsHost(true);
    addToast({
      title: 'Session created',
      description: 'Share the session code with friends to sync experiences together',
      type: 'success'
    });
  };

  const handleJoinSession = async () => {
    if (sessionCode.trim()) {
      await joinSession(sessionCode);
      setShowJoinDialog(false);
      setIsHost(false);
      addToast({
        title: 'Joined session',
        description: 'You are now synchronizing with the group',
        type: 'success'
      });
    }
  };

  const handleCopySessionCode = () => {
    if (currentSession) {
      navigator.clipboard.writeText(currentSession.id);
      addToast({
        title: 'Session code copied',
        description: 'Share this code with friends to invite them',
        type: 'success'
      });
    }
  };

  const handleLeaveSession = () => {
    leaveSession();
    setIsHost(false);
    addToast({
      title: 'Left session',
      description: 'You have left the shared attention session',
      type: 'info'
    });
  };

  const handlePlayPause = () => {
    if (!isHost) return;
    // Simple toggle - in real implementation this would sync with actual media player
    sendPlaybackCommand('play');
  };

  if (sessionError) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Error: {sessionError}</span>
        </div>
      </Card>
    );
  }

  if (!isInSession) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Shared Attention</h3>
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          Align your neural focus with friends to experience content simultaneously. Create a session or join an existing one.
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={handleCreateSession} 
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            disabled={isSynchronizing}
          >
            {isSynchronizing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Session
          </Button>
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="flex-1">
                <Users className="h-4 w-4 mr-2" />
                Join Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Shared Attention Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Enter session code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                />
                <Button 
                  onClick={handleJoinSession} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isSynchronizing}
                >
                  {isSynchronizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Join Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">Shared Attention Session</h3>
          {isSynchronizing ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Syncing
            </Badge>
          ) : syncQuality > 80 ? (
            <Badge className="bg-green-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Synced
            </Badge>
          ) : syncQuality > 50 ? (
            <Badge className="bg-yellow-500 flex items-center gap-1">
              <Wifi className="h-3 w-3" /> Poor sync
            </Badge>
          ) : (
            <Badge className="bg-red-500 flex items-center gap-1">
              <WifiOff className="h-3 w-3" /> Unsynced
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLeaveSession}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Sync Quality</span>
          <span className="font-medium">{Math.round(syncQuality)}%</span>
        </div>
        <Progress value={syncQuality} className="h-2" />
      </div>

      {currentSession?.currentContent && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{currentSession.currentContent.title}</p>
              <p className="text-xs text-gray-500 capitalize">{currentSession.currentContent.type}</p>
            </div>
            {isHost && (
              <Button size="sm" variant="secondary" onClick={handlePlayPause}>
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Participants ({participants.length})</p>
        <div className="grid grid-cols-2 gap-2">
          {participants.map((participant) => (
            <div key={participant.userId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Avatar src={participant.avatar} alt={participant.userName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{participant.userName}</p>
                <div className="flex items-center gap-1">
                  {participant.isInSync ? (
                    <span className="text-xs text-green-600">Synced</span>
                  ) : (
                    <span className="text-xs text-yellow-600">Syncing...</span>
                  )}
                  <span className="text-xs text-gray-400">• {participant.syncOffsetMs}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="pt-2 border-t">
          <Button variant="secondary" className="w-full" onClick={handleCopySessionCode}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Session Code
          </Button>
        </div>
      )}
    </Card>
  );
};