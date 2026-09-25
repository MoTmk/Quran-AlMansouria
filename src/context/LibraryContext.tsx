import React, { createContext, useContext, useEffect, useState } from 'react';
import { DownloadedTrack, HistoryItem, PlaylistItem, UserPlaylist } from '../types';
import {
  deleteDownloadedAudio,
  downloadAndSaveAudio,
  getAllDownloadedTracks,
  isAudioDownloaded,
} from '../utils/audioStorage';

interface LibraryContextType {
  favorites: PlaylistItem[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: PlaylistItem) => void;

  playlists: UserPlaylist[];
  createPlaylist: (name: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addToPlaylist: (playlistId: string, item: PlaylistItem) => void;
  removeFromPlaylist: (playlistId: string, itemId: string) => void;

  history: HistoryItem[];
  addToHistory: (item: PlaylistItem, progressSeconds: number, durationSeconds: number) => void;
  clearHistory: () => void;

  downloadedTracks: DownloadedTrack[];
  downloadProgress: Record<string, number>;
  isDownloaded: (id: string) => boolean;
  downloadTrack: (item: PlaylistItem) => Promise<void>;
  deleteDownload: (id: string) => Promise<void>;

  continueListening: HistoryItem | null;
  saveContinueListening: (item: PlaylistItem, progressSeconds: number, durationSeconds: number) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEY_FAVS = 'noor_favorites_v1';
const STORAGE_KEY_PLAYLISTS = 'noor_playlists_v1';
const STORAGE_KEY_HISTORY = 'noor_history_v1';
const STORAGE_KEY_CONTINUE = 'noor_continue_listening_v1';

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Favorites
  const [favorites, setFavorites] = useState<PlaylistItem[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_FAVS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Playlists
  const [playlists, setPlaylists] = useState<UserPlaylist[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    // Default initial playlists
    return [
      {
        id: 'pl_fav_surahs',
        name: 'سُوَر يوم الجمعة والبركة',
        createdAt: Date.now(),
        items: [],
      },
    ];
  });

  // History
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Continue listening
  const [continueListening, setContinueListening] = useState<HistoryItem | null>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CONTINUE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  // Downloads from IndexedDB
  const [downloadedTracks, setDownloadedTracks] = useState<DownloadedTrack[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  // Sync favorites
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  // Sync playlists
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.warn('Failed to save playlists to localStorage', e);
    }
  }, [playlists]);

  // Sync history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [history]);

  // Refresh downloads from IndexedDB
  const refreshDownloads = async () => {
    try {
      const tracks = await getAllDownloadedTracks();
      setDownloadedTracks(tracks);
    } catch (err) {
      console.warn('Could not read offline tracks', err);
    }
  };

  useEffect(() => {
    refreshDownloads();

    const handleDownloadsChanged = () => {
      refreshDownloads();
    };

    window.addEventListener('noor_downloads_changed', handleDownloadsChanged);
    return () => {
      window.removeEventListener('noor_downloads_changed', handleDownloadsChanged);
    };
  }, []);

  const isFavorite = (id: string) => favorites.some((item) => item.id === id);

  const toggleFavorite = (item: PlaylistItem) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === item.id)) {
        return prev.filter((f) => f.id !== item.id);
      }
      return [item, ...prev];
    });
  };

  const createPlaylist = (name: string) => {
    if (!name.trim()) return;
    const newPl: UserPlaylist = {
      id: 'pl_' + Date.now(),
      name: name.trim(),
      createdAt: Date.now(),
      items: [],
    };
    setPlaylists((prev) => [newPl, ...prev]);
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  const addToPlaylist = (playlistId: string, item: PlaylistItem) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        if (pl.items.some((i) => i.id === item.id)) return pl;
        return { ...pl, items: [...pl.items, item] };
      })
    );
  };

  const removeFromPlaylist = (playlistId: string, itemId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        return { ...pl, items: pl.items.filter((i) => i.id !== itemId) };
      })
    );
  };

  const addToHistory = (item: PlaylistItem, progressSeconds: number, durationSeconds: number) => {
    const historyItem: HistoryItem = {
      ...item,
      playedAt: Date.now(),
      progressSeconds,
      durationSeconds,
    };
    setHistory((prev) => [historyItem, ...prev.filter((h) => h.id !== item.id)].slice(0, 50));
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {}
  };

  const saveContinueListening = (item: PlaylistItem, progressSeconds: number, durationSeconds: number) => {
    const cont: HistoryItem = {
      ...item,
      playedAt: Date.now(),
      progressSeconds,
      durationSeconds,
    };
    setContinueListening(cont);
    try {
      localStorage.setItem(STORAGE_KEY_CONTINUE, JSON.stringify(cont));
    } catch {}
  };

  const isDownloaded = (id: string) => downloadedTracks.some((t) => t.id === id);

  const downloadTrack = async (item: PlaylistItem) => {
    try {
      setDownloadProgress((prev) => ({ ...prev, [item.id]: 5 }));
      await downloadAndSaveAudio(item, (pct) => {
        setDownloadProgress((prev) => ({ ...prev, [item.id]: pct }));
      });
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      await refreshDownloads();
    } catch (err) {
      console.error('Download failed', err);
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      throw err;
    }
  };

  const deleteDownload = async (id: string) => {
    await deleteDownloadedAudio(id);
    await refreshDownloads();
  };

  return (
    <LibraryContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        playlists,
        createPlaylist,
        deletePlaylist,
        addToPlaylist,
        removeFromPlaylist,
        history,
        addToHistory,
        clearHistory,
        downloadedTracks,
        downloadProgress,
        isDownloaded,
        downloadTrack,
        deleteDownload,
        continueListening,
        saveContinueListening,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
};
