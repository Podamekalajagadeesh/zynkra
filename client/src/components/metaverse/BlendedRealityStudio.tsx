import React, { useState, useEffect } from 'react';
import { useBlendedReality } from '../../hooks/useBlendedReality';
import { useFullSensoryMetaverse } from '../../hooks/useFullSensoryMetaverse';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Scan, 
  Cube, 
  Users, 
  Settings, 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  Share2,
  Monitor,
  Atom,
  UserPlus,
  Copy,
  X,
  Edit3,
  MessageSquare,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { BlendedDigitalObject, CollaborativeBlendedSession } from '../../services/blendedReality';

// Predefined digital objects that can be placed in the physical world
const PREDEFINED_OBJECTS: Omit<BlendedDigitalObject, 'id' | 'ownerId' | 'createdAt' | 'lastModified'>[] = [
  {
    name: 'Virtual Couch',
    position: { x: 0, y: 0, z: 2 },
    dimensions: { x: 2, y: 0.8, z: 0.9 },
    physics: {
      mass: 50,
      gravity: true,
      collidable: true,
      canBePickedUp: true,
      canBeMoved: true
    },
    visualProperties: {
      color: '#8B4513',
      transparency: 0.9,
      castShadows: true,
      receiveShadows: true,
      emissionIntensity: 0.1,
      meshUrl: '/objects/virtual-couch.glb',
      animations: []
    },
    interactionRules: {
      canInteractWithPhysical: true,
      canPassThroughWalls: false,
      affectsPhysicalEnvironment: false,
      interactionDistance: 3,
      allowedUsers: []
    },
    isPersistent: true
  },
  {
    name: 'Holographic TV',
    position: { x: 0, y: 1.5, z: 3 },
    dimensions: { x: 1.8, y: 1.0, z: 0.1 },
    physics: {
      mass: 20,
      gravity: false,
      collidable: true,
      canBePickedUp: true,
      canBeMoved: true
    },
    visualProperties: {
      color: '#1a1a1a',
      transparency: 0.85,
      castShadows: true,
      receiveShadows: true,
      emissionIntensity: 0.8,
      meshUrl: '/objects/holographic-tv.glb',
      animations: [{ name: 'powerOn', duration: 2, loop: false, speed: 1 }]
    },
    interactionRules: {
      canInteractWithPhysical: true,
      canPassThroughWalls: false,
      affectsPhysicalEnvironment: false,
      interactionDistance: 5,
      allowedUsers: []
    },
    isPersistent: true
  },
  {
    name: 'Molecular Sculpture',
    position: { x: 2, y: 2, z: 2 },
    dimensions: { x: 1, y: 1, z: 1 },
    physics: {
      mass: 5,
      gravity: false,
      collidable: true,
      canBePickedUp: true,
      canBeMoved: true
    },
    visualProperties: {
      color: '#00ffff',
      transparency: 0.7,
      castShadows: false,
      receiveShadows: false,
      emissionIntensity: 1.0,
      meshUrl: '/objects/molecular-sculpture.glb',
      animations: [{ name: 'rotate', duration: 10, loop: true, speed: 1 }]
    },
    interactionRules: {
      canInteractWithPhysical: true,
      canPassThroughWalls: false,
      affectsPhysicalEnvironment: true, // This object can modify physical environment at atomic level
      interactionDistance: 2,
      allowedUsers: []
    },
    isPersistent: true
  }
];

// Mock available users for collaboration
const AVAILABLE_USERS = [
  { id: 'user1', name: 'Alice Johnson', avatar: '/avatars/alice.jpg', isOnline: true },
  { id: 'user2', name: 'Bob Smith', avatar: '/avatars/bob.jpg', isOnline: true },
  { id: 'user3', name: 'Carol Williams', avatar: '/avatars/carol.jpg', isOnline: false },
  { id: 'user4', name: 'David Brown', avatar: '/avatars/david.jpg', isOnline: true },
  { id: 'user5', name: 'Eva Martinez', avatar: '/avatars/eva.jpg', isOnline: true },
];

// Shared object modification history
interface ObjectModification {
  objectId: string;
  objectName: string;
  userId: string;
  userName: string;
  modification: string;
  timestamp: number;
}

