import React, { createContext, useContext, useEffect, useState } from 'react';
import { LESSONS_LIST, RECITERS_LIST, SCHOLARS_LIST, TASBIH_PRESETS } from '../data/islamicData';
import { Lesson, Reciter, ReciterTrack, Scholar, TasbihPreset } from '../types';
import { deleteCustomAudioBlob } from '../utils/audioStorage';

interface CustomContentContextType {
  // Admin Mode
  isAdmin: boolean;
  loginAdmin: (passcode: string) => boolean;
  logoutAdmin: () => void;
  updateAdminPasscode: (oldPass: string, newPass: string) => boolean;

  // Custom Reciters
  customReciters: Reciter[];
  allReciters: Reciter[];
  addCustomReciter: (reciter: Omit<Reciter, 'id'>) => Reciter;
  updateCustomReciter: (id: string, data: Partial<Reciter>) => void;
  deleteCustomReciter: (id: string) => void;

  // Custom Tracks / Surahs / Ayat for Reciters
  customReciterTracks: ReciterTrack[];
  addCustomReciterTrack: (track: Omit<ReciterTrack, 'id'>) => ReciterTrack;
  updateCustomReciterTrack: (id: string, data: Partial<ReciterTrack>) => void;
  deleteCustomReciterTrack: (id: string) => void;
  getTracksForReciter: (reciterId: string) => ReciterTrack[];

  // Custom Lessons
  customLessons: Lesson[];
  allLessons: Lesson[];
  addCustomLesson: (lesson: Omit<Lesson, 'id'>) => Lesson;
  deleteCustomLesson: (id: string) => void;

  allScholars: Scholar[];

  // Custom Tasbih Presets
  customTasbihPresets: TasbihPreset[];
  allTasbihPresets: TasbihPreset[];
  addCustomTasbihPreset: (preset: { title: string; target: number; meaning?: string }) => TasbihPreset;
  deleteCustomTasbihPreset: (id: string) => void;

  // Utility
  cleanAudioUrl: (url: string) => string;
}

const CustomContentContext = createContext<CustomContentContextType | undefined>(undefined);

const STORAGE_CUSTOM_RECITERS = 'noor_custom_reciters_v1';
const STORAGE_CUSTOM_RECITER_TRACKS = 'noor_custom_reciter_tracks_v1';
const STORAGE_CUSTOM_LESSONS = 'noor_custom_lessons_v1';
const STORAGE_CUSTOM_TASBIH = 'noor_custom_tasbih_v1';
const STORAGE_ADMIN_AUTH = 'noor_admin_auth_v1';
const STORAGE_ADMIN_PASS = 'noor_admin_passcode_v1';
const DEFAULT_ADMIN_PASSCODE = '7777';

