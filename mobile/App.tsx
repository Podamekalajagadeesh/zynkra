import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Post = {
  id: string;
  author: string;
  handle: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
};

type QueuedPost = {
  id: string;
  author: string;
  handle: string;
  content: string;
  createdAt: string;
  attempts?: number;
  nextAttemptAt?: number; // timestamp
};

const QUEUE_STORAGE_KEY = 'zynkra-mobile-queued-posts';
const API_TIMEOUT_MS = 5000;

function getApiBaseUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://127.0.0.1:3000';
}

function readQueuedPosts(): QueuedPost[] {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as QueuedPost[]) : [];
    } catch {
      return [];
    }
  }

  const globalStore = globalThis as typeof globalThis & { __zynkraMobileQueuedPosts?: string };
  if (globalStore.__zynkraMobileQueuedPosts) {
    try {
      return JSON.parse(globalStore.__zynkraMobileQueuedPosts) as QueuedPost[];
    } catch {
      return [];
    }
  }

  return [];
}

function persistQueuedPosts(posts: QueuedPost[]) {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(posts));
    return;
  }

  const globalStore = globalThis as typeof globalThis & { __zynkraMobileQueuedPosts?: string };
  globalStore.__zynkraMobileQueuedPosts = JSON.stringify(posts);
}

const starterPosts: Post[] = [
  {
    id: '1',
    author: 'Mina',
    handle: '@mina',
    content: 'Zynkra is now running as a real mobile experience with live content and instant posting.',
    likes: 24,
    comments: 7,
    time: 'now',
  },
  {
    id: '2',
    author: 'Ayo',
    handle: '@ayo',
    content: 'The mobile experience now supports polished feed refresh, posting, and offline recovery.',
    likes: 18,
    comments: 3,
    time: '10m ago',
  },
];

