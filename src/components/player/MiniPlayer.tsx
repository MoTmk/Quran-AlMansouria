import React from 'react';
import { ChevronUp, Loader2, Pause, Play, SkipForward } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    setIsFullScreenPlayerOpen,
  } = useAudio();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={() => setIsFullScreenPlayerOpen(true)}
      className="fixed bottom-16 left-2 right-2 md:left-auto md:right-6 md:w-[400px] z-40 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden cursor-pointer transition hover:border-emerald-500/40 active:scale-[0.99]"
    >
      {/* Top progress indicator bar */}
      <div className="h-1 w-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-3 py-2.5">
        {/* Track Info & Artwork */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700/60 shadow-md">
            <img
              src={currentTrack.imageUrl || '/icon.svg'}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-emerald-500/15 pointer-events-none" />
            )}
          </div>

          <div className="min-w-0 flex-1 text-right">
            <h4 className="text-sm font-bold text-white truncate leading-tight">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-emerald-400/90 truncate mt-0.5">
              {currentTrack.reciterOrScholar}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-slate-950 flex items-center justify-center shadow-lg transition"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            aria-label="التالي"
            className="p-2 text-slate-400 hover:text-white active:scale-90 transition"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsFullScreenPlayerOpen(true)}
            aria-label="فتح المشغل الكامل"
            className="p-1.5 text-slate-400 hover:text-white"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
