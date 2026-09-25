import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Download,
  GraduationCap,
  Heart,
  ListPlus,
  Loader2,
  Play,
  Plus,
  Search,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { AddContentModal } from '../components/content/AddContentModal';
import { useAudio } from '../context/AudioContext';
import { useCustomContent } from '../context/CustomContentContext';
import { useLibrary } from '../context/LibraryContext';
import { SCHOLARS_LIST } from '../data/islamicData';
import { Lesson, PlaylistItem, Scholar } from '../types';
import { formatDuration } from '../utils/formatters';

interface LessonsViewProps {
  selectedScholar: Scholar | null;
  onSelectScholar: (scholar: Scholar | null) => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({
  selectedScholar,
  onSelectScholar,
}) => {
  const { playTrack, currentTrack, isPlaying, addToQueue } = useAudio();
  const { allLessons, allScholars, isAdmin } = useCustomContent();
  const {
    isFavorite,
    toggleFavorite,
    downloadTrack,
    deleteDownload,
    isDownloaded,
    downloadProgress,
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const makeLessonTrack = (lesson: Lesson, scholar?: Scholar): PlaylistItem => ({
    id: lesson.id,
    title: lesson.title,
    subtitle: `${lesson.scholarName} • ${lesson.series}`,
    audioUrl: lesson.audioUrl,
    imageUrl: scholar?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    category: 'lesson',
    reciterOrScholar: lesson.scholarName,
    duration: lesson.duration,
    lessonId: lesson.id,
  });

  const handlePlayLesson = (lesson: Lesson, scholar?: Scholar) => {
    const track = makeLessonTrack(lesson, scholar);
    const relatedLessons = allLessons.filter(
      (l) => l.scholarId === lesson.scholarId
    ).map((l) => makeLessonTrack(l, scholar));
    playTrack(track, relatedLessons);
  };

  // If a scholar is selected, show their lectures
  const scholarLessons = selectedScholar
    ? allLessons.filter((l) => l.scholarId === selectedScholar.id)
    : allLessons;

  const filteredLessons = scholarLessons.filter((l) => {
    const matchesSearch =
      l.title.includes(searchQuery) ||
      l.series.includes(searchQuery) ||
      l.scholarName.includes(searchQuery) ||
      l.description.includes(searchQuery);
    const matchesTopic =
      selectedTopic === 'all' ? true : l.series === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  // Extract unique series/topics
  const availableSeries = Array.from(
    new Set(scholarLessons.map((l) => l.series))
  );

  return (
    <div className="pb-28 pt-2 px-4 max-w-4xl mx-auto space-y-4 text-right">
      {selectedScholar ? (
        <div className="space-y-4 animate-fade-in">
          {/* Back button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => onSelectScholar(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <ArrowRight className="w-4 h-4 ml-0.5" />
              <span>قائمة العلماء</span>
            </button>
          </div>

          {/* Scholar Profile Card */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-lg border border-teal-500/30 flex-shrink-0">
              <img
                src={selectedScholar.photoUrl}
                alt={selectedScholar.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-right">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[11px] font-semibold">
                {selectedScholar.title}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {selectedScholar.name}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                {selectedScholar.bio}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1 justify-center sm:justify-start">
                {selectedScholar.topics.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Series Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedTopic === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              كافة السلاسل ({scholarLessons.length})
            </button>
            {availableSeries.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedTopic(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedTopic === s
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Lessons List */}
          <div className="space-y-2">
            {filteredLessons.map((lesson) => {
              const trackId = lesson.id;
              const isThisTrackPlaying =
                currentTrack?.id === trackId && isPlaying;
              const downloaded = isDownloaded(trackId);
              const dlProgress = downloadProgress[trackId];
              const fav = isFavorite(trackId);

              return (
                <div
                  key={lesson.id}
                  onClick={() => handlePlayLesson(lesson, selectedScholar)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 ${
                    isThisTrackPlaying
                      ? 'bg-teal-950/60 border-teal-500/50 shadow-md shadow-teal-950'
                      : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400 flex-shrink-0 border border-slate-700">
                        {isThisTrackPlaying ? (
                          <Volume2 className="w-5 h-5 text-teal-400 animate-pulse" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/20 font-semibold">
                          {lesson.series}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1 truncate">
                          {lesson.title}
                        </h4>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Favorite */}
                      <button
                        onClick={() =>
                          toggleFavorite(
                            makeLessonTrack(lesson, selectedScholar)
                          )
                        }
                        className="p-1.5 text-slate-400 hover:text-white transition"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            fav ? 'text-rose-500 fill-rose-500' : ''
                          }`}
                        />
                      </button>

                      {/* Download */}
                      <button
                        onClick={async () => {
                          if (downloaded) {
                            await deleteDownload(trackId);
                          } else {
                            await downloadTrack(
                              makeLessonTrack(lesson, selectedScholar)
                            );
                          }
                        }}
                        className={`p-1.5 transition ${
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

                      {/* Add to queue */}
                      <button
                        onClick={() =>
                          addToQueue(makeLessonTrack(lesson, selectedScholar))
                        }
                        className="p-1.5 text-slate-400 hover:text-white transition"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          handlePlayLesson(lesson, selectedScholar)
                        }
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-200 flex items-center justify-center transition mr-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {lesson.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                    <span>المدة: {formatDuration(lesson.duration)}</span>
                    <span className="text-teal-400/90 font-sans">بث مباشر مجاني</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Scholars Catalog Overview */
        <div className="space-y-5">
          <div className="flex items-center justify-between text-right">
            {isAdmin ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة درس (مشرف)</span>
              </button>
            ) : (
              <div />
            )}

            <div>
              <h2 className="text-xl font-black text-white">الدروس والمحاضرات</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                محاضرات وسلاسل إيمانية صوتية لكبار العلماء والدعاة
              </p>
            </div>
          </div>

          {isAdmin && (
            <AddContentModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              defaultMode="lesson"
            />
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الدروس والمحاضرات والسلاسل..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Scholars List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300">العلماء والمفكرون</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SCHOLARS_LIST.map((scholar) => (
                <div
                  key={scholar.id}
                  onClick={() => onSelectScholar(scholar)}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/50 shadow-md cursor-pointer transition active:scale-[0.99]"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700 group-hover:scale-105 transition duration-300">
                    <img
                      src={scholar.photoUrl}
                      alt={scholar.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/20 font-semibold">
                      {scholar.title}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-teal-400 transition truncate mt-1">
                      {scholar.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {scholar.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Featured Lessons Grid */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>أحدث الدروس الصوتية</span>
            </h3>

            <div className="space-y-2">
              {allLessons.map((lesson) => {
                const scholar = SCHOLARS_LIST.find((s) => s.id === lesson.scholarId);
                const isThisTrackPlaying =
                  currentTrack?.id === lesson.id && isPlaying;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => handlePlayLesson(lesson, scholar)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                      isThisTrackPlaying
                        ? 'bg-teal-950/60 border-teal-500/50'
                        : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400 flex-shrink-0 border border-slate-700">
                        {isThisTrackPlaying ? (
                          <Volume2 className="w-5 h-5 text-teal-400 animate-pulse" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {lesson.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {lesson.scholarName} • <span className="text-teal-400">{lesson.series}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDuration(lesson.duration)}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300 flex items-center justify-center transition">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
