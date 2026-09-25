import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { PlaylistItem } from '../types';
import { getOfflineBlobUrl } from '../utils/audioStorage';
import { useLibrary } from './LibraryContext';

export type RepeatMode = 'off' | 'all' | 'one';

interface AudioContextType {
  currentTrack: PlaylistItem | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: PlaylistItem[];
  currentQueueIndex: number;
  isFullScreenPlayerOpen: boolean;
  sleepTimerMinutes: number | null;
  sleepTimerRemainingSeconds: number | null;

  playTrack: (track: PlaylistItem, newQueue?: PlaylistItem[], startPositionSeconds?: number) => Promise<void>;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleRepeatMode: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: PlaylistItem) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setSleepTimer: (minutes: number | null) => void;
  setIsFullScreenPlayerOpen: (open: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToHistory, saveContinueListening } = useLibrary();

  const [currentTrack, setCurrentTrack] = useState<PlaylistItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState<PlaylistItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);

  // Sleep Timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemainingSeconds, setSleepTimerRemainingSeconds] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const lastSavedPositionRef = useRef<number>(0);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const playSessionIdRef = useRef<number>(0);

  // Keep refs in sync for event handlers to avoid reattaching listeners
  const currentTrackRef = useRef<PlaylistItem | null>(currentTrack);
  currentTrackRef.current = currentTrack;

  const queueRef = useRef<PlaylistItem[]>(queue);
  queueRef.current = queue;

  const currentQueueIndexRef = useRef<number>(currentQueueIndex);
  currentQueueIndexRef.current = currentQueueIndex;

  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  repeatModeRef.current = repeatMode;

  const isShuffleRef = useRef<boolean>(isShuffle);
  isShuffleRef.current = isShuffle;

  // Initialize Audio ONCE on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      const currentSec = Math.floor(audio.currentTime);
      if (Math.abs(currentSec - lastSavedPositionRef.current) >= 3 && currentTrackRef.current) {
        lastSavedPositionRef.current = currentSec;
        saveContinueListening(currentTrackRef.current, audio.currentTime, audio.duration || 0);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const onPause = () => {
      setIsPlaying(false);
    };

    const onEnded = () => {
      handleTrackEnded();
    };

    const onError = (e: Event) => {
      setIsLoading(false);
      setIsPlaying(false);
      console.warn('Audio stream error or network offline:', audio.error);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []); // Run ONCE only!

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerRemainingSeconds === null) return;
    if (sleepTimerRemainingSeconds <= 0) {
      if (audioRef.current) {
        safePause(audioRef.current);
      }
      setIsPlaying(false);
      setSleepTimerMinutes(null);
      setSleepTimerRemainingSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      setSleepTimerRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemainingSeconds]);

  // Update MediaSession API for phone lockscreen / notification controls
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentTrack) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.reciterOrScholar,
        album: currentTrack.subtitle,
        artwork: [
          {
            src: currentTrack.imageUrl || '/icon.svg',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => previousTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekforward', () => skipForward(10));
      navigator.mediaSession.setActionHandler('seekbackward', () => skipBackward(10));
    } catch (err) {
      console.warn('MediaSession error', err);
    }
  }, [currentTrack, isPlaying]);

  // Safe pause that respects active play promises and doesn't interrupt future play requests
  const safePause = (audio: HTMLAudioElement) => {
    const currentSession = playSessionIdRef.current;
    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          if (playSessionIdRef.current === currentSession) {
            audio.pause();
            setIsPlaying(false);
          }
        })
        .catch(() => {
          if (playSessionIdRef.current === currentSession) {
            setIsPlaying(false);
          }
        });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  // Play a specific track
  const playTrack = async (track: PlaylistItem, newQueue?: PlaylistItem[], startPositionSeconds?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const sessionId = ++playSessionIdRef.current;
    setIsLoading(true);

    // Clean up previous blob URL if any
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }

    // Resolve stream URL (supports IndexedDB custom uploads, offline downloaded tracks, and direct links)
    let streamUrl = track.audioUrl;
    try {
      if (track.audioUrl.startsWith('blob_key:')) {
        const key = track.audioUrl.replace('blob_key:', '');
        const blobUrl = await getOfflineBlobUrl(key);
        if (blobUrl) {
          streamUrl = blobUrl;
          currentBlobUrlRef.current = blobUrl;
        }
      } else {
        const offlineBlobUrl = await getOfflineBlobUrl(track.id);
        if (offlineBlobUrl) {
          streamUrl = offlineBlobUrl;
          currentBlobUrlRef.current = offlineBlobUrl;
        }
      }
    } catch {
      // Fallback to online url
    }

    // If another play request arrived in the meantime, discard
    if (sessionId !== playSessionIdRef.current) return;

    setCurrentTrack(track);

    // Setup queue
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const index = newQueue.findIndex((t) => t.id === track.id);
      setCurrentQueueIndex(index >= 0 ? index : 0);
    } else if (!queue.some((t) => t.id === track.id)) {
      setQueue((prev) => [track, ...prev]);
      setCurrentQueueIndex(0);
    } else {
      const idx = queue.findIndex((t) => t.id === track.id);
      setCurrentQueueIndex(idx);
    }

    // Set new src
    audio.src = streamUrl;
    audio.playbackRate = playbackRate;

    try {
      if (startPositionSeconds && startPositionSeconds > 0) {
        audio.currentTime = startPositionSeconds;
      }

      const promise = audio.play();
      playPromiseRef.current = promise;

      await promise;
      if (sessionId === playSessionIdRef.current) {
        playPromiseRef.current = null;
        setIsPlaying(true);
        addToHistory(track, startPositionSeconds || 0, track.duration || 0);
      }
    } catch (err: unknown) {
      if (sessionId === playSessionIdRef.current) {
        playPromiseRef.current = null;
        const error = err as { name?: string; message?: string };
        // Ignore AbortError when interrupted by normal user navigation
        if (error && error.name === 'AbortError') {
          return;
        }
        console.warn('Playback notice (stream URL or connection issue):', err);
        setIsPlaying(false);
      }
    } finally {
      if (sessionId === playSessionIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      safePause(audio);
    } else {
      const sessionId = ++playSessionIdRef.current;
      const promise = audio.play();
      playPromiseRef.current = promise;
      promise
        .then(() => {
          if (sessionId === playSessionIdRef.current) {
            playPromiseRef.current = null;
            setIsPlaying(true);
          }
        })
        .catch((err: unknown) => {
          if (sessionId === playSessionIdRef.current) {
            playPromiseRef.current = null;
            const error = err as { name?: string };
            if (error?.name !== 'AbortError') {
              console.warn('Play toggle error:', err);
            }
            setIsPlaying(false);
          }
        });
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(audioRef.current.currentTime);
  };

  const skipForward = (seconds = 10) => {
    if (!audioRef.current) return;
    seek(audioRef.current.currentTime + seconds);
  };

  const skipBackward = (seconds = 10) => {
    if (!audioRef.current) return;
    seek(audioRef.current.currentTime - seconds);
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const nextTrack = () => {
    const q = queueRef.current;
    const currentIdx = currentQueueIndexRef.current;
    const rep = repeatModeRef.current;
    const shuf = isShuffleRef.current;

    if (q.length === 0) return;
    if (rep === 'one' && currentTrackRef.current) {
      seek(0);
      audioRef.current?.play().catch(() => {});
      return;
    }

    let nextIdx = currentIdx + 1;
    if (shuf) {
      nextIdx = Math.floor(Math.random() * q.length);
    } else if (nextIdx >= q.length) {
      if (rep === 'all') {
        nextIdx = 0;
      } else {
        return;
      }
    }

    const next = q[nextIdx];
    if (next) {
      playTrack(next);
      setCurrentQueueIndex(nextIdx);
    }
  };

  const previousTrack = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.currentTime > 3) {
      seek(0);
      return;
    }

    const q = queueRef.current;
    const currentIdx = currentQueueIndexRef.current;
    const rep = repeatModeRef.current;

    if (q.length === 0) return;
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) {
      const prevTrack = q[prevIdx];
      playTrack(prevTrack);
      setCurrentQueueIndex(prevIdx);
    } else if (rep === 'all' && q.length > 0) {
      const lastTrack = q[q.length - 1];
      playTrack(lastTrack);
      setCurrentQueueIndex(q.length - 1);
    } else {
      seek(0);
    }
  };

  const handleTrackEnded = () => {
    if (repeatModeRef.current === 'one' && currentTrackRef.current) {
      seek(0);
      audioRef.current?.play().catch(() => {});
    } else {
      nextTrack();
    }
  };

  const addToQueue = (track: PlaylistItem) => {
    setQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < currentQueueIndex) {
      setCurrentQueueIndex((prev) => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue(currentTrack ? [currentTrack] : []);
    setCurrentQueueIndex(0);
  };

  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    if (minutes === null) {
      setSleepTimerRemainingSeconds(null);
    } else {
      setSleepTimerRemainingSeconds(minutes * 60);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        playbackRate,
        repeatMode,
        isShuffle,
        queue,
        currentQueueIndex,
        isFullScreenPlayerOpen,
        sleepTimerMinutes,
        sleepTimerRemainingSeconds,
        playTrack,
        togglePlay,
        seek,
        skipForward,
        skipBackward,
        nextTrack,
        previousTrack,
        setPlaybackRate,
        toggleRepeatMode,
        toggleShuffle,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setSleepTimer,
        setIsFullScreenPlayerOpen,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
};
