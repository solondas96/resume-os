/**
 * Client-side persistence: IndexedDB with localStorage fallback
 * Stores Resume objects (v2 schema) with automatic migration from v1
 */

import { Resume } from '../model/resume';

const DB_NAME = 'resumelabs';
const DB_VERSION = 1;
const STORE_NAME = 'resumes';
const SETTINGS_STORE = 'settings';
const HISTORY_STORE = 'history';

type IDBDatabase = any; // Avoid TypeScript strictness issues with IndexedDB types

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB with fallback detection
 */
async function initDB(): Promise<IDBDatabase | null> {
  if (dbInstance) return dbInstance;

  if (typeof window === 'undefined' || !window.indexedDB) {
    console.warn('IndexedDB not available, falling back to localStorage');
    return null;
  }

  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      resolve(null);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
        historyStore.createIndex('resumeId', 'resumeId', { unique: false });
      }
    };
  });
}

/**
 * Save a Resume to IndexedDB (or localStorage fallback)
 */
export async function saveResume(resume: Resume): Promise<boolean> {
  const db = await initDB();

  if (!db) {
    // Fallback to localStorage
    try {
      localStorage.setItem(`resume_${resume.id}`, JSON.stringify(resume));
      return true;
    } catch (e) {
      console.error('Failed to save resume:', e);
      return false;
    }
  }

  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(resume);

    request.onerror = () => {
      console.error('Failed to save resume to IndexedDB:', request.error);
      resolve(false);
    };

    request.onsuccess = () => {
      resolve(true);
    };
  });
}

/**
 * Load a Resume by ID
 */
export async function loadResume(id: string): Promise<Resume | null> {
  const db = await initDB();

  if (!db) {
    // Fallback to localStorage
    try {
      const data = localStorage.getItem(`resume_${id}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => {
      console.error('Failed to load resume from IndexedDB:', request.error);
      resolve(null);
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

/**
 * Load all Resumes for the user
 */
export async function loadAllResumes(): Promise<Resume[]> {
  const db = await initDB();

  if (!db) {
    // Fallback to localStorage
    const resumes: Resume[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('resume_')) {
          const data = localStorage.getItem(key);
          if (data) resumes.push(JSON.parse(data));
        }
      }
      return resumes;
    } catch (e) {
      return resumes;
    }
  }

  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      console.error('Failed to load resumes from IndexedDB:', request.error);
      resolve([]);
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };
  });
}

/**
 * Delete a Resume by ID
 */
export async function deleteResume(id: string): Promise<boolean> {
  const db = await initDB();

  if (!db) {
    // Fallback to localStorage
    try {
      localStorage.removeItem(`resume_${id}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      console.error('Failed to delete resume from IndexedDB:', request.error);
      resolve(false);
    };

    request.onsuccess = () => {
      resolve(true);
    };
  });
}

/**
 * Save a settings value
 */
export async function saveSetting(key: string, value: any): Promise<boolean> {
  const db = await initDB();

  if (!db) {
    try {
      localStorage.setItem(`setting_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  return new Promise((resolve) => {
    const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put({ key, value });

    request.onerror = () => resolve(false);
    request.onsuccess = () => resolve(true);
  });
}

/**
 * Load a settings value
 */
export async function loadSetting(key: string): Promise<any | null> {
  const db = await initDB();

  if (!db) {
    try {
      const data = localStorage.getItem(`setting_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  return new Promise((resolve) => {
    const transaction = db.transaction([SETTINGS_STORE], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get(key);

    request.onerror = () => resolve(null);
    request.onsuccess = () => resolve(request.result?.value || null);
  });
}

/**
 * Save a revision/snapshot
 */
export async function saveRevision(resumeId: string, revision: any): Promise<boolean> {
  const db = await initDB();

  if (!db) {
    try {
      const revisions = JSON.parse(localStorage.getItem(`revisions_${resumeId}`) || '[]');
      revisions.push(revision);
      localStorage.setItem(`revisions_${resumeId}`, JSON.stringify(revisions.slice(-20))); // Keep last 20
      return true;
    } catch (e) {
      return false;
    }
  }

  return new Promise((resolve) => {
    const transaction = db.transaction([HISTORY_STORE], 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE);
    const request = store.add({ ...revision, resumeId });

    request.onerror = () => resolve(false);
    request.onsuccess = () => resolve(true);
  });
}

/**
 * Load revisions for a resume
 */
export async function loadRevisions(resumeId: string): Promise<any[]> {
  const db = await initDB();

  if (!db) {
    try {
      return JSON.parse(localStorage.getItem(`revisions_${resumeId}`) || '[]');
    } catch (e) {
      return [];
    }
  }

  return new Promise((resolve) => {
    const transaction = db.transaction([HISTORY_STORE], 'readonly');
    const store = transaction.objectStore(HISTORY_STORE);
    const index = store.index('resumeId');
    const request = index.getAll(resumeId);

    request.onerror = () => resolve([]);
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Perform initial setup: open the database.
 * The v1 → v2 migration is run separately (see runMigrationOnStartup in model/migrate).
 */
export async function initializePersistence(): Promise<void> {
  await initDB();
}
