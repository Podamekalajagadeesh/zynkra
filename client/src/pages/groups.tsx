import { useState, useEffect } from 'react';
import { GroupList } from '../components/groups/GroupList';
import { GroupLockdownPanel } from '../components/groups/GroupLockdownPanel';
import { ChannelList } from '../components/groups/ChannelList';
import { MessageList } from '../components/dms/MessageList';
import { SendMessageForm } from '../components/dms/SendMessageForm';
import { PageShell } from '../components/PageShell';
import GroupMembers from '../components/groups/GroupMembers';
import { CreateGroupForm } from '../components/groups/CreateGroupForm';
import { ModMailConversationList } from '../components/groups/ModMailConversationList';
import { ModMailComposer } from '../components/groups/ModMailComposer';
import { ModMailInternalNoteForm } from '../components/groups/ModMailInternalNoteForm';
import { getGroupMembers } from '../lib/api';
import { Conversation } from '../components/dms/ConversationList';
import { Message } from '../lib/types';

export const GroupsPage = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [selectedChannelId, setSelectedChannelId] = useState<
    string | undefined
  >();
  const [selectedChannelType, setSelectedChannelType] = useState<
    'group' | 'broadcast' | undefined
  >();
  const [selectedModMailConversation, setSelectedModMailConversation] = useState<Conversation | null>(null);
  const [isUserModerator, setIsUserModerator] = useState(false);
  const [modMailRefreshKey, setModMailRefreshKey] = useState(0);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const handleSelectGroup = (id: string) => {
    setSelectedGroupId(id);
    setSelectedChannelId(undefined);
    setSelectedChannelType(undefined);
    setSelectedModMailConversation(null);
  };

  // Check if current user is a moderator or admin for the selected group
  useEffect(() => {
    if (selectedGroupId) {
      getGroupMembers(selectedGroupId).then(members => {
        const currentUserId = localStorage.getItem('currentUserId');
        const currentMember = members.find((m: any) => m.user.id === currentUserId);
        if (currentMember && (currentMember.role === 'admin' || currentMember.role === 'moderator')) {
          setIsUserModerator(true);
        } else {
          setIsUserModerator(false);
        }
      });
    }
  }, [selectedGroupId]);

  const handleModMailConversationCreated = () => {
    setModMailRefreshKey(prev => prev + 1);
  };

  const handleSelectModMailConversation = (conversation: Conversation) => {
    setSelectedModMailConversation(conversation);
    setSelectedChannelId(undefined);
    setSelectedChannelType(undefined);
  };

  const canPostToChannel =
    !selectedChannelId ||
    selectedChannelType !== 'broadcast' ||
    isUserModerator;

  return (
    <PageShell title="Groups">
      <div className="grid grid-cols-[2fr_8fr] h-full">
        <div>
          <CreateGroupForm />
          <GroupList
            onSelectGroup={handleSelectGroup}
            selectedId={selectedGroupId}
          />
        </div>
        <div className="grid grid-cols-[3fr_7fr] h-full">
          {selectedGroupId && (
            <div className="flex flex-col overflow-y-auto">
              <ChannelList
                groupId={selectedGroupId}
                onSelectChannel={(channel) => {
                  setSelectedChannelId(channel.id);
                  setSelectedChannelType(channel.type);
                  setSelectedModMailConversation(null);
                }}
                selectedId={selectedChannelId}
                canCreate={isUserModerator}
              />
              {isUserModerator && (
                <>
                  <ModMailComposer 
                    groupId={selectedGroupId} 
                    onConversationCreated={handleModMailConversationCreated}
                  />
                  <ModMailConversationList
                    key={modMailRefreshKey}
                    groupId={selectedGroupId}
                    onSelectConversation={handleSelectModMailConversation}
                    selectedId={selectedModMailConversation?.id}
                  />
                </>
              )}
              <GroupMembers />
              {isUserModerator && selectedGroupId && (
                <GroupLockdownPanel groupId={selectedGroupId} />
              )}
            </div>
          )}
          <div className="flex flex-col h-full">
            {selectedChannelId ? (
              <>
                <MessageList channelId={selectedChannelId} onReply={setReplyTo} />
                {canPostToChannel ? (
                  <SendMessageForm
                    channelId={selectedChannelId}
                    replyTo={replyTo}
                    onClearReply={() => setReplyTo(null)}
                  />
                ) : (
                  <div className="p-3 border-t border-dark-200 dark:border-dark-700 text-sm text-dark-500">
                    This is a broadcast channel — only group admins can post.
                  </div>
                )}
              </>
            ) : selectedModMailConversation ? (
              <>
                <MessageList
                  conversationId={selectedModMailConversation.id}
                  onReply={setReplyTo}
                />
                {isUserModerator && (
                  <div className="p-3 border-t border-dark-200 dark:border-dark-700">
                    <ModMailInternalNoteForm
                      groupId={selectedGroupId!}
                      conversationId={selectedModMailConversation.id}
                      onNoteSent={() => {}}
                    />
                  </div>
                )}
                <SendMessageForm
                  conversationId={selectedModMailConversation.id}
                  onMessageSent={() => {}}
                  replyTo={replyTo}
                  onClearReply={() => setReplyTo(null)}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-dark-500">
                Select a channel to start messaging.
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
};