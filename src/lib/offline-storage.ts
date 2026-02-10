/**
 * Offline Storage Utilities using IndexedDB
 * Stores data locally when offline and syncs when back online
 */

const DB_NAME = 'gms-offline-db';
const DB_VERSION = 1;

interface PendingItem {
  id?: number;
  data: any;
  timestamp: number;
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('pendingReports')) {
        db.createObjectStore('pendingReports', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingReactions')) {
        db.createObjectStore('pendingReactions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cachedReports')) {
        db.createObjectStore('cachedReports', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save pending report for background sync
 */
export async function savePendingReport(reportData: any): Promise<number> {
  const db = await openDB();
  const tx = db.transaction('pendingReports', 'readwrite');
  const store = tx.objectStore('pendingReports');
  
  const item: PendingItem = {
    data: reportData,
    timestamp: Date.now(),
  };
  
  return new Promise((resolve, reject) => {
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save pending reaction for background sync
 */
export async function savePendingReaction(reactionData: any): Promise<number> {
  const db = await openDB();
  const tx = db.transaction('pendingReactions', 'readwrite');
  const store = tx.objectStore('pendingReactions');
  
  const item: PendingItem = {
    data: reactionData,
    timestamp: Date.now(),
  };
  
  return new Promise((resolve, reject) => {
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save pending message for background sync
 */
export async function savePendingMessage(messageData: any): Promise<number> {
  const db = await openDB();
  const tx = db.transaction('pendingMessages', 'readwrite');
  const store = tx.objectStore('pendingMessages');
  
  const item: PendingItem = {
    data: messageData,
    timestamp: Date.now(),
  };
  
  return new Promise((resolve, reject) => {
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache report data for offline viewing
 */
export async function cacheReport(reportId: string, reportData: any): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('cachedReports', 'readwrite');
  const store = tx.objectStore('cachedReports');
  
  return new Promise((resolve, reject) => {
    const request = store.put({ id: reportId, ...reportData, cachedAt: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cached report
 */
export async function getCachedReport(reportId: string): Promise<any> {
  const db = await openDB();
  const tx = db.transaction('cachedReports', 'readonly');
  const store = tx.objectStore('cachedReports');
  
  return new Promise((resolve, reject) => {
    const request = store.get(reportId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get count of pending items
 */
export async function getPendingCounts(): Promise<{
  reports: number;
  reactions: number;
  messages: number;
}> {
  const db = await openDB();
  
  const [reports, reactions, messages] = await Promise.all([
    getStoreCount(db, 'pendingReports'),
    getStoreCount(db, 'pendingReactions'),
    getStoreCount(db, 'pendingMessages'),
  ]);
  
  return { reports, reactions, messages };
}

function getStoreCount(db: IDBDatabase, storeName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Trigger background sync
 */
export async function triggerBackgroundSync(tag: string): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration: any = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
  }
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Submit data with offline support
 * Attempts to submit immediately, falls back to offline queue
 */
export async function submitWithOfflineSupport(
  url: string,
  data: any,
  storageKey: 'reports' | 'reactions' | 'messages'
): Promise<{ success: boolean; offline: boolean; id?: number }> {
  // Try immediate submission if online
  if (isOnline()) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        return { success: true, offline: false };
      }
    } catch (error) {
      console.error('Failed to submit, falling back to offline storage:', error);
    }
  }
  
  // Store for background sync
  let id: number;
  if (storageKey === 'reports') {
    id = await savePendingReport(data);
    await triggerBackgroundSync('sync-reports');
  } else if (storageKey === 'reactions') {
    id = await savePendingReaction(data);
    await triggerBackgroundSync('sync-reactions');
  } else {
    id = await savePendingMessage(data);
    await triggerBackgroundSync('sync-messages');
  }
  
  return { success: true, offline: true, id };
}