const BlendedRealityStudio: React.FC = () => {
  const { 
    state: blendedState, 
    isInitialized,
    startScan,
    stopScan,
    placeDigitalObject,
    removeDigitalObject,
    createSession,
    getActiveDigitalObjects,
    getActiveSessions,
    updateDigitalObject,
    inviteUserToSession,
    removeUserFromSession
  } = useBlendedReality();

  const { state: metaverseState } = useFullSensoryMetaverse();
  
  const [sessionName, setSessionName] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [modificationHistory, setModificationHistory] = useState<ObjectModification[]>([]);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const activeObjects = getActiveDigitalObjects();
  const activeSessions = getActiveSessions();
  const selectedSession = selectedSessionId ? activeSessions.get(selectedSessionId) : null;
  
  // Track modifications to shared objects
  useEffect(() => {
    if (selectedSession) {
      // Check for any object updates and add to history
      const newHistory = [...modificationHistory];
      activeObjects.forEach((obj) => {
        const existingEntry = newHistory.find(entry => entry.objectId === obj.id);
        if (!existingEntry || obj.lastModified > existingEntry.timestamp) {
          newHistory.push({
            objectId: obj.id,
            objectName: obj.name,
            userId: obj.ownerId,
            userName: obj.ownerId === 'current-user' ? 'You' : 'Another User',
            modification: 'Updated object position/properties',
            timestamp: obj.lastModified
          });
        }
      });
      // Keep only last 50 modifications
      if (newHistory.length > 50) newHistory.splice(0, newHistory.length - 50);
      setModificationHistory(newHistory);
    }
  }, [activeObjects, selectedSession]);

  const handleCreateSession = () => {
    if (sessionName.trim()) {
      const newSessionId = createSession(sessionName);
      if (newSessionId) {
        setSelectedSessionId(newSessionId);
      }
      setSessionName('');
    }
  };

  const handleInviteUser = (userId: string, userName: string) => {
    if (selectedSessionId) {
      // In a real implementation, this would send an invitation and sync across users
      console.log(`Inviting ${userName} to session ${selectedSessionId}`);
      // Here we would call the service method to add the user to the session
      setShowInvitePanel(false);
      setInviteEmail('');
    }
  };

  const handleCopySessionLink = () => {
    if (selectedSessionId) {
      const sessionLink = `${window.location.origin}/blended-reality/session/${selectedSessionId}`;
      navigator.clipboard.writeText(sessionLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRemoveUser = (userId: string) => {
    if (selectedSessionId) {
      console.log(`Removing user ${userId} from session ${selectedSessionId}`);
      // Implementation would remove user from collaborative session
    }
  };

  const handlePlaceObject = (template: typeof PREDEFINED_OBJECTS[0]) => {
    const newObject: BlendedDigitalObject = {
      ...template,
      id: `object-${Date.now()}`,
      ownerId: 'current-user',
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    placeDigitalObject(newObject);
    
    // Add to modification history if in a shared session
    if (selectedSessionId) {
      setModificationHistory(prev => [...prev, {
        objectId: newObject.id,
        objectName: newObject.name,
        userId: 'current-user',
        userName: 'You',
        modification: 'Placed new object in shared space',
        timestamp: Date.now()
      }]);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Atom className="h-16 w-16 mx-auto mb-4 text-indigo-600 animate-pulse" />
          <h3 className="text-xl font-semibold mb-2">Initializing Blended Reality...</h3>
          <p className="text-gray-500">Preparing atomic-level interaction capabilities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Monitor className="h-8 w-8 text-indigo-600" />
          Physical-Digital Blended Reality Studio
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Seamlessly merge physical and digital worlds. Place virtual objects that interact with your physical environment at atomic levels.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scan className="h-5 w-5 text-blue-600" />
              Environment Scanning
            </CardTitle>
            <CardDescription>LiDAR and depth camera mapping</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${blendedState.isScanning ? 'text-green-600' : 'text-gray-500'}`}>
                {blendedState.isScanning ? 'Scanning Active' : 'Scanning Inactive'}
              </span>
              {blendedState.isScanning ? (
                <Button size="sm" variant="destructive" onClick={stopScan}>
                  <Square className="h-4 w-4 mr-2" /> Stop
                </Button>
              ) : (
                <Button size="sm" onClick={startScan}>
                  <Play className="h-4 w-4 mr-2" /> Start Scan
                </Button>
              )}
            </div>
            {blendedState.currentPhysicalScan && (
              <div className="mt-3 text-xs text-gray-500">
                Room: {blendedState.currentPhysicalScan.roomDimensions.x}x{blendedState.currentPhysicalScan.roomDimensions.y}x{blendedState.currentPhysicalScan.roomDimensions.z}m
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cube className="h-5 w-5 text-purple-600" />
              Active Digital Objects
            </CardTitle>
            <CardDescription>Virtual objects in your space</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeObjects.size}</div>
            <p className="text-xs text-gray-500 mt-1">
              Atomic interaction enabled for all objects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Collaborative Sessions
            </CardTitle>
            <CardDescription>Shared blended reality experiences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blendedState.activeCollaborativeSessions.size}</div>
            <p className="text-xs text-gray-500 mt-1">
              Spatial anchor sync enabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atomic Capabilities Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Atom className="h-6 w-6 text-indigo-600" />
            Atomic-Level Interaction Capabilities
          </CardTitle>
          <CardDescription>Your device supports these advanced interaction features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <div className="text-green-600 font-semibold">Particle Simulation</div>
              <div className="text-xs text-gray-500 mt-1">Enabled</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <div className="text-green-600 font-semibold">Quantum Entanglement</div>
              <div className="text-xs text-gray-500 mt-1">Supported</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <div className="text-green-600 font-semibold">Molecular Manipulation</div>
              <div className="text-xs text-gray-500 mt-1">Allowed</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <div className="text-green-600 font-semibold">Spatial Resolution</div>
              <div className="text-xs text-gray-500 mt-1">0.1nm (atomic scale)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Place Digital Objects */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Place Digital Objects
          </CardTitle>
          <CardDescription>Add virtual objects to your physical environment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PREDEFINED_OBJECTS.map((obj, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">{obj.name}</h4>
                <p className="text-xs text-gray-500 mb-3">
                  {obj.interactionRules.affectsPhysicalEnvironment 
                    ? '★ Can interact with physical environment at atomic level' 
                    : 'Standard digital object'}
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handlePlaceObject(obj)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Place in Environment
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Objects List */}
      {activeObjects.size > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Active Digital Objects</CardTitle>
            <CardDescription>Objects currently placed in your blended reality space</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(activeObjects.entries()).map(([id, obj]) => (
                <div key={id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium">{obj.name}</div>
                    <div className="text-xs text-gray-500">
                      Position: ({obj.position.x.toFixed(1)}, {obj.position.y.toFixed(1)}, {obj.position.z.toFixed(1)})
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => removeDigitalObject(id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Collaborative Session */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Share2 className="h-6 w-6 text-indigo-600" />
            Create Collaborative Session
          </CardTitle>
          <CardDescription>Share your blended reality space with friends for co-creation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input 
              placeholder="Session name..." 
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="max-w-md"
            />
            <Button onClick={handleCreateSession}>
              <Users className="h-4 w-4 mr-2" /> Create Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Collaborative Session Management */}
      {activeSessions.size > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-6 w-6 text-green-600" />
              Active Shared Reality Sessions
            </CardTitle>
            <CardDescription>Manage your collaborative blended reality sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={Array.from(activeSessions.keys())[0]} onValueChange={setSelectedSessionId}>
              <TabsList className="mb-6">
                {Array.from(activeSessions.entries()).map(([id, session]) => (
                  <TabsTrigger key={id} value={id}>
                    {session.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {Array.from(activeSessions.entries()).map(([sessionId, session]) => (
                <TabsContent key={sessionId} value={sessionId}>
                  {/* Session Controls */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-semibold text-lg">{session.name}</h4>
                      <p className="text-sm text-gray-500">Created {new Date(session.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={handleCopySessionLink}
                      >
                        {copiedLink ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copiedLink ? 'Copied!' : 'Copy Link'}
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setShowInvitePanel(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" /> Invite Users
                      </Button>
                    </div>
                  </div>

                  {/* Participants List */}
                  <div className="mb-6">
                    <h5 className="font-medium mb-3">Current Participants ({session.participants.length})</h5>
                    <div className="space-y-2">
                      {session.participants.map((participantId) => {
                        const user = AVAILABLE_USERS.find(u => u.id === participantId) || {
                          name: participantId === 'current-user-id' ? 'You' : 'Unknown User',
                          avatar: '',
                          isOnline: true
                        };
                        return (
                          <div key={participantId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <Badge variant={user.isOnline ? 'default' : 'secondary'} className="mt-1">
                                  {user.isOnline ? 'Active' : 'Offline'}
                                </Badge>
                              </div>
                            </div>
                            {participantId !== 'current-user-id' && session.hostId === 'current-user-id' && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRemoveUser(participantId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Invite User Panel */}
                  {showInvitePanel && (
                    <div className="mb-6 p-4 border rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                      <h5 className="font-medium mb-3">Invite Users to Session</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {AVAILABLE_USERS.filter(u => !session.participants.includes(u.id)).map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{user.name}</div>
                                <Badge variant={user.isOnline ? 'default' : 'secondary'} className="mt-1">
                                  {user.isOnline ? 'Online' : 'Offline'}
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              disabled={!user.isOnline}
                              onClick={() => handleInviteUser(user.id, user.name)}
                            >
                              Invite
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => setShowInvitePanel(false)}>
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Real-time Modification History */}
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Real-time Activity Feed
                    </h5>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {modificationHistory.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No activity yet. Place an object to start co-creating!</p>
                      ) : (
                        modificationHistory.slice().reverse().map((entry, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <Edit3 className="h-4 w-4 mt-0.5 text-indigo-600" />
                            <div>
                              <p className="text-sm">
                                <span className="font-medium">{entry.userName}</span> {entry.modification}: <span className="text-gray-600">{entry.objectName}</span>
                              </p>
                              <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BlendedRealityStudio;