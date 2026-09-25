import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Clock,
  Download,
  FolderPlus,
  Gauge,
  Heart,
  ListMusic,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RotateCcw,
  RotateCw,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  X,
} from 'lucide-react';
import { useAudio } from '../../context/AudioContext';
import { useLibrary } from '../../context/LibraryContext';
import { formatDuration } from '../../utils/formatters';

export const FullScreenPlayer: React.FC = () => {
  const {
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
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    nextTrack,
    previousTrack,
    setPlaybackRate,
    toggleRepeatMode,
    toggleShuffle,
    removeFromQueue,
    clearQueue,
    setSleepTimer,
    setIsFullScreenPlayerOpen,
  } = useAudio();

  const {
    isFavorite,
    toggleFavorite,
    playlists,
    addToPlaylist,
    downloadTrack,
    deleteDownload,
    isDownloaded,
    downloadProgress,
  } = useLibrary();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState(false);
  const [showQueueSheet, setShowQueueSheet] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isFullScreenPlayerOpen || !currentTrack) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${currentTrack.title} - ${currentTrack.reciterOrScholar}`,
      text: `استمع إلى ${currentTrack.title} بصوت ${currentTrack.reciterOrScholar} عبر تطبيق نور الإسلامي`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled or failed
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
      showToast('تم نسخ الرابط بنجاح');
    }
  };

  const isFav = isFavorite(currentTrack.id);
  const downloaded = isDownloaded(currentTrack.id);
  const currentDlProgress = downloadProgress[currentTrack.id];

  const handleDownloadToggle = async () => {
    if (downloaded) {
      await deleteDownload(currentTrack.id);
      showToast('تم إزالة التسجيل من التنزيلات');
    } else {
      try {
        await downloadTrack(currentTrack);
        showToast('تم تحميل التسجيل بنجاح للاستماع دون إنترنت!');
      } catch {
        showToast('فشل التحميل، تحقق من اتصالك بالإنترنت');
      }
    }
  };

  const speeds = [0.75, 1, 1.25, 1.5, 2];
  const sleepTimerOptions = [
    { label: 'إيقاف المؤقت', value: null },
    { label: '15 دقيقة', value: 15 },
    { label: '30 دقيقة', value: 30 },
    { label: '45 دقيقة', value: 45 },
    { label: '60 دقيقة (ساعة)', value: 60 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-2xl text-white select-none overflow-y-auto">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"
        />
        <div
          className="absolute bottom-10 left-1/4 w-80 h-80 bg-teal-700/15 rounded-full blur-3xl"
        />
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-full shadow-2xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <button
          onClick={() => setIsFullScreenPlayerOpen(false)}
          className="p-2 -mr-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          aria-label="تصغير المشغل"
        >
          <ChevronDown className="w-7 h-7" />
        </button>

        <div className="text-center">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-emerald-400/90 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            {currentTrack.category === 'quran'
              ? 'القرآن الكريم'
              : currentTrack.category === 'lesson'
              ? 'درس ومحاضرة'
              : 'أذكار وأدعية'}
          </span>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px] truncate">
            {currentTrack.subtitle}
          </p>
        </div>

        <button
          onClick={() => setShowQueueSheet(true)}
          className="p-2 -ml-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition relative"
          aria-label="قائمة الانتظار"
        >
          <ListMusic className="w-6 h-6" />
          {queue.length > 1 && (
            <span className="absolute top-1.5 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          )}
        </button>
      </div>

      {/* Center Artwork & Track Meta */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-4 max-w-md mx-auto w-full">
        {/* Album Artwork */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-auto rounded-3xl overflow-hidden shadow-2xl shadow-emerald-950/60 border border-slate-700/50 group">
          <img
            src={currentTrack.imageUrl || '/icon.svg'}
            alt={currentTrack.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
          
          {/* Subtle audio playing waves */}
          {isPlaying && (
            <div className="absolute bottom-4 left-4 flex items-end gap-1 pointer-events-none">
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          )}
        </div>

        {/* Title & Reciter with Favorite button */}
        <div className="w-full flex items-center justify-between mt-6">
          <div className="min-w-0 flex-1 text-right pl-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate">
              {currentTrack.title}
            </h2>
            <p className="text-sm font-medium text-emerald-400 mt-1 truncate">
              {currentTrack.reciterOrScholar}
            </p>
          </div>

          <button
            onClick={() => toggleFavorite(currentTrack)}
            aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            className="p-3 rounded-full text-slate-400 hover:text-white transition active:scale-90"
          >
            <Heart
              className={`w-7 h-7 transition-colors ${
                isFav ? 'text-rose-500 fill-rose-500' : 'text-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Seekbar */}
        <div className="w-full mt-6">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
          />
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono mt-2">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="w-full flex items-center justify-between mt-4 px-2">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            title="تشغيل عشوائي"
            className={`p-2.5 rounded-full transition ${
              isShuffle ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Skip Back 10s */}
          <button
            onClick={() => skipBackward(10)}
            title="رجوع 10 ثوانٍ"
            className="p-2 text-slate-300 hover:text-white active:scale-90 transition relative"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[9px] absolute -bottom-1 left-1/2 -translate-x-1/2 text-slate-400 font-sans">
              10
            </span>
          </button>

          {/* Previous Track */}
          <button
            onClick={previousTrack}
            title="التسجيل السابق"
            className="p-3 text-slate-200 hover:text-white active:scale-90 transition"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/25 active:scale-90 transition"
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            title="التسجيل التالي"
            className="p-3 text-slate-200 hover:text-white active:scale-90 transition"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          {/* Skip Forward 10s */}
          <button
            onClick={() => skipForward(10)}
            title="تقديم 10 ثوانٍ"
            className="p-2 text-slate-300 hover:text-white active:scale-90 transition relative"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-[9px] absolute -bottom-1 left-1/2 -translate-x-1/2 text-slate-400 font-sans">
              10
            </span>
          </button>

          {/* Repeat Mode */}
          <button
            onClick={toggleRepeatMode}
            title={
              repeatMode === 'one'
                ? 'تكرار التلاوة الحالية'
                : repeatMode === 'all'
                ? 'تكرار القائمة كاملة'
                : 'إيقاف التكرار'
            }
            className={`p-2.5 rounded-full transition ${
              repeatMode !== 'off'
                ? 'text-emerald-400 bg-emerald-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Extra Bottom Utility Action Row */}
        <div className="w-full flex items-center justify-around mt-6 pt-4 border-t border-slate-800/80">
          {/* Speed Selector */}
          <button
            onClick={() => setShowSpeedMenu(true)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <Gauge className="w-5 h-5" />
            <span className="text-[11px] font-mono">{playbackRate}x</span>
          </button>

          {/* Sleep Timer */}
          <button
            onClick={() => setShowSleepTimerMenu(true)}
            className={`flex flex-col items-center gap-1 transition ${
              sleepTimerMinutes !== null
                ? 'text-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[11px]">
              {sleepTimerRemainingSeconds !== null
                ? formatDuration(sleepTimerRemainingSeconds)
                : 'مؤقت نوم'}
            </span>
          </button>

          {/* Offline Download Button */}
          <button
            onClick={handleDownloadToggle}
            disabled={typeof currentDlProgress === 'number'}
            className={`flex flex-col items-center gap-1 transition ${
              downloaded
                ? 'text-teal-400'
                : typeof currentDlProgress === 'number'
                ? 'text-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {typeof currentDlProgress === 'number' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : downloaded ? (
              <Check className="w-5 h-5 text-teal-400" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="text-[11px]">
              {typeof currentDlProgress === 'number'
                ? `${currentDlProgress}%`
                : downloaded
                ? 'محمّل'
                : 'تنزيل'}
            </span>
          </button>

          {/* Add to Playlist */}
          <button
            onClick={() => setShowPlaylistModal(true)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <FolderPlus className="w-5 h-5" />
            <span className="text-[11px]">قائمة تشغيل</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[11px]">مشاركة</span>
          </button>
        </div>
      </div>

      {/* Speed Modal */}
      {showSpeedMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-right">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowSpeedMenu(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-white text-base">سرعة التشغيل</h3>
            </div>
            <div className="space-y-1">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setPlaybackRate(s);
                    setShowSpeedMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition ${
                    playbackRate === s
                      ? 'bg-emerald-600 font-bold text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-mono">{s}x</span>
                  <span>{s === 1 ? 'عادي' : s < 1 ? 'بطيء' : 'سريع'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sleep Timer Modal */}
      {showSleepTimerMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-right">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowSleepTimerMenu(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-white text-base">مؤقت إيقاف التشغيل</h3>
            </div>
            <div className="space-y-1">
              {sleepTimerOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setSleepTimer(opt.value);
                    setShowSleepTimerMenu(false);
                    showToast(
                      opt.value ? `سيتم إيقاف التشغيل بعد ${opt.value} دقيقة` : 'تم إيقاف المؤقت'
                    );
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition ${
                    sleepTimerMinutes === opt.value
                      ? 'bg-emerald-600 font-bold text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sleepTimerMinutes === opt.value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Queue Drawer */}
      {showQueueSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-auto bg-slate-900 border-t border-slate-700 rounded-t-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <button
                onClick={() => setShowQueueSheet(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-white text-base">قائمة الانتظار ({queue.length})</h3>
              <button
                onClick={clearQueue}
                title="مسح القائمة"
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                مسح
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-3 space-y-2">
              {queue.map((item, idx) => {
                const isCurrent = idx === currentQueueIndex;
                return (
                  <div
                    key={`${item.id}_${idx}`}
                    className={`flex items-center justify-between p-3 rounded-xl transition ${
                      isCurrent
                        ? 'bg-emerald-950/70 border border-emerald-500/30'
                        : 'bg-slate-800/40 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 text-right">
                      <span className="text-xs font-mono text-slate-400 w-5 text-center">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-emerald-300' : 'text-white'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {item.reciterOrScholar}
                        </p>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => removeFromQueue(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add To Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-right">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-white text-base">إضافة إلى قائمة تشغيل</h3>
            </div>
            {playlists.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                لا توجد قوائم تشغيل حتى الآن. أنشئ قائمة جديدة من تبويب المكتبة!
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {playlists.map((pl) => {
                  const alreadyIn = pl.items.some((i) => i.id === currentTrack.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={() => {
                        addToPlaylist(pl.id, currentTrack);
                        setShowPlaylistModal(false);
                        showToast(`تمت الإضافة إلى "${pl.name}"`);
                      }}
                      disabled={alreadyIn}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition ${
                        alreadyIn
                          ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <span className="text-xs text-slate-400">{pl.items.length} عنصر</span>
                      <span className="font-semibold">{pl.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
