import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  ChevronLeft,
  Headphones,
  Moon,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  Volume2,
} from 'lucide-react';
import { TasbihCounter } from '../components/tasbih/TasbihCounter';
import { useAudio } from '../context/AudioContext';
import { ADHKAR_LIST } from '../data/islamicData';
import { DhikrCategory, DhikrItem, PlaylistItem } from '../types';

export const AdhkarView: React.FC = () => {
  const { playTrack, currentTrack, isPlaying } = useAudio();

  // Mode: Adhkar cards OR Tasbih
  const [activeTab, setActiveTab] = useState<'adhkar' | 'tasbih'>('adhkar');
  const [activeCategory, setActiveCategory] = useState<DhikrCategory>('morning');

  // Adhkar user repetition progress { [dhikrId]: currentCount }
  const [dhikrProgress, setDhikrProgress] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('noor_adhkar_counts_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('noor_adhkar_counts_v1', JSON.stringify(dhikrProgress));
    } catch {}
  }, [dhikrProgress]);

  const handleIncrementDhikr = (id: string, maxCount: number) => {
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }

    setDhikrProgress((prev) => {
      const current = prev[id] || 0;
      if (current >= maxCount) return prev; // already done
      const next = current + 1;
      if (next === maxCount) {
        // celebrate dhikr completion
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#6ee7b7'],
        });
      }
      return { ...prev, [id]: next };
    });
  };

  const handleResetCategoryCounts = () => {
    const categoryIds = ADHKAR_LIST.filter((d) => d.category === activeCategory).map(
      (d) => d.id
    );
    setDhikrProgress((prev) => {
      const updated = { ...prev };
      categoryIds.forEach((id) => delete updated[id]);
      return updated;
    });
  };

  const handlePlayDhikrAudio = (dhikr: DhikrItem) => {
    if (!dhikr.audioUrl) return;
    const track: PlaylistItem = {
      id: dhikr.id,
      title: dhikr.categoryTitle,
      subtitle: dhikr.text.slice(0, 45) + '...',
      audioUrl: dhikr.audioUrl,
      imageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80',
      category: 'adhkar',
      reciterOrScholar: 'الشيخ مشاري العفاسي',
      duration: dhikr.duration,
      dhikrId: dhikr.id,
    };
    playTrack(track);
  };

  const currentCategoryAdhkar = ADHKAR_LIST.filter(
    (d) => d.category === activeCategory
  );

  return (
    <div className="pb-28 pt-2 px-4 max-w-4xl mx-auto space-y-4 text-right">
      {/* Top Switcher: الأذكار / السبحة الإلكترونية */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-md">
        <button
          onClick={() => setActiveTab('adhkar')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'adhkar'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>حصن المسلم والأذكار</span>
        </button>

        <button
          onClick={() => setActiveTab('tasbih')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'tasbih'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>السبحة الإلكترونية</span>
        </button>
      </div>

      {activeTab === 'adhkar' ? (
        /* ADHKAR MODE */
        <div className="space-y-4 animate-fade-in">
          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'morning' as DhikrCategory, label: 'أذكار الصباح', icon: Sun },
              { id: 'evening' as DhikrCategory, label: 'أذكار المساء', icon: Moon },
              { id: 'sleep' as DhikrCategory, label: 'أذكار النوم', icon: Moon },
              { id: 'prayer' as DhikrCategory, label: 'بعد الصلاة', icon: Sparkles },
              { id: 'ruqyah' as DhikrCategory, label: 'الرقية الشرعية', icon: Shield },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <button
              onClick={handleResetCategoryCounts}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تصفير العدادات</span>
            </button>
            <span className="font-semibold text-slate-300">
              {currentCategoryAdhkar.length} أدعية وأذكار
            </span>
          </div>

          {/* Dhikr Cards List */}
          <div className="space-y-3">
            {currentCategoryAdhkar.map((dhikr) => {
              const doneCount = dhikrProgress[dhikr.id] || 0;
              const isCompleted = doneCount >= dhikr.count;
              const isThisPlaying = currentTrack?.id === dhikr.id && isPlaying;

              return (
                <div
                  key={dhikr.id}
                  className={`p-4 rounded-3xl border transition space-y-3 ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-slate-900/80 border-slate-800/80'
                  }`}
                >
                  {/* Card Header & Controls */}
                  <div className="flex items-center justify-between">
                    {/* Audio Listen */}
                    {dhikr.audioUrl && (
                      <button
                        onClick={() => handlePlayDhikrAudio(dhikr)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                          isThisPlaying
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isThisPlaying ? (
                          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Headphones className="w-3.5 h-3.5" />
                        )}
                        <span>{isThisPlaying ? 'جارٍ الاستماع' : 'استمع'}</span>
                      </button>
                    )}

                    {/* Progress Badge */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">التكرار:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {doneCount} / {dhikr.count}
                      </span>
                    </div>
                  </div>

                  {/* Dhikr Text with diacritics */}
                  <p className="text-base sm:text-lg font-quran leading-loose text-slate-100 text-right select-text">
                    {dhikr.text}
                  </p>

                  {/* Reward note */}
                  {dhikr.reward && (
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-emerald-300/90 leading-relaxed text-right flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{dhikr.reward}</span>
                    </div>
                  )}

                  {/* Big Tap to Count Button */}
                  <button
                    onClick={() => handleIncrementDhikr(dhikr.id, dhikr.count)}
                    disabled={isCompleted}
                    className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                      isCompleted
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:from-emerald-500 hover:to-teal-500'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-400" />
                        <span>تم الذكر بحمد الله</span>
                      </>
                    ) : (
                      <>
                        <span>اضغط للتسبيح ({dhikr.count - doneCount} متبقٍ)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TASBIH MODE USING DEDICATED COMPONENT */
        <TasbihCounter />
      )}
    </div>
  );
};

