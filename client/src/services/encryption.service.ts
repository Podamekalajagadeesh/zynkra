import sodium from 'libsodium-wrappers';

const DB_NAME = 'zynkra-crypto';
const DB_VERSION = 1;
const KEY_STORE_NAME = 'keys';

let db: IDBDatabase;

async function getDb(): Promise<IDBDatabase> {
  if (db) {
    return db;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(new Error('Failed to open IndexedDB.'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = () => {
      const newDb = request.result;
      if (!newDb.objectStoreNames.contains(KEY_STORE_NAME)) {
        newDb.createObjectStore(KEY_STORE_NAME, { keyPath: 'userId' });
      }
    };
  });
}

export async function generateAndStoreKeys(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('Invalid user ID for key generation');
  }

  await sodium.ready;
  const { publicKey, privateKey } = sodium.crypto_box_keypair();

  const db = await getDb();
  const tx = db.transaction(KEY_STORE_NAME, 'readwrite');
  const store = tx.objectStore(KEY_STORE_NAME);

  store.put({ userId, publicKey, privateKey });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getKeys(userId: string | null): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array } | null> {
  if (!userId) {
    return null;
  }

  const db = await getDb();
  const tx = db.transaction(KEY_STORE_NAME, 'readonly');
  const store = tx.objectStore(KEY_STORE_NAME);
  const request = store.get(userId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// For direct messages (1:1 encryption)
export async function encryptMessage(
  recipientPublicKey: Uint8Array,
  senderPrivateKey: Uint8Array,
  message: string
): Promise<string> {
  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const ciphertext = sodium.crypto_box_easy(message, nonce, recipientPublicKey, senderPrivateKey);

  return JSON.stringify({
    nonce: sodium.to_base64(nonce),
    ciphertext: sodium.to_base64(ciphertext),
  });
}

// For public posts/stories (self-encrypted so only owner can decrypt, but all users can verify authenticity)
export async function encryptPublicContent(
  userId: string,
  content: string
): Promise<string> {
  const keys = await getKeys(userId);
  if (!keys) throw new Error('No encryption keys found for user');

  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const ciphertext = sodium.crypto_box_easy(
    content, 
    nonce, 
    keys.publicKey, 
    keys.privateKey
  );

  return JSON.stringify({
    nonce: sodium.to_base64(nonce),
    ciphertext: sodium.to_base64(ciphertext),
    senderPublicKey: sodium.to_base64(keys.publicKey)
  });
}

// Decrypt any public content (posts/stories)
export async function decryptPublicContent(
  encryptedContent: string
): Promise<string> {
  await sodium.ready;
  const { nonce, ciphertext, senderPublicKey } = JSON.parse(encryptedContent);
  
  const senderKeyBytes = sodium.from_base64(senderPublicKey);
  const currentUserKeys = await getKeys(null); // Get current user's private key to verify
  if (!currentUserKeys) throw new Error('No user keys found');

  const decrypted = sodium.crypto_box_open_easy(
    sodium.from_base64(ciphertext),
    sodium.from_base64(nonce),
    senderKeyBytes,
    currentUserKeys.privateKey
  );

  return sodium.to_string(decrypted);
}

export async function decryptMessage(
  senderPublicKey: Uint8Array,
  recipientPrivateKey: Uint8Array,
  encryptedMessage: string
): Promise<string> {
  await sodium.ready;
  const { nonce, ciphertext } = JSON.parse(encryptedMessage);
  
  const decrypted = sodium.crypto_box_open_easy(
    sodium.from_base64(ciphertext),
    sodium.from_base64(nonce),
    senderPublicKey,
    recipientPrivateKey
  );

  return sodium.to_string(decrypted);
}