export default function App() {
  const [posts, setPosts] = useState<Post[]>(starterPosts);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connected to the Zynkra feed');
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [connectionState, setConnectionState] = useState<'online' | 'offline'>(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? (navigator.onLine ? 'online' : 'offline') : 'online',
  );
  const [queuedPosts, setQueuedPosts] = useState<QueuedPost[]>(() => readQueuedPosts());
  const queuedPostsRef = useRef<QueuedPost[]>([]);

  useEffect(() => {
    queuedPostsRef.current = queuedPosts;
  }, [queuedPosts]);

  const checkBackendHealth = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setStatusMessage('Loading latest posts...');
    setStatusTone('info');

    try {
      const isBackendHealthy = await checkBackendHealth();
      if (!isBackendHealthy) {
        throw new Error('Backend health check failed');
      }

      const response = await fetch(`${getApiBaseUrl()}/mobile/feed`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const payload = await response.json();
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      if (items.length > 0) {
        const mapped: Post[] = items.slice(0, 8).map((item: any, index: number) => ({
          id: String(item.id ?? item._id ?? `${index + 1}`),
          author: item.author?.name ?? item.author?.author ?? item.user?.username ?? 'Zynkra User',
          handle: item.author?.handle ?? item.user?.username ?? '@zynkra',
          content: item.content ?? item.body ?? item.text ?? 'Shared from the network',
          likes: item.likes ?? item.reactions?.length ?? 0,
          comments: item.comments ?? item.commentCount ?? 0,
          time: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'just now',
        }));

        setPosts(mapped);
        setStatusMessage('Live posts loaded from the backend');
        setStatusTone('success');
      } else {
        setPosts(starterPosts);
        setStatusMessage('No backend posts yet; showing local sample feed');
        setStatusTone('warning');
      }
    } catch (error) {
      console.warn('Using offline sample feed:', error);
      setPosts(starterPosts);
      setStatusMessage(`Offline mode: ${error instanceof Error ? error.message : 'sample feed is active'}`);
      setStatusTone('warning');
    } finally {
      setLoading(false);
    }
  }, [checkBackendHealth]);

  const postToBackend = useCallback(async (payload: { content: string; author: string; handle: string }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(`${getApiBaseUrl()}/mobile/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      return true;
    } catch (error) {
      console.warn('Mobile post sync failed:', error);
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const syncQueuedPosts = useCallback(async () => {
    if (!queuedPostsRef.current.length) {
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatusMessage('Offline: queued posts will retry automatically when the connection returns.');
      setStatusTone('warning');
      return;
    }

    const pending = [...queuedPostsRef.current];
    const remaining: QueuedPost[] = [];
    const now = Date.now();

    setStatusMessage(`Syncing ${pending.length} queued post${pending.length === 1 ? '' : 's'}...`);
    setStatusTone('info');

    for (const item of pending) {
      if (item.nextAttemptAt && item.nextAttemptAt > now) {
        remaining.push(item);
        continue;
      }

      const published = await postToBackend({
        content: item.content,
        author: item.author,
        handle: item.handle,
      });

      if (!published) {
        const attempts = (item.attempts || 0) + 1;
        const backoff = Math.min(60 * 60 * 1000, Math.pow(2, attempts) * 1000);
        remaining.push({ ...item, attempts, nextAttemptAt: Date.now() + backoff });
      }
    }

    queuedPostsRef.current = remaining;
    setQueuedPosts(remaining);
    persistQueuedPosts(remaining);

    if (remaining.length === 0) {
      await loadPosts();
      setStatusMessage('Queued posts are now synced with the backend');
      setStatusTone('success');
      return;
    }

    setStatusMessage(`${remaining.length} post${remaining.length === 1 ? '' : 's'} remain queued for recovery`);
    setStatusTone('warning');
  }, [loadPosts, postToBackend]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const updateConnectionState = () => {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setConnectionState(isOnline ? 'online' : 'offline');
      if (isOnline) {
        void syncQueuedPosts();
      }
    };

    updateConnectionState();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateConnectionState);
      window.addEventListener('offline', updateConnectionState);
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        updateConnectionState();
      }
    });

    // Periodically attempt to sync queued posts while the app is active and online
    let intervalId: number | undefined;
    if (typeof setInterval !== 'undefined') {
      intervalId = setInterval(() => {
        if ((typeof navigator === 'undefined' || navigator.onLine) && AppState.currentState === 'active') {
          void syncQueuedPosts();
        }
      }, 15_000) as unknown as number; // every 15s while active
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', updateConnectionState);
        window.removeEventListener('offline', updateConnectionState);
      }
      subscription.remove();
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [syncQueuedPosts]);

  const publishPost = async () => {
    const cleaned = draft.trim();
    if (!cleaned) {
      return;
    }

    const newPost: Post = {
      id: `local-${Date.now()}`,
      author: 'You',
      handle: '@you',
      content: cleaned,
      likes: 0,
      comments: 0,
      time: 'just now',
    };

    setPosts((current) => [newPost, ...current]);
    setDraft('');

    if (connectionState === 'online') {
      const published = await postToBackend({
        content: cleaned,
        author: 'You',
        handle: '@you',
      });

      if (published) {
        setStatusMessage('Post published to the backend');
        setStatusTone('success');
        await loadPosts();
        return;
      }

      console.warn('Publishing post failed, queueing it for recovery');
    }

    const queuedEntry: QueuedPost = {
      id: newPost.id,
      author: newPost.author,
      handle: newPost.handle,
      content: cleaned,
      createdAt: new Date().toISOString(),
      attempts: 0,
      nextAttemptAt: 0,
    };

    const nextQueue = [queuedEntry, ...queuedPostsRef.current];
    queuedPostsRef.current = nextQueue;
    setQueuedPosts(nextQueue);
    persistQueuedPosts(nextQueue);
    setStatusMessage('Post queued for sync and recovery');
    setStatusTone('warning');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Zynkra</Text>
          <Text style={styles.subtitle}>Universal social app for iOS and Android</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={() => void loadPosts()}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.refreshButtonText}>Refresh</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>{connectionState === 'online' ? '● Online' : '● Offline'}</Text>
        <Text style={styles.statusText}>{queuedPosts.length > 0 ? `${queuedPosts.length} queued for sync` : 'All changes synced'}</Text>
      </View>

      <Text style={[styles.status, statusTone === 'error' ? styles.statusError : statusTone === 'success' ? styles.statusSuccess : statusTone === 'warning' ? styles.statusWarning : styles.statusInfo]}>{statusMessage}</Text>

      <View style={styles.composeCard}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Share something with your community"
          multiline
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.postButton} onPress={() => void publishPost()}>
          <Text style={styles.postButtonText}>Publish</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View>
                <Text style={styles.author}>{item.author}</Text>
                <Text style={styles.handle}>{item.handle}</Text>
              </View>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <Text style={styles.content}>{item.content}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>♥ {item.likes}</Text>
              <Text style={styles.meta}>💬 {item.comments}</Text>
            </View>
          </View>
        )}
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: '#2563eb',
    minWidth: 86,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    color: '#0f172a',
    fontWeight: '700',
  },
  statusText: {
    color: '#64748b',
    fontSize: 12,
  },
  status: {
    marginHorizontal: 20,
    marginBottom: 10,
    fontSize: 13,
  },
  statusInfo: {
    color: '#475569',
  },
  statusSuccess: {
    color: '#047857',
  },
  statusWarning: {
    color: '#b45309',
  },
  statusError: {
    color: '#b91c1c',
  },
  composeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
  },
  postButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  author: {
    fontWeight: '700',
    color: '#0f172a',
  },
  handle: {
    color: '#64748b',
    fontSize: 12,
  },
  time: {
    color: '#64748b',
    fontSize: 12,
  },
  content: {
    color: '#1e293b',
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  meta: {
    color: '#475569',
    fontWeight: '600',
  },
});
