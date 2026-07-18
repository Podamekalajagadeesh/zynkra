import { Message } from '../../lib/types';
import { PostAuthor } from '../../lib/types';

export interface ModMailConversation {
  id: string;
  groupId: string;
  title: string;
  recipientId: string;
  recipient: PostAuthor;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage?: Message;
  participants: string[]; // List of moderator/admin user IDs who can access this conversation
}

export interface ModMailMessage extends Message {
  conversationId: string;
  senderId: string;
  sender: PostAuthor;
  isInternal: boolean; // Whether this message is only visible to other moderators (internal note)
}

export interface CreateModMailConversationInput {
  subject: string;
  recipientId: string;
  initialMessage: string;
}