import React, { useState } from 'react';
import { X, Users, UserPlus, Copy, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';

interface Collaborator {
  userId: string;
  displayName: string;
  lastActive: Date;
  isCurrentUser?: boolean;
}

interface CollaborationPanelProps {
  collaborators: Collaborator[];
  currentUserId: string;
  isOwner: boolean;
  onInviteCollaborator: (email: string) => void;
  onRemoveCollaborator: (userId: string) => void;
  postId: string;
}

export function CollaborationPanel({
  collaborators,
  currentUserId,
  isOwner,
  onInviteCollaborator,
  onRemoveCollaborator,
  postId
}: CollaborationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyEditLink = () => {
    const editLink = `${window.location.origin}/edit/${postId}`;
    navigator.clipboard.writeText(editLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Link copied',
      description: 'Edit link copied to clipboard'
    });
  };

  const handleInvite = () => {
    if (inviteEmail) {
      onInviteCollaborator(inviteEmail);
      setInviteEmail('');
      toast({
        title: 'Invitation sent',
        description: `Collaboration invitation sent to ${inviteEmail}`
      });
    }
  };

  const handleRemove = (userId: string) => {
    onRemoveCollaborator(userId);
    toast({
      title: 'Collaborator removed',
      description: 'The user has been removed from this collaboration'
    });
  };

  const activeCollaborators = collaborators.filter(c => c.userId !== currentUserId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Users size={24} />
          {collaborators.length > 1 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {collaborators.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collaborators</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Share link section */}
          <div className="flex items-center space-x-2">
            <Input 
              value={`${window.location.origin}/edit/${postId}`} 
              readOnly 
              className="flex-1 text-sm"
            />
            <Button size="icon" onClick={copyEditLink}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </Button>
          </div>

          {/* Invite new collaborator */}
          {isOwner && (
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter email to invite"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button size="icon" onClick={handleInvite}>
                <UserPlus size={18} />
              </Button>
            </div>
          )}

          {/* Current collaborators list */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Currently editing ({collaborators.length})</h4>
            {collaborators.map((collaborator) => (
              <div key={collaborator.userId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                      {collaborator.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {collaborator.displayName}
                      {collaborator.userId === currentUserId && ' (You)'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(collaborator.lastActive).toLocaleTimeString()} - Active
                    </p>
                  </div>
                </div>
                {isOwner && collaborator.userId !== currentUserId && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemove(collaborator.userId)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}