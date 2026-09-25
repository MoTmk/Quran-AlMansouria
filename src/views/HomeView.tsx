import React from 'react';
import {
  BookOpen,
  ChevronLeft,
  GraduationCap,
  Headphones,
  MoonStar,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useCustomContent } from '../context/CustomContentContext';
import { useLibrary } from '../context/LibraryContext';
import { ADHKAR_LIST, SCHOLARS_LIST, SURAHS_LIST, getSurahAudioUrl } from '../data/islamicData';
import { NavigationTab } from '../components/layout/BottomNav';
import { PlaylistItem, Reciter, Scholar } from '../types';
import { formatDuration } from '../utils/formatters';

interface HomeViewProps {
  onNavigateTab: (tab: NavigationTab) => void;
  onSelectReciter: (reciter: Reciter) => void;
  onSelectScholar: (scholar: Scholar) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateTab,
  onSelectReciter,
  onSelectScholar,
}) => {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const { continueListening } = useLibrary();
  const { allReciters, allLessons } = useCustomContent();

  // Handle continuing listening
  const handleResumeContinue = () => {
    if (!continueListening) return;
    playTrack(continueListening, undefined, continueListening.progressSeconds);
  };

  // Quick play surah (e.g. Al-Fatihah or Al-Kahf)
  const handlePlayQuickSurah = (surahNumber: number) => {
    const surah = SURAHS_LIST.find((s) => s.number === surahNumber);
    const reciter = allReciters[0]; // first available reciter
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
    <div className="space-y-6 pb-28 pt-2 px-4 max-w-4xl mx-auto">
      {/* Daily Spiritual Inspiration Card (Centered & Polished) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-teal-950 p-6 sm:p-7 shadow-2xl border border-emerald-500/30 text-center">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center space-y-3 max-w-lg mx-auto">
          {/* Centered Badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-bold border border-emerald-400/25 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>آية وتأمل اليوم</span>
          </span>

          {/* Centered Quranic Verse */}
          <p className="text-xl sm:text-2xl md:text-3xl font-quran font-semibold text-slate-50 leading-loose tracking-wide pt-1 drop-shadow-sm">
            ﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾
          </p>

          {/* Centered Verse Reference with Ornamental accents */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="w-6 h-px bg-emerald-500/40" />
            <p className="text-xs font-semibold text-emerald-300/90">
              سورة الرعد • الآية ٢٨
            </p>
            <span className="w-6 h-px bg-emerald-500/40" />
          </div>
        </div>
      </div>

      {/* Continue Listening Section (Spotify-style) */}
      {continueListening && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">استئناف من حيث توقفت</span>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>متابعة الاستماع</span>
            </h3>
          </div>

          <div
            onClick={handleResumeContinue}
            className="group relative overflow-hidden rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 p-3.5 flex items-center justify-between shadow-lg cursor-pointer transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700 shadow">
                <img
                  src={continueListening.imageUrl || '/icon.svg'}
                  alt={continueListening.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition">
                  {continueListening.title}
                </h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {continueListening.reciterOrScholar}
                </p>
                <div className="w-36 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${
                        continueListening.durationSeconds > 0
                          ? (continueListening.progressSeconds / continueListening.durationSeconds) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResumeContinue();
              }}
              className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-105 active:scale-95 transition flex-shrink-0 ml-2"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('quran')}
          className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 shadow-md transition active:scale-95 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition shadow">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white mt-2.5">القرآن الكريم</span>
          <span className="text-[11px] text-slate-400">114 سورة كاملة</span>
        </button>

        <button
          onClick={() => onNavigateTab('lessons')}
          className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/40 shadow-md transition active:scale-95 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition shadow">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white mt-2.5">الدروس والمحاضرات</span>
          <span className="text-[11px] text-slate-400">سلاسل العلماء</span>
        </button>

        <button
          onClick={() => onNavigateTab('adhkar')}
          className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 shadow-md transition active:scale-95 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition shadow">
            <MoonStar className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white mt-2.5">أذكار المسلم</span>
          <span className="text-[11px] text-slate-400">الصباح والمساء</span>
        </button>

        <button
          onClick={() => onNavigateTab('adhkar')}
          className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 shadow-md transition active:scale-95 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition shadow">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white mt-2.5">السبحة الإلكترونية</span>
          <span className="text-[11px] text-slate-400">عداد تفاعلي</span>
        </button>
      </div>

      {/* Featured Reciters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigateTab('quran')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <h3 className="text-base font-bold text-white">كبار القراء والمشايخ</h3>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
          {allReciters.map((reciter) => (
            <div
              key={reciter.id}
              onClick={() => onSelectReciter(reciter)}
              className="flex-shrink-0 w-32 group cursor-pointer text-center"
            >
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/80 shadow-md group-hover:border-emerald-500/60 transition">
                <img
                  src={reciter.photoUrl}
                  alt={reciter.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 right-2 text-[10px] font-semibold text-emerald-300 bg-slate-950/80 px-1.5 py-0.5 rounded">
                  {reciter.totalSurahs} سورة
                </span>
              </div>
              <h4 className="text-xs font-bold text-white mt-2 truncate group-hover:text-emerald-400 transition">
                {reciter.name}
              </h4>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {reciter.rewayah}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Lessons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigateTab('lessons')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>المزيد من الدروس</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <h3 className="text-base font-bold text-white">دروس ومحاضرات مختارة</h3>
        </div>

        <div className="space-y-2">
          {allLessons.slice(0, 4).map((lesson) => {
            const isThisTrackPlaying =
              currentTrack?.id === lesson.id && isPlaying;

            return (
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
                    lessonId: lesson.id,
                  };
                  playTrack(track);
                }}
                className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                  isThisTrackPlaying
                    ? 'bg-emerald-950/60 border-emerald-500/50'
                    : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 flex-shrink-0 border border-slate-700">
                    {isThisTrackPlaying ? (
                      <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                    ) : (
                      <Headphones className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {lesson.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {lesson.scholarName} • <span className="text-emerald-400">{lesson.series}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDuration(lesson.duration)}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 flex items-center justify-center transition">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Surahs (Al-Fatihah, Al-Kahf, Al-Mulk, Yasin, Al-Baqarah) */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white text-right">سُوَر مباركة سريعة التشغيل</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { num: 1, label: 'سورة الفاتحة' },
            { num: 18, label: 'سورة الكهف' },
            { num: 67, label: 'سورة الملك' },
            { num: 36, label: 'سورة يس' },
            { num: 55, label: 'سورة الرحمن' },
            { num: 56, label: 'سورة الواقعة' },
          ].map((item) => (
            <button
              key={item.num}
              onClick={() => handlePlayQuickSurah(item.num)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 transition active:scale-95 text-right"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">
                {item.num}
              </div>
              <span className="text-xs font-bold text-white truncate mr-2">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
