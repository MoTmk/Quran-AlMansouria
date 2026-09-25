import React, { useState } from 'react';
import {
  Download,
  FolderPlus,
  Heart,
  History,
  ListMusic,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLibrary } from '../context/LibraryContext';
import { PlaylistItem, UserPlaylist } from '../types';
import { formatBytes } from '../utils/audioStorage';
import { formatDuration } from '../utils/formatters';

export const LibraryView: React.FC = () => {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const {
    favorites,
    playlists,
    createPlaylist,
    deletePlaylist,
    removeFromPlaylist,
    history,
    clearHistory,
    downloadedTracks,
    deleteDownload,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists' | 'downloads' | 'history'>('favorites');
  const [selectedPlaylist, setSelectedPlaylist] = useState<UserPlaylist | null>(null);
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreateNewPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName);
    setNewPlaylistName('');
    setShowNewPlaylistModal(false);
  };

  const handlePlayPlaylist = (pl: UserPlaylist) => {
    if (pl.items.length === 0) return;
    playTrack(pl.items[0], pl.items);
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-4xl mx-auto space-y-4 text-right">
      <div>
        <h2 className="text-xl font-black text-white">مكتبتك الصوتية</h2>
        <p className="text-xs text-slate-400 mt-1">
          قوائم التشغيل الخاصة بك، المفضلة، التسجيلات المحملة وسجل الاستماع
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
        {[
          { id: 'favorites' as const, label: 'المفضلة', icon: Heart, count: favorites.length },
          { id: 'playlists' as const, label: 'قوائم التشغيل', icon: ListMusic, count: playlists.length },
          { id: 'downloads' as const, label: 'التنزيلات (أوفلاين)', icon: Download, count: downloadedTracks.length },
          { id: 'history' as const, label: 'سجل الاستماع', icon: History, count: history.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedPlaylist(null);
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-1 transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono opacity-80">({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* 1. FAVORITES TAB */}
      {activeTab === 'favorites' && (
        <div className="space-y-3 animate-fade-in">
          {favorites.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Heart className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
              <p className="text-sm font-semibold text-slate-300">لا توجد عناصر في المفضلة بعد</p>
              <p className="text-xs text-slate-500">
                اضغط على رمز القلب في أي سورة أو درس لإضافتها هنا
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {favorites.map((track) => {
                const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, favorites)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                      isThisPlaying
                        ? 'bg-emerald-950/60 border-emerald-500/50'
                        : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                        <img
                          src={track.imageUrl || '/icon.svg'}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {track.reciterOrScholar}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(track, favorites);
                      }}
                      className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center transition hover:bg-emerald-400 active:scale-95 ml-2"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. PLAYLISTS TAB */}
      {activeTab === 'playlists' && (
        <div className="space-y-4 animate-fade-in">
          {selectedPlaylist ? (
            /* Selected Playlist Detail */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← العودة للقوائم
                </button>
                <div className="text-right">
                  <h3 className="text-base font-bold text-white">{selectedPlaylist.name}</h3>
                  <span className="text-xs text-slate-400">{selectedPlaylist.items.length} مقطع</span>
                </div>
              </div>

              {selectedPlaylist.items.length > 0 && (
                <button
                  onClick={() => handlePlayPlaylist(selectedPlaylist)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>تشغيل القائمة</span>
                </button>
              )}

              {selectedPlaylist.items.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">
                  هذه القائمة فارغة. افتح أي سورة أو درس واضغط زر "قائمة تشغيل" لإضافته هنا!
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedPlaylist.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => playTrack(item, selectedPlaylist.items)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 cursor-pointer transition"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{item.reciterOrScholar}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromPlaylist(selectedPlaylist.id, item.id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Playlists Overview */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowNewPlaylistModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إنشاء قائمة جديدة</span>
                </button>
                <span className="text-xs text-slate-400">قوائمك المحفوظة</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlaylist(pl)}
                    className="p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 shadow cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <ListMusic className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate">{pl.name}</h4>
                        <span className="text-xs text-slate-400">{pl.items.length} مقطع صوتي</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`هل أنت متأكد من حذف قائمة "${pl.name}"؟`)) {
                          deletePlaylist(pl.id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DOWNLOADS (OFFLINE) TAB */}
      {activeTab === 'downloads' && (
        <div className="space-y-3 animate-fade-in">
          {downloadedTracks.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Download className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
              <p className="text-sm font-semibold text-slate-300">لا توجد تسجيلات محملة أوفلاين</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                اضغط على زر التنزيل في أي سورة أو درس ليتم حفظها مباشرة على هاتفك للاستماع في أي وقت دون اتصال بالإنترنت!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 pb-1">
                التسجيلات التالية مخزنة بالكامل على جهازك:
              </div>
              {downloadedTracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, downloadedTracks)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-teal-500/20 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                      <img
                        src={track.imageUrl || '/icon.svg'}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {track.reciterOrScholar} •{' '}
                        <span className="text-teal-400 font-mono">
                          {formatBytes(track.sizeBytes)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDownload(track.id);
                      }}
                      title="حذف من ذاكرة الهاتف"
                      className="p-2 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(track, downloadedTracks);
                      }}
                      className="w-9 h-9 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center transition hover:bg-teal-400 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-3 animate-fade-in">
          {history.length > 0 && (
            <div className="flex items-center justify-between pb-1">
              <button
                onClick={clearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح السجل</span>
              </button>
              <span className="text-xs text-slate-400">{history.length} تسجيل تم تشغيله مؤخراً</span>
            </div>
          )}

          {history.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <History className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
              <p className="text-sm font-semibold text-slate-300">سجل الاستماع فارغ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div
                  key={`${item.id}_${idx}`}
                  onClick={() => playTrack(item, undefined, item.progressSeconds)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                      <img
                        src={item.imageUrl || '/icon.svg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.reciterOrScholar} • توقف عند{' '}
                        <span className="font-mono text-emerald-400">
                          {formatDuration(item.progressSeconds)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 flex items-center justify-center transition">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Playlist Modal */}
      {showNewPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 text-right">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                onClick={() => setShowNewPlaylistModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-white text-base">إنشاء قائمة تشغيل جديدة</h3>
            </div>

            <form onSubmit={handleCreateNewPlaylist} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">اسم القائمة:</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="مثال: تلاوات قبل النوم، سورة البقرة..."
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPlaylistModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-emerald-950/40"
                >
                  إنشاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
