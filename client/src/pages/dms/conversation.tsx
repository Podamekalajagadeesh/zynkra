import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage, updateMessage, deleteMessage, uploadMedia, setVanishMode, getConversations } from '../../lib/api';
import { Message, Conversation as ConversationType } from '../../lib/types';
import { useAuth } from '../../hooks/useAuth';
import { useWebRTC } from '../../hooks/useWebRTC';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Edit, Mic, MoreHorizontal, Paperclip, Trash2, Video, Ghost } from 'lucide-react';
import { CallModal } from '../../components/dms/CallModal/CallModal';
import MessageContent from '../../components/dms/MessageContent';
import { formatDateTime } from '../../lib/preferences';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';

export function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const {
    isMuted,
    isVideoEnabled,
    isCallActive,
    localVideoRef,
    remoteVideoRef,
    startCall,
    toggleMute,
    toggleVideo,
    endCall,
  } = useWebRTC(id!);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [conversation, setConversation] = useState<ConversationType | null>(null);
  const [vanishMode, setVanishModeState] = useState(false);

  useEffect(() => {
    if (id) {
      getMessages(id)
        .then(setMessages)
        .catch((err) => console.error('Failed to fetch messages:', err))
        .finally(() => setLoading(false));
      getConversations().then((convs) => {
        const currentConv = convs.find((c) => c.id === id);
        if (currentConv) {
          setConversation(currentConv);
          setVanishModeState(currentConv.vanishMode);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !id) return;

    try {
      let media: { url: string; type: 'image' | 'video' | 'audio' }[] | undefined;

      if (selectedFile) {
        const { url } = await uploadMedia(selectedFile);
        const type = selectedFile.type.startsWith('image') ? 'image' : selectedFile.type.startsWith('video') ? 'video' : 'audio';
        media = [{ url, type }];
      }

      const sentMessage = await sendMessage(id, undefined, newMessage, undefined, media);
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!editedContent.trim()) return;

    try {
      const updatedMessage = await updateMessage(messageId, editedContent);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? updatedMessage : msg))
      );
      setEditingMessageId(null);
      setEditedContent('');
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: 'This message was deleted.', deletedAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };



  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
        if (!id) return;

        try {
          const { url } = await uploadMedia(file);
          const sentMessage = await sendMessage(id, undefined, '', undefined, [{ url, type: 'audio' }]);
          setMessages((prev) => [...prev, sentMessage]);
        } catch (error) {
          console.error('Failed to send voice message:', error);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const handleToggleVanishMode = async () => {
    if (!id) return;
    try {
      await setVanishMode(id, !vanishMode);
      setVanishModeState(!vanishMode);
    } catch (error) {
      console.error('Failed to toggle vanish mode:', error);
    }
  };

  useEffect(() => {
    if (vanishMode) {
      const readMessages = messages.filter(
        (msg) =>
          !msg.deletedAt &&
          msg.readBy.length > 0 &&
          msg.readBy.some((r) => r.user.id !== currentUser?.id),
      );
      readMessages.forEach((msg) => {
        // We call the API directly to avoid the confirmation prompt
        deleteMessage(msg.id).then(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? { ...m, content: 'This message was deleted.', deletedAt: new Date().toISOString() }
                : m
            )
          );
        }).catch(err => console.error('Failed to auto-delete message in vanish mode:', err));
      });
    }
  }, [messages, vanishMode, currentUser, id]);

  return (
    <PageShell>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-bold">Conversation</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Ghost
                className={vanishMode ? 'text-blue-500' : 'text-gray-400'}
              />
              <Label htmlFor="vanish-mode">Vanish Mode</Label>
              <Switch
                id="vanish-mode"
                checked={vanishMode}
                onCheckedChange={handleToggleVanishMode}
              />
            </div>
            <Button onClick={startCall} size="icon" variant="outline">
              <Video />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-16 w-3/4 self-end" />
              <Skeleton className="h-16 w-3/4" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender.id === currentUser?.id
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 lg:max-w-md relative group ${
                      message.sender.id === currentUser?.id
                        ? 'bg-primary-500 text-white'
                        : 'surface'
                    }`}
                  >
                    {message.sender.id === currentUser?.id && !message.deletedAt && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditedContent(message.content);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs font-semibold opacity-80 mb-1">
                      {message.sender.email || message.sender.walletAddress}
                    </p>
                    {editingMessageId === message.id ? (
                      <div>
                        <Input
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="bg-transparent text-white"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateMessage(message.id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingMessageId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <MessageContent message={message} />
                    )}
                    <p className="mt-1 text-right text-xs opacity-70">
                      {formatDateTime(message.createdAt, { timeStyle: 'short' })}
                      {message.updatedAt &&
                        new Date(message.updatedAt).getTime() !==
                          new Date(message.createdAt).getTime() && <em> (edited)</em>}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              <Paperclip />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button type="button" onClick={handleRecord}>
              {isRecording ? 'Stop' : <Mic />}
            </Button>
            <Button type="submit">Send</Button>
          </form>
        </div>
      </div>
      <CallModal
        isOpen={isCallActive}
        onClose={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
      />
    </PageShell>
  );
}