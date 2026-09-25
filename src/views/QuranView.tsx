import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Download,
  Edit3,
  FileAudio,
  HardDrive,
  Heart,
  ListPlus,
  Loader2,
  Mic,
  Music,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Volume2,
} from 'lucide-react';
import { AddContentModal } from '../components/content/AddContentModal';
import { useAudio } from '../context/AudioContext';
import { useCustomContent } from '../context/CustomContentContext';
import { useLibrary } from '../context/LibraryContext';
import { SURAHS_LIST, getSurahAudioUrl } from '../data/islamicData';
import { PlaylistItem, Reciter, ReciterTrack, Surah } from '../types';
import { formatDuration } from '../utils/formatters';

interface QuranViewProps {
  selectedReciter: Reciter | null;
  onSelectReciter: (reciter: Reciter | null) => void;
}

export const QuranView: React.FC<QuranViewProps> = ({
  selectedReciter,
  onSelectReciter,
}) => {
  const { playTrack, currentTrack, isPlaying, addToQueue } = useAudio();
  const {
    allReciters,
    customReciters,
    customReciterTracks,
    getTracksForReciter,
    deleteCustomReciterTrack,
    deleteCustomReciter,
    isAdmin,
  } = useCustomContent();

  const {
    isFavorite,
    toggleFavorite,
    downloadTrack,
    deleteDownload,
    isDownloaded,
    downloadProgress,
  } = useLibrary();

  // Navigation and filtering states
  const [mainViewTab, setMainViewTab] = useState<'reciters' | 'clips'>('reciters');
  const [reciterSearch, setReciterSearch] = useState('');
  const [clipsSearch, setClipsSearch] = useState('');
  const [surahSearch, setSurahSearch] = useState('');
  const [surahFilter, setSurahFilter] = useState<'all' | 'Meccan' | 'Medinan'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalDefaultMode, setModalDefaultMode] = useState<'reciter_track' | 'reciter' | 'manage'>('reciter_track');
  const [targetSheikhId, setTargetSheikhId] = useState<string | undefined>(undefined);
  const [editingTrack, setEditingTrack] = useState<ReciterTrack | null>(null);

  // Reciter view sub-tab ('recordings' or 'mushaf')
  const [reciterSubTab, setReciterSubTab] = useState<'recordings' | 'mushaf'>('recordings');

  // Filter reciters
  const filteredReciters = allReciters.filter(
    (r) =>
      r.name.includes(reciterSearch) ||
      r.englishName.toLowerCase().includes(reciterSearch.toLowerCase()) ||
      r.rewayah.includes(reciterSearch)
  );

  // Filter all clips / selections
  const filteredClips = customReciterTracks.filter(
    (t) =>
      t.title.includes(clipsSearch) ||
      t.reciterName.includes(clipsSearch) ||
      (t.description && t.description.includes(clipsSearch))
  );

  // Filter surahs for full mushaf
  const filteredSurahs = SURAHS_LIST.filter((s) => {
    const matchesSearch =
      s.name.includes(surahSearch) ||
      s.englishName.toLowerCase().includes(surahSearch.toLowerCase()) ||
      s.number.toString() === surahSearch;
    const matchesFilter =
      surahFilter === 'all' ? true : s.revelationType === surahFilter;
    return matchesSearch && matchesFilter;
  });

  // Helper to build a PlaylistItem from a Surah
  const makeSurahTrack = (reciter: Reciter, surah: Surah): PlaylistItem => ({
    id: `surah_${reciter.id}_${surah.number}`,
    title: `سورة ${surah.name}`,
    subtitle: `${reciter.name} (${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • ${surah.numberOfAyahs} آية)`,
    audioUrl: getSurahAudioUrl(reciter, surah.number),
    imageUrl: reciter.photoUrl,
    category: 'quran',
    reciterOrScholar: reciter.name,
    surahNumber: surah.number,
  });

  // Helper to build a PlaylistItem from a custom ReciterTrack (recording / clip)
  const makeCustomClipTrack = (track: ReciterTrack, reciter?: Reciter): PlaylistItem => {
    const sheikhName = reciter?.name || track.reciterName;
    const sheikhPhoto = reciter?.photoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
    return {
      id: track.id,
      title: track.title,
      subtitle: `${sheikhName}${track.description ? ' • ' + track.description : ''}`,
      audioUrl: track.audioUrl,
      imageUrl: sheikhPhoto,
      category: 'quran',
      reciterOrScholar: sheikhName,
      duration: track.duration,
    };
  };

  const handlePlaySurah = (surah: Surah) => {
    if (!selectedReciter) return;
    const track = makeSurahTrack(selectedReciter, surah);
    const queue = SURAHS_LIST.map((s) => makeSurahTrack(selectedReciter, s));
    playTrack(track, queue);
  };

  const handlePlayAllSurahs = () => {
    if (!selectedReciter || filteredSurahs.length === 0) return;
    const queue = filteredSurahs.map((s) => makeSurahTrack(selectedReciter, s));
    playTrack(queue[0], queue);
  };

  const handlePlayCustomTrack = (track: ReciterTrack, reciter: Reciter, allTracks: ReciterTrack[]) => {
    const playItem = makeCustomClipTrack(track, reciter);
    const queue = allTracks.map((t) => makeCustomClipTrack(t, reciter));
    playTrack(playItem, queue);
  };

  const openAddTrackModalForSheikh = (sheikhId: string) => {
    setEditingTrack(null);
    setTargetSheikhId(sheikhId);
    setModalDefaultMode('reciter_track');
    setShowAddModal(true);
  };

  const openEditTrackModal = (track: ReciterTrack) => {
    setEditingTrack(track);
    setTargetSheikhId(track.reciterId);
    setModalDefaultMode('reciter_track');
    setShowAddModal(true);
  };

  // Reciter custom tracks
  const reciterCustomTracks = selectedReciter ? getTracksForReciter(selectedReciter.id) : [];

  return (
    <div className="pb-28 pt-2 px-4 max-w-4xl mx-auto space-y-4">
      {/* If a Reciter is selected, show their Profile and their Tracks / Full Quran */}
      {selectedReciter ? (
        <div className="space-y-4 animate-fade-in">
          {/* Back button & Action buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => onSelectReciter(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <ArrowRight className="w-4 h-4 ml-0.5" />
              <span>رجوع إلى قائمة القراء</span>
            </button>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddTrackModalForSheikh(selectedReciter.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة تسجيل لهذا الشيخ</span>
                </button>

                {selectedReciter.isCustom && (
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف الشيخ "${selectedReciter.name}" وكافة تسجيلاته؟`)) {
                        deleteCustomReciter(selectedReciter.id);
                        onSelectReciter(null);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                    title="حذف الشيخ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reciter Profile Card */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col sm:flex-row items-center gap-5 text-right">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-lg border border-emerald-500/30 flex-shrink-0">
              <img
                src={selectedReciter.photoUrl}
                alt={selectedReciter.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-right">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                {selectedReciter.rewayah}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {selectedReciter.name}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                {selectedReciter.bio}
              </p>

              <div className="pt-2 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                {reciterCustomTracks.length > 0 && (
                  <button
                    onClick={() => handlePlayCustomTrack(reciterCustomTracks[0], selectedReciter, reciterCustomTracks)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 active:scale-95 transition"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>تشغيل التسجيلات ({reciterCustomTracks.length})</span>
                  </button>
                )}

                {selectedReciter.serverUrl && (
                  <button
                    onClick={handlePlayAllSurahs}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>تشغيل المصحف كاملاً</span>
                  </button>
                )}

                <span className="text-xs text-slate-400">
                  {reciterCustomTracks.length} تلاوة مضافة
                  {selectedReciter.serverUrl ? ' • ١١٤ سورة' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-Tabs: Recordings vs Full Mushaf */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1.5">
            <button
              onClick={() => setReciterSubTab('recordings')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                reciterSubTab === 'recordings'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>المختارات والتسجيلات المضافة</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px]">
                {reciterCustomTracks.length}
              </span>
            </button>

            <button
              onClick={() => setReciterSubTab('mushaf')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                reciterSubTab === 'mushaf'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>المصحف كاملاً (١١٤ سورة)</span>
            </button>
          </div>

          {/* SUB-TAB 1: CUSTOM RECORDINGS & SELECTIONS FOR THIS RECITER */}
          {reciterSubTab === 'recordings' && (
            <div className="space-y-3">
              {reciterCustomTracks.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <FileAudio className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-white">لا توجد تسجيلات مضافة لهذا الشيخ بعد</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    يمكنك كمسؤول إضافة مقاطع صوتية، آيات مختارة، تلاوات نادرة، أو سور بصوته مباشرة من هاتفك أو برابط MP3.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => openAddTrackModalForSheikh(selectedReciter.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة أول تسجيل لهذا الشيخ</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {reciterCustomTracks.map((track) => {
                    const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                    const downloaded = isDownloaded(track.id);
                    const dlProgress = downloadProgress[track.id];
                    const fav = isFavorite(track.id);
                    const playItem = makeCustomClipTrack(track, selectedReciter);

                    return (
                      <div
                        key={track.id}
                        onClick={() => handlePlayCustomTrack(track, selectedReciter, reciterCustomTracks)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                          isThisPlaying
                            ? 'bg-emerald-950/70 border-emerald-500/50 shadow-md shadow-emerald-950'
                            : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                              isThisPlaying
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-emerald-400 border border-slate-700'
                            }`}
                          >
                            {isThisPlaying ? (
                              <Volume2 className="w-5 h-5 animate-pulse" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 text-right">
                            <h4 className="text-sm font-bold text-white truncate">
                              {track.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span>{selectedReciter.name}</span>
                              {track.description && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[180px]">{track.description}</span>
                                </>
                              )}
                              {track.duration && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 font-mono text-[10px]">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    {formatDuration(track.duration)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-1 flex-shrink-0 mr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Admin: Edit Track */}
                          {isAdmin && (
                            <button
                              onClick={() => openEditTrackModal(track)}
                              title="تعديل اسم أو رابط هذا المقطع"
                              className="p-2 text-slate-400 hover:text-amber-400 transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Admin: Delete Track */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف مقطع "${track.title}"؟`)) {
                                  deleteCustomReciterTrack(track.id);
                                }
                              }}
                              title="حذف هذا المقطع"
                              className="p-2 text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Favorite */}
                          <button
                            onClick={() => toggleFavorite(playItem)}
                            title="المفضلة"
                            className="p-2 text-slate-400 hover:text-white transition"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                fav ? 'text-rose-500 fill-rose-500' : ''
                              }`}
                            />
                          </button>

                          {/* Offline Download */}
                          <button
                            onClick={async () => {
                              if (downloaded) {
                                await deleteDownload(track.id);
                              } else {
                                await downloadTrack(playItem);
                              }
                            }}
                            title={downloaded ? 'محمّل في جهازك' : 'تحميل للأوفلاين'}
                            className={`p-2 transition ${
                              downloaded
                                ? 'text-teal-400'
                                : typeof dlProgress === 'number'
                                ? 'text-amber-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {typeof dlProgress === 'number' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : downloaded ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>

                          {/* Add to Queue */}
                          <button
                            onClick={() => addToQueue(playItem)}
                            title="إضافة لقائمة الانتظار"
                            className="p-2 text-slate-400 hover:text-white transition"
                          >
                            <ListPlus className="w-4 h-4" />
                          </button>

                          {/* Play Button */}
                          <button
                            onClick={() => handlePlayCustomTrack(track, selectedReciter, reciterCustomTracks)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition ml-1 ${
                              isThisPlaying
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: FULL MUSHAF (114 SURAHS) */}
          {reciterSubTab === 'mushaf' && (
            <div className="space-y-3">
              {!selectedReciter.serverUrl && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-right text-xs text-amber-300">
                  تنبيه: هذا الشيخ مضاف كقارئ لتسجيلات خاصة ولا يحتوي على خادم مصحف كامل ١١٤ سورة تلقائي. يمكنك إضافة سور محددة أو آيات له من تبويب "المختارات والتسجيلات المضافة".
                </div>
              )}

              {/* Surah Search & Filter tabs */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={surahSearch}
                    onChange={(e) => setSurahSearch(e.target.value)}
                    placeholder="ابحث عن اسم السورة أو رقمها..."
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex-shrink-0">
                  <button
                    onClick={() => setSurahFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      surahFilter === 'all'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    الكل (114)
                  </button>
                  <button
                    onClick={() => setSurahFilter('Meccan')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      surahFilter === 'Meccan'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    مكية
                  </button>
                  <button
                    onClick={() => setSurahFilter('Medinan')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      surahFilter === 'Medinan'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    مدنية
                  </button>
                </div>
              </div>

              {/* Surahs List */}
              <div className="space-y-1.5">
                {filteredSurahs.map((surah) => {
                  const trackId = `surah_${selectedReciter.id}_${surah.number}`;
                  const isThisTrackPlaying =
                    currentTrack?.id === trackId && isPlaying;
                  const downloaded = isDownloaded(trackId);
                  const dlProgress = downloadProgress[trackId];
                  const fav = isFavorite(trackId);

                  return (
                    <div
                      key={surah.number}
                      onClick={() => handlePlaySurah(surah)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                        isThisTrackPlaying
                          ? 'bg-emerald-950/70 border-emerald-500/50 shadow-md shadow-emerald-950'
                          : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80'
                      }`}
                    >
                      {/* Number & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                            isThisTrackPlaying
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-emerald-400 border border-slate-700'
                          }`}
                        >
                          {isThisTrackPlaying ? (
                            <Volume2 className="w-4 h-4 animate-pulse" />
                          ) : (
                            surah.number
                          )}
                        </div>

                        <div className="min-w-0 flex-1 text-right">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white font-quran text-base">
                              سورة {surah.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-sans">
                              ({surah.englishName})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} •{' '}
                            {surah.numberOfAyahs} آية
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div
                        className="flex items-center gap-1 flex-shrink-0 mr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Favorite */}
                        <button
                          onClick={() =>
                            toggleFavorite(makeSurahTrack(selectedReciter, surah))
                          }
                          title="المفضلة"
                          className="p-2 text-slate-400 hover:text-white transition"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              fav ? 'text-rose-500 fill-rose-500' : ''
                            }`}
                          />
                        </button>

                        {/* Offline Download */}
                        <button
                          onClick={async () => {
                            if (downloaded) {
                              await deleteDownload(trackId);
                            } else {
                              await downloadTrack(
                                makeSurahTrack(selectedReciter, surah)
                              );
                            }
                          }}
                          title={downloaded ? 'محمّل في جهازك' : 'تحميل للأوفلاين'}
                          className={`p-2 transition ${
                            downloaded
                              ? 'text-teal-400'
                              : typeof dlProgress === 'number'
                              ? 'text-amber-400'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {typeof dlProgress === 'number' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : downloaded ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        {/* Add to Queue */}
                        <button
                          onClick={() =>
                            addToQueue(makeSurahTrack(selectedReciter, surah))
                          }
                          title="إضافة لقائمة الانتظار"
                          className="p-2 text-slate-400 hover:text-white transition"
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>

                        {/* Play Button */}
                        <button
                          onClick={() => handlePlaySurah(surah)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition ml-1 ${
                            isThisTrackPlaying
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Reciters Catalog & Featured Selections Main View */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-right">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingTrack(null);
                    setTargetSheikhId(undefined);
                    setModalDefaultMode('reciter_track');
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مقطع / سورة</span>
                </button>

                <button
                  onClick={() => {
                    setModalDefaultMode('reciter');
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-bold text-xs shadow-md active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة قارئ</span>
                </button>
              </div>
            ) : (
              <div />
            )}

            <div>
              <h2 className="text-xl font-black text-white">القرآن الكريم والتلاوات</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تصفح كبار القراء، السور، والمختارات الصوتية المسجلة
              </p>
            </div>
          </div>

          {/* Main View Tabs: Reciters Catalog vs Audio Selections & Clips */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1.5">
            <button
              onClick={() => setMainViewTab('reciters')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                mainViewTab === 'reciters'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>قراء القرآن الكريم ({allReciters.length})</span>
            </button>

            <button
              onClick={() => setMainViewTab('clips')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                mainViewTab === 'clips'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>مختارات وتلاوات صوتية ({customReciterTracks.length})</span>
            </button>
          </div>

          {/* VIEW 1: RECITERS GRID */}
          {mainViewTab === 'reciters' && (
            <div className="space-y-3">
              {/* Search Reciters */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={reciterSearch}
                  onChange={(e) => setReciterSearch(e.target.value)}
                  placeholder="ابحث عن قارئ أو رواية أو شيخ مضاف..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Reciters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {filteredReciters.map((reciter) => {
                  const tracksCount = getTracksForReciter(reciter.id).length;

                  return (
                    <div
                      key={reciter.id}
                      onClick={() => onSelectReciter(reciter)}
                      className="group flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 shadow-md cursor-pointer transition active:scale-[0.99] text-right"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700 group-hover:scale-105 transition duration-300">
                        <img
                          src={reciter.photoUrl}
                          alt={reciter.name}
                          className="w-full h-full object-cover"
                        />
                        {reciter.isCustom && (
                          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-500/90 text-slate-950 font-bold text-[9px]">
                            مخصص
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition truncate">
                            {reciter.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-emerald-400/90 truncate mt-0.5">
                          {reciter.rewayah}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400">
                            {tracksCount > 0 ? `${tracksCount} مقطع مضاف` : (reciter.serverUrl ? '١١٤ سورة' : 'شيخ مسجل')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: ALL CUSTOM RECORDINGS & AUDIO CLIPS */}
          {mainViewTab === 'clips' && (
            <div className="space-y-3">
              {/* Search clips */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={clipsSearch}
                  onChange={(e) => setClipsSearch(e.target.value)}
                  placeholder="ابحث في التلاوات والمقاطع المسجلة (مثل: الفرقان، تراويح...)"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {filteredClips.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <Sparkles className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-white">لا توجد تسجيلات أو مختارات بعد</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    يمكن للمشرف إضافة تسجيلات قرآنية، آيات مختارة (مثل آيات من سورة الفرقان)، أو مقاطع نادرة لشيوخ وقراء مختلفين مباشرة.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingTrack(null);
                        setTargetSheikhId(undefined);
                        setModalDefaultMode('reciter_track');
                        setShowAddModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة أول تلاوة / مقطع</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClips.map((track) => {
                    const sheikh = allReciters.find((r) => r.id === track.reciterId);
                    const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                    const downloaded = isDownloaded(track.id);
                    const dlProgress = downloadProgress[track.id];
                    const fav = isFavorite(track.id);
                    const playItem = makeCustomClipTrack(track, sheikh);

                    return (
                      <div
                        key={track.id}
                        onClick={() => {
                          const queue = filteredClips.map((c) => {
                            const sh = allReciters.find((r) => r.id === c.reciterId);
                            return makeCustomClipTrack(c, sh);
                          });
                          playTrack(playItem, queue);
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                          isThisPlaying
                            ? 'bg-emerald-950/70 border-emerald-500/50 shadow-md shadow-emerald-950'
                            : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                              isThisPlaying
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-emerald-400 border border-slate-700'
                            }`}
                          >
                            {isThisPlaying ? (
                              <Volume2 className="w-5 h-5 animate-pulse" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 text-right">
                            <h4 className="text-sm font-bold text-white truncate">
                              {track.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span className="text-emerald-400 font-semibold">{track.reciterName}</span>
                              {track.description && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]">{track.description}</span>
                                </>
                              )}
                              {track.duration && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px]">
                                    {formatDuration(track.duration)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-1 flex-shrink-0 mr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Admin: Edit Track */}
                          {isAdmin && (
                            <button
                              onClick={() => openEditTrackModal(track)}
                              title="تعديل هذا المقطع"
                              className="p-2 text-slate-400 hover:text-amber-400 transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Admin: Delete Track */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف مقطع "${track.title}"؟`)) {
                                  deleteCustomReciterTrack(track.id);
                                }
                              }}
                              title="حذف هذا المقطع"
                              className="p-2 text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Favorite */}
                          <button
                            onClick={() => toggleFavorite(playItem)}
                            title="المفضلة"
                            className="p-2 text-slate-400 hover:text-white transition"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                fav ? 'text-rose-500 fill-rose-500' : ''
                              }`}
                            />
                          </button>

                          {/* Offline Download */}
                          <button
                            onClick={async () => {
                              if (downloaded) {
                                await deleteDownload(track.id);
                              } else {
                                await downloadTrack(playItem);
                              }
                            }}
                            title={downloaded ? 'محمّل في جهازك' : 'تحميل للأوفلاين'}
                            className={`p-2 transition ${
                              downloaded
                                ? 'text-teal-400'
                                : typeof dlProgress === 'number'
                                ? 'text-amber-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {typeof dlProgress === 'number' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : downloaded ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>

                          {/* Play Button */}
                          <button
                            onClick={() => {
                              const queue = filteredClips.map((c) => {
                                const sh = allReciters.find((r) => r.id === c.reciterId);
                                return makeCustomClipTrack(c, sh);
                              });
                              playTrack(playItem, queue);
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition ml-1 ${
                              isThisPlaying
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Content Modal */}
      {isAdmin && (
        <AddContentModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingTrack(null);
          }}
          defaultMode={modalDefaultMode}
          targetReciterId={targetSheikhId}
          editingTrack={editingTrack}
        />
      )}
    </div>
  );
};
