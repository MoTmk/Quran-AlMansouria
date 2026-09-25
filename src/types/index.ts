export type ContentType = 'quran' | 'lesson' | 'adhkar';

export interface PlaylistItem {
  id: string;
  title: string;
  subtitle: string;
  audioUrl: string;
  imageUrl?: string;
  duration?: number;
  category: ContentType;
  reciterOrScholar: string;
  surahNumber?: number;
  lessonId?: string;
  dhikrId?: string;
}

export interface Reciter {
  id: string;
  name: string;
  englishName: string;
  rewayah: string;
  serverUrl?: string; // Archive.org or CDN base url
  photoUrl: string;
  bio: string;
  totalSurahs?: number;
  isCustom?: boolean;
}

export interface ReciterTrack {
  id: string;
  reciterId: string;
  reciterName: string;
  title: string; // e.g. "آيات من سورة الفرقان (٦٣ - ٧٧)"
  audioUrl: string;
  duration?: number; // in seconds
  description?: string;
  dateAdded?: number;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Scholar {
  id: string;
  name: string;
  title: string;
  photoUrl: string;
  bio: string;
  lessonsCount: number;
  topics: string[];
}

export interface Lesson {
  id: string;
  scholarId: string;
  scholarName: string;
  title: string;
  series: string;
  duration: number; // in seconds
  audioUrl: string;
  description: string;
  dateAdded?: string;
}

export type DhikrCategory = 'morning' | 'evening' | 'sleep' | 'prayer' | 'ruqyah';

export interface DhikrItem {
  id: string;
  category: DhikrCategory;
  categoryTitle: string;
  text: string;
  count: number;
  reward?: string;
  audioUrl?: string;
  duration?: number;
}

export interface UserPlaylist {
  id: string;
  name: string;
  createdAt: number;
  items: PlaylistItem[];
}

export interface HistoryItem extends PlaylistItem {
  playedAt: number;
  progressSeconds: number;
  durationSeconds: number;
}

export interface DownloadedTrack extends PlaylistItem {
  blobKey: string;
  sizeBytes: number;
  downloadedAt: number;
}

export interface TasbihPreset {
  id: string;
  title: string;
  target: number;
  meaning: string;
  isCustom?: boolean;
}

