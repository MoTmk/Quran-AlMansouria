import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  MoonStar,
  Play,
  Search as SearchIcon,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useCustomContent } from '../context/CustomContentContext';
import {
  ADHKAR_LIST,
  SCHOLARS_LIST,
  SURAHS_LIST,
  getSurahAudioUrl,
} from '../data/islamicData';
import { PlaylistItem, Reciter, Scholar } from '../types';

interface SearchViewProps {
  onClose: () => void;
  onSelectReciter: (reciter: Reciter) => void;
  onSelectScholar: (scholar: Scholar) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  onClose,
  onSelectReciter,
  onSelectScholar,
}) => {
  const { playTrack } = useAudio();
  const { allReciters, allLessons, allScholars, customReciterTracks } = useCustomContent();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'quran' | 'clips' | 'reciters' | 'lessons' | 'scholars' | 'adhkar'>('all');

  const cleanQuery = query.trim().toLowerCase();

  // Search Surahs
  const matchedSurahs = SURAHS_LIST.filter(
    (s) =>
      s.name.includes(cleanQuery) ||
      s.englishName.toLowerCase().includes(cleanQuery) ||
      s.number.toString() === cleanQuery
  );

  // Search Custom Tracks / Clips
  const matchedClips = customReciterTracks.filter(
    (t) =>
      t.title.includes(cleanQuery) ||
      t.reciterName.includes(cleanQuery) ||
      (t.description && t.description.includes(cleanQuery))
  );

  // Search Reciters
  const matchedReciters = allReciters.filter(
    (r) =>
      r.name.includes(cleanQuery) ||
      r.englishName.toLowerCase().includes(cleanQuery) ||
      r.rewayah.includes(cleanQuery)
  );

  // Search Lessons
  const matchedLessons = allLessons.filter(
    (l) =>
      l.title.includes(cleanQuery) ||
      l.series.includes(cleanQuery) ||
      l.scholarName.includes(cleanQuery)
  );

  // Search Scholars
  const matchedScholars = allScholars.filter(
    (s) => s.name.includes(cleanQuery) || s.bio.includes(cleanQuery)
  );

  // Search Adhkar
  const matchedAdhkar = ADHKAR_LIST.filter(
    (a) => a.text.includes(cleanQuery) || a.categoryTitle.includes(cleanQuery)
  );

  const totalResults =
    matchedSurahs.length +
    matchedClips.length +
    matchedReciters.length +
    matchedLessons.length +
    matchedScholars.length +
    matchedAdhkar.length;

  const handlePlaySurah = (surahNumber: number) => {
    const surah = SURAHS_LIST.find((s) => s.number === surahNumber);
    const reciter = allReciters[0];
    if (!surah || !reciter) return;

    const track: PlaylistItem = {
      id: `surah_${reciter.id}_${surah.number}`,
      title: `سورة ${surah.name}`,
      subtitle: `${reciter.name} (${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'})`,
      audioUrl: getSurahAudioUrl(reciter, surah.number),
      imageUrl: reciter.photoUrl,
      category: 'quran',
      reciterOrScholar: reciter.name,
      surahNumber: surah.number,
    };
    playTrack(track);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl flex flex-col p-4 text-right overflow-y-auto">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto w-full pt-safe space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن سورة، قارئ، درس، عالم، أو دعاء..."
              autoFocus
              className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pr-12 pl-10 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-xl"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold"
          >
            إغلاق
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all' as const, label: 'الكل' },
            { id: 'quran' as const, label: 'السور' },
            { id: 'clips' as const, label: 'التسجيلات والمختارات' },
            { id: 'reciters' as const, label: 'القراء' },
            { id: 'lessons' as const, label: 'الدروس' },
            { id: 'scholars' as const, label: 'العلماء' },
            { id: 'adhkar' as const, label: 'الأذكار' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filterType === pill.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="space-y-6 pt-2 pb-24">
          {!cleanQuery ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-emerald-400/80 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">ابحث في كافة المحتوى الإسلامي</p>
              <p className="text-xs text-slate-500">
                جرّب البحث عن: "سورة الكهف"، "عبد الباسط"، "عمر عبد الكافي"، "الصباح"
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-bold text-slate-300">لم يتم العثور على نتائج تطابق "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">تأكد من كتابة الكلمات بشكل صحيح</p>
            </div>
          ) : (
            <>
              {/* Surahs Section */}
              {(filterType === 'all' || filterType === 'quran') && matchedSurahs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>سُوَر القرآن الكريم ({matchedSurahs.length})</span>
                  </h3>
                  <div className="space-y-1.5">
                    {matchedSurahs.map((surah) => (
                      <div
                        key={surah.number}
                        onClick={() => {
                          handlePlaySurah(surah.number);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center">
                            {surah.number}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white font-quran">
                              سورة {surah.name} ({surah.englishName})
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.numberOfAyahs} آية
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Clips & Recordings Section */}
              {(filterType === 'all' || filterType === 'clips') && matchedClips.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>التسجيلات والمختارات الصوتية ({matchedClips.length})</span>
                  </h3>
                  <div className="space-y-1.5">
                    {matchedClips.map((clip) => {
                      const sheikh = allReciters.find((r) => r.id === clip.reciterId);
                      const playItem: PlaylistItem = {
                        id: clip.id,
                        title: clip.title,
                        subtitle: `${clip.reciterName}${clip.description ? ' • ' + clip.description : ''}`,
                        audioUrl: clip.audioUrl,
                        imageUrl: sheikh?.photoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
                        category: 'quran',
                        reciterOrScholar: clip.reciterName,
                        duration: clip.duration,
                      };

                      return (
                        <div
                          key={clip.id}
                          onClick={() => {
                            playTrack(playItem);
                            onClose();
                          }}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1 text-right">
                              <h4 className="text-sm font-bold text-white truncate">
                                {clip.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {clip.reciterName} {clip.description ? `• ${clip.description}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 mr-2">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reciters Section */}
              {(filterType === 'all' || filterType === 'reciters') && matchedReciters.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>القراء ({matchedReciters.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedReciters.map((reciter) => (
                      <div
                        key={reciter.id}
                        onClick={() => {
                          onSelectReciter(reciter);
                          onClose();
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 cursor-pointer transition"
                      >
                        <img
                          src={reciter.photoUrl}
                          alt={reciter.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white truncate">{reciter.name}</h4>
                          <p className="text-[11px] text-emerald-400 truncate">{reciter.rewayah}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lessons Section */}
              {(filterType === 'all' || filterType === 'lessons') && matchedLessons.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                    <span>الدروس والمحاضرات ({matchedLessons.length})</span>
                  </h3>
                  <div className="space-y-1.5">
                    {matchedLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          const scholar = SCHOLARS_LIST.find((s) => s.id === lesson.scholarId);
                          const track: PlaylistItem = {
                            id: lesson.id,
                            title: lesson.title,
                            subtitle: `${lesson.scholarName} • ${lesson.series}`,
                            audioUrl: lesson.audioUrl,
                            imageUrl: scholar?.photoUrl,
                            category: 'lesson',
                            reciterOrScholar: lesson.scholarName,
                            duration: lesson.duration,
                          };
                          playTrack(track);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 cursor-pointer transition"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">{lesson.title}</h4>
                          <p className="text-[11px] text-teal-400 truncate mt-0.5">
                            {lesson.scholarName} • {lesson.series}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center flex-shrink-0 mr-2">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scholars Section */}
              {(filterType === 'all' || filterType === 'scholars') && matchedScholars.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    <span>العلماء والمشايخ ({matchedScholars.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedScholars.map((scholar) => (
                      <div
                        key={scholar.id}
                        onClick={() => {
                          onSelectScholar(scholar);
                          onClose();
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 cursor-pointer transition"
                      >
                        <img
                          src={scholar.photoUrl}
                          alt={scholar.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white truncate">{scholar.name}</h4>
                          <p className="text-[11px] text-teal-400 truncate">{scholar.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adhkar Section */}
              {(filterType === 'all' || filterType === 'adhkar') && matchedAdhkar.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <MoonStar className="w-3.5 h-3.5 text-amber-400" />
                    <span>الأذكار ({matchedAdhkar.length})</span>
                  </h3>
                  <div className="space-y-1.5">
                    {matchedAdhkar.map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1"
                      >
                        <span className="text-[10px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded font-semibold">
                          {d.categoryTitle}
                        </span>
                        <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                          {d.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
