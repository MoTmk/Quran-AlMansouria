import { DownloadedTrack, PlaylistItem } from '../types';

const DB_NAME = 'noor_audio_offline_db';
const DB_VERSION = 1;
const STORE_TRACKS = 'tracks';
const STORE_BLOBS = 'audio_blobs';

// Open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Download and save audio to IndexedDB
export async function downloadAndSaveAudio(
  track: PlaylistItem,
  onProgress?: (percent: number) => void
): Promise<DownloadedTrack> {
  // Fetch with progress tracking if possible
  const response = await fetch(track.audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  
  let blob: Blob;

  if (response.body && total > 0 && onProgress) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
        const pct = Math.round((received / total) * 100);
        onProgress(pct);
      }
    }

    // Merge chunks
    const allChunks = new Uint8Array(received);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }
    blob = new Blob([allChunks], { type: 'audio/mpeg' });
  } else {
    // Standard blob fetch
    blob = await response.blob();
    if (onProgress) onProgress(100);
  }

  const db = await openDB();

  const downloadedTrack: DownloadedTrack = {
    ...track,
    blobKey: track.id,
    sizeBytes: blob.size,
    downloadedAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');
    const tracksStore = tx.objectStore(STORE_TRACKS);
    const blobsStore = tx.objectStore(STORE_BLOBS);

    tracksStore.put(downloadedTrack);
    blobsStore.put(blob, track.id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  // Dispatch custom event for reactive UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('noor_downloads_changed', { detail: { trackId: track.id } }));
  }

  return downloadedTrack;
}

// Check if a track is downloaded
export async function isAudioDownloaded(trackId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.get(trackId);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Get offline Blob Object URL
export async function getOfflineBlobUrl(trackId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_BLOBS, 'readonly');
      const store = tx.objectStore(STORE_BLOBS);
      const req = store.get(trackId);
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          resolve(URL.createObjectURL(req.result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Delete downloaded track
export async function deleteDownloadedAudio(trackId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');
    const tracksStore = tx.objectStore(STORE_TRACKS);
    const blobsStore = tx.objectStore(STORE_BLOBS);

    tracksStore.delete(trackId);
    blobsStore.delete(trackId);

    tx.oncomplete = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('noor_downloads_changed', { detail: { trackId, deleted: true } }));
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Save a local uploaded audio file into IndexedDB (supports large files, recordings, clips)
export async function saveCustomAudioBlob(blobKey: string, fileOrBlob: Blob): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, 'readwrite');
    const blobsStore = tx.objectStore(STORE_BLOBS);
    blobsStore.put(fileOrBlob, blobKey);
    tx.oncomplete = () => resolve(`blob_key:${blobKey}`);
    tx.onerror = () => reject(tx.error);
  });
}

// Delete custom audio blob
export async function deleteCustomAudioBlob(blobKey: string): Promise<void> {
  try {
    const db = await openDB();
    const actualKey = blobKey.startsWith('blob_key:') ? blobKey.replace('blob_key:', '') : blobKey;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BLOBS, 'readwrite');
      const blobsStore = tx.objectStore(STORE_BLOBS);
      blobsStore.delete(actualKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore error if not found
  }
}

// Get all downloaded tracks
export async function getAllDownloadedTracks(): Promise<DownloadedTrack[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// Format bytes into readable format
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
