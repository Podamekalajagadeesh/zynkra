import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { getGroupMembers, leaveGroup } from '../lib/api';
import { GroupCalendar } from '../components/groups/GroupCalendar';
import { GroupTodoList } from '../components/groups/GroupTodoList';
import { useToast } from '../hooks/useToast';
import { Conversation } from '../components/dms/ConversationList';
import { Message } from '../lib/types';

export const GroupsPage = () => {
  const { id: routeGroupId } = useParams<{ id: string }>();
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(routeGroupId);
  const [selectedChannelId, setSelectedChannelId] = useState<
    string | undefined
  >();
  const [selectedChannelType, setSelectedChannelType] = useState<
    'group' | 'broadcast' | undefined
  >();
  const [selectedModMailConversation, setSelectedModMailConversation] = useState<Conversation | null>(null);
  const [isUserModerator, setIsUserModerator] = useState(false);
  const [isCurrentMember, setIsCurrentMember] = useState(false);
  const [groupPanel, setGroupPanel] = useState<'channels' | 'calendar' | 'tasks'>('channels');
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [modMailRefreshKey, setModMailRefreshKey] = useState(0);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const { addToast } = useToast();

  const handleSelectGroup = (id: string) => {
    setSelectedGroupId(id);
    setSelectedChannelId(undefined);
    setSelectedChannelType(undefined);
    setSelectedModMailConversation(null);
    setGroupPanel('channels');
    setIsUserModerator(false);
    setIsCurrentMember(false);
  };

  useEffect(() => {
    if (routeGroupId) {
      setSelectedGroupId(routeGroupId);
      setSelectedChannelId(undefined);
      setSelectedChannelType(undefined);
      setSelectedModMailConversation(null);
    }
  }, [routeGroupId]);

  // Check membership + moderator status for the selected group
  useEffect(() => {
    if (!selectedGroupId) {
      setIsUserModerator(false);
      setIsCurrentMember(false);
      return;
    }
    let cancelled = false;
    getGroupMembers(selectedGroupId)
      .then((members) => {
        if (cancelled) return;
        const currentUserId = localStorage.getItem('currentUserId');
        const currentMember = members.find((m: any) => m.user?.id === currentUserId);
        setIsCurrentMember(!!currentMember);
        setIsUserModerator(
          !!currentMember && (currentMember.role === 'admin' || currentMember.role === 'moderator'),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setIsCurrentMember(false);
        setIsUserModerator(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedGroupId, listRefreshKey]);

  const handleLeaveGroup = async () => {
    if (!selectedGroupId) return;
    try {
      await leaveGroup(selectedGroupId);
      addToast('You left the group', 'success');
      setSelectedGroupId(undefined);
      setSelectedChannelId(undefined);
      setListRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      addToast(error?.response?.data?.message || 'Failed to leave group', 'error');
    }
  };

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
            refreshKey={listRefreshKey}
          />
        </div>
        <div className="grid grid-cols-[3fr_7fr] h-full">
          {selectedGroupId && (
            <div className="flex flex-col overflow-y-auto">
              <div className="flex items-center border-b border-dark-200 dark:border-dark-700">
                {(
                  [
                    ['channels', 'Channels'],
                    ['calendar', 'Calendar'],
                    ['tasks', 'Tasks'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGroupPanel(key)}
                    className={`px-md py-sm text-sm font-semibold ${
                      groupPanel === key
                        ? 'border-b-2 border-dark-900 text-dark-900 dark:border-white dark:text-white'
                        : 'text-dark-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {isCurrentMember && (
                  <button
                    type="button"
                    onClick={handleLeaveGroup}
                    className="ml-auto px-md py-sm text-xs font-semibold text-red-600"
                  >
                    Leave group
                  </button>
                )}
              </div>
              {groupPanel === 'channels' && (
                <>
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
                  <GroupMembers groupId={selectedGroupId} />
                </>
              )}
              {groupPanel === 'calendar' && <GroupCalendar groupId={selectedGroupId} />}
              {groupPanel === 'tasks' && <GroupTodoList groupId={selectedGroupId} />}
              {isUserModerator && (
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