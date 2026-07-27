/**
 * Offline Database — IndexedDB-backed local storage for offline-first architecture.
 *
 * Stores posts, messages, user data, and pending operations so Zynkra
 * works completely offline and syncs when connection returns.
 */

const DB_NAME = 'zynkra-offline';
const DB_VERSION = 1;

interface OfflinePost {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  pending: boolean; // true if created/modified while offline
  syncAction?: 'create' | 'update' | 'delete';
}

interface OfflineMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  encryptedContent?: string;
  createdAt: string;
  synced: boolean;
  pending: boolean;
}

interface OfflineUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  lastSyncedAt: string;
}

interface SyncQueueItem {
  id: string;
  type: 'post' | 'message' | 'reaction' | 'follow' | 'profile';
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  createdAt: string;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open offline database'));

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('posts')) {
        const posts = db.createObjectStore('posts', { keyPath: 'id' });
        posts.createIndex('synced', 'synced');
        posts.createIndex('pending', 'pending');
        posts.createIndex('createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('messages')) {
        const messages = db.createObjectStore('messages', { keyPath: 'id' });
        messages.createIndex('conversationId', 'conversationId');
        messages.createIndex('synced', 'synced');
      }

      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('conversations')) {
        db.createObjectStore('conversations', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncQueue = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncQueue.createIndex('status', 'status');
        syncQueue.createIndex('createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('syncMetadata')) {
        db.createObjectStore('syncMetadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

// Generic CRUD operations

async function dbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(value);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function dbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function dbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function dbGetByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

// ---- Public API ----

export const offlineDB = {
  // Posts
  async savePost(post: OfflinePost): Promise<void> {
    await dbPut('posts', post);
  },

  async getPost(id: string): Promise<OfflinePost | undefined> {
    return dbGet<OfflinePost>('posts', id);
  },

  async getAllPosts(): Promise<OfflinePost[]> {
    return dbGetAll<OfflinePost>('posts');
  },

  async getUnsyncedPosts(): Promise<OfflinePost[]> {
    return dbGetByIndex<OfflinePost>('posts', 'synced', false);
  },

  async getPendingPosts(): Promise<OfflinePost[]> {
    return dbGetByIndex<OfflinePost>('posts', 'pending', true);
  },

  async deletePost(id: string): Promise<void> {
    await dbDelete('posts', id);
  },

  // Messages
  async saveMessage(message: OfflineMessage): Promise<void> {
    await dbPut('messages', message);
  },

  async getMessage(id: string): Promise<OfflineMessage | undefined> {
    return dbGet<OfflineMessage>('messages', id);
  },

  async getConversationMessages(conversationId: string): Promise<OfflineMessage[]> {
    return dbGetByIndex<OfflineMessage>('messages', 'conversationId', conversationId);
  },

  async getUnsyncedMessages(): Promise<OfflineMessage[]> {
    return dbGetByIndex<OfflineMessage>('messages', 'synced', false);
  },

  // Users
  async saveUser(user: OfflineUser): Promise<void> {
    await dbPut('users', user);
  },

  async getUser(id: string): Promise<OfflineUser | undefined> {
    return dbGet<OfflineUser>('users', id);
  },

  // Sync Queue
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retries' | 'status'>): Promise<SyncQueueItem> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      retries: 0,
      status: 'pending',
    };
    await dbPut('syncQueue', queueItem);
    return queueItem;
  },

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return dbGetByIndex<SyncQueueItem>('syncQueue', 'status', 'pending');
  },

  async updateSyncItem(item: SyncQueueItem): Promise<void> {
    await dbPut('syncQueue', item);
  },

  async removeSyncItem(id: string): Promise<void> {
    await dbDelete('syncQueue', id);
  },

  async clearCompletedSyncItems(): Promise<void> {
    const items = await dbGetAll<SyncQueueItem>('syncQueue');
    for (const item of items) {
      if (item.status === 'completed') {
        await dbDelete('syncQueue', item.id);
      }
    }
  },

  // Metadata (sync timestamps, last sync, etc.)
  async setMetadata(key: string, value: any): Promise<void> {
    await dbPut('syncMetadata', { key, value });
  },

  async getMetadata(key: string): Promise<any> {
    const result = await dbGet<{ key: string; value: any }>('syncMetadata', key);
    return result?.value;
  },

  // Bulk operations
  async syncPosts(posts: OfflinePost[]): Promise<void> {
    for (const post of posts) {
      await dbPut('posts', post);
    }
  },

  async syncMessages(messages: OfflineMessage[]): Promise<void> {
    for (const msg of messages) {
      await dbPut('messages', msg);
    }
  },

  // Stats
  async getOfflineStats(): Promise<{
    posts: number;
    messages: number;
    pendingSync: number;
    lastSyncedAt: string | null;
  }> {
    const posts = await dbGetAll<OfflinePost>('posts');
    const messages = await dbGetAll<OfflineMessage>('messages');
    const pending = await dbGetAll<SyncQueueItem>('syncQueue');
    const lastSynced = await this.getMetadata('lastSyncedAt');

    return {
      posts: posts.length,
      messages: messages.length,
      pendingSync: pending.filter(i => i.status === 'pending').length,
      lastSyncedAt: lastSynced,
    };
  },

  // Clear all offline data
  async clearAll(): Promise<void> {
    const db = await openDb();
    const stores = ['posts', 'messages', 'users', 'conversations', 'syncQueue', 'syncMetadata'];
    const tx = db.transaction(stores, 'readwrite');
    stores.forEach(name => tx.objectStore(name).clear());
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },
};