// Smart normalizer for direct audio streaming
export function cleanAudioUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // If local blob key, keep as is
  if (url.startsWith('blob_key:') || url.startsWith('data:audio')) {
    return url;
  }

  // Google Drive sharing link conversion
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}`;
  }

  // Archive.org /details/ -> /download/
  if (url.includes('archive.org/details/')) {
    url = url.replace('archive.org/details/', 'archive.org/download/');
  }

  // Dropbox direct link
  if (url.includes('dropbox.com') && url.includes('?dl=0')) {
    url = url.replace('?dl=0', '?raw=1');
  }

  return url;
}

export const CustomContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Admin status
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  const [adminPasscode, setAdminPasscode] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_ADMIN_PASS) || DEFAULT_ADMIN_PASSCODE;
    } catch {
      return DEFAULT_ADMIN_PASSCODE;
    }
  });

  // Custom Reciters
  const [customReciters, setCustomReciters] = useState<Reciter[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_CUSTOM_RECITERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Custom Reciter Tracks (recordings, clips, specific surahs or ayat selections)
  const [customReciterTracks, setCustomReciterTracks] = useState<ReciterTrack[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_CUSTOM_RECITER_TRACKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Custom Lessons
  const [customLessons, setCustomLessons] = useState<Lesson[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_CUSTOM_LESSONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Custom Tasbih Presets
  const [customTasbihPresets, setCustomTasbihPresets] = useState<TasbihPreset[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_CUSTOM_TASBIH);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_RECITERS, JSON.stringify(customReciters));
    } catch {}
  }, [customReciters]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_RECITER_TRACKS, JSON.stringify(customReciterTracks));
    } catch {}
  }, [customReciterTracks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_LESSONS, JSON.stringify(customLessons));
    } catch {}
  }, [customLessons]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_TASBIH, JSON.stringify(customTasbihPresets));
    } catch {}
  }, [customTasbihPresets]);

  // Admin Auth functions
  const loginAdmin = (passcode: string): boolean => {
    if (passcode.trim() === adminPasscode.trim()) {
      setIsAdmin(true);
      try {
        localStorage.setItem(STORAGE_ADMIN_AUTH, 'true');
      } catch {}
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem(STORAGE_ADMIN_AUTH);
    } catch {}
  };

  const updateAdminPasscode = (oldPass: string, newPass: string): boolean => {
    if (oldPass.trim() === adminPasscode.trim() && newPass.trim().length >= 4) {
      setAdminPasscode(newPass.trim());
      try {
        localStorage.setItem(STORAGE_ADMIN_PASS, newPass.trim());
      } catch {}
      return true;
    }
    return false;
  };

  // Content Handlers: Reciters
  const addCustomReciter = (reciterData: Omit<Reciter, 'id'>) => {
    const newReciter: Reciter = {
      ...reciterData,
      id: `custom_reciter_${Date.now()}`,
      isCustom: true,
      totalSurahs: reciterData.totalSurahs || 0,
    };
    setCustomReciters((prev) => [newReciter, ...prev]);
    return newReciter;
  };

  const updateCustomReciter = (id: string, data: Partial<Reciter>) => {
    setCustomReciters((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );
  };

  const deleteCustomReciter = (id: string) => {
    setCustomReciters((prev) => prev.filter((r) => r.id !== id));
    // also delete related tracks and clean any stored blobs
    const tracksToDelete = customReciterTracks.filter((t) => t.reciterId === id);
    tracksToDelete.forEach((t) => {
      if (t.audioUrl.startsWith('blob_key:')) {
        deleteCustomAudioBlob(t.audioUrl);
      }
    });
    setCustomReciterTracks((prev) => prev.filter((t) => t.reciterId !== id));
  };

  // Content Handlers: Specific Tracks / Surahs / Selections for Reciters
  const addCustomReciterTrack = (trackData: Omit<ReciterTrack, 'id'>) => {
    const newTrack: ReciterTrack = {
      ...trackData,
      id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      audioUrl: cleanAudioUrl(trackData.audioUrl),
      dateAdded: Date.now(),
    };
    setCustomReciterTracks((prev) => [newTrack, ...prev]);

    // Also update totalSurahs count for the custom reciter if applicable
    setCustomReciters((prev) =>
      prev.map((r) =>
        r.id === trackData.reciterId ? { ...r, totalSurahs: (r.totalSurahs || 0) + 1 } : r
      )
    );

    return newTrack;
  };

  const updateCustomReciterTrack = (id: string, data: Partial<ReciterTrack>) => {
    setCustomReciterTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t))
    );
  };

  const deleteCustomReciterTrack = (id: string) => {
    const track = customReciterTracks.find((t) => t.id === id);
    if (track && track.audioUrl.startsWith('blob_key:')) {
      deleteCustomAudioBlob(track.audioUrl);
    }
    setCustomReciterTracks((prev) => prev.filter((t) => t.id !== id));
    if (track) {
      setCustomReciters((prev) =>
        prev.map((r) =>
          r.id === track.reciterId && r.totalSurahs && r.totalSurahs > 0
            ? { ...r, totalSurahs: r.totalSurahs - 1 }
            : r
        )
      );
    }
  };

  const getTracksForReciter = (reciterId: string) => {
    return customReciterTracks.filter((t) => t.reciterId === reciterId);
  };

  // Content Handlers: Lessons
  const addCustomLesson = (lessonData: Omit<Lesson, 'id'>) => {
    const newLesson: Lesson = {
      ...lessonData,
      id: `custom_lesson_${Date.now()}`,
      audioUrl: cleanAudioUrl(lessonData.audioUrl),
    };
    setCustomLessons((prev) => [newLesson, ...prev]);
    return newLesson;
  };

  const deleteCustomLesson = (id: string) => {
    setCustomLessons((prev) => prev.filter((l) => l.id !== id));
  };

  // Custom Tasbih Presets Handlers
  const addCustomTasbihPreset = (preset: { title: string; target: number; meaning?: string }): TasbihPreset => {
    const newPreset: TasbihPreset = {
      id: `custom_tasbih_${Date.now()}`,
      title: preset.title.trim(),
      target: preset.target > 0 ? preset.target : 33,
      meaning: preset.meaning?.trim() || 'تسبيح مخصص أضافه المستخدم',
      isCustom: true,
    };
    setCustomTasbihPresets((prev) => [...prev, newPreset]);
    return newPreset;
  };

  const deleteCustomTasbihPreset = (id: string) => {
    setCustomTasbihPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const allReciters = [...customReciters, ...RECITERS_LIST];
  const allLessons = [...customLessons, ...LESSONS_LIST];
  const allScholars = SCHOLARS_LIST;
  const allTasbihPresets = [...customTasbihPresets, ...TASBIH_PRESETS];

  return (
    <CustomContentContext.Provider
      value={{
        isAdmin,
        loginAdmin,
        logoutAdmin,
        updateAdminPasscode,
        customReciters,
        allReciters,
        addCustomReciter,
        updateCustomReciter,
        deleteCustomReciter,
        customReciterTracks,
        addCustomReciterTrack,
        updateCustomReciterTrack,
        deleteCustomReciterTrack,
        getTracksForReciter,
        customLessons,
        allLessons,
        addCustomLesson,
        deleteCustomLesson,
        allScholars,
        customTasbihPresets,
        allTasbihPresets,
        addCustomTasbihPreset,
        deleteCustomTasbihPreset,
        cleanAudioUrl,
      }}
    >
      {children}
    </CustomContentContext.Provider>
  );
};

export const useCustomContent = () => {
  const ctx = useContext(CustomContentContext);
  if (!ctx) throw new Error('useCustomContent must be used within CustomContentProvider');
  return ctx;
};
