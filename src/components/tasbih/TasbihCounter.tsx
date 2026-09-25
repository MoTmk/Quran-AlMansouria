import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Edit3, Plus, RotateCcw, Sparkles, Trash2, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { useCustomContent } from '../../context/CustomContentContext';
import { TasbihPreset } from '../../types';

interface TasbihCounterProps {
  initialPresetId?: string;
}

export const TasbihCounter: React.FC<TasbihCounterProps> = ({ initialPresetId }) => {
  const { allTasbihPresets, addCustomTasbihPreset, deleteCustomTasbihPreset } = useCustomContent();

  const [selectedPreset, setSelectedPreset] = useState<TasbihPreset>(() => {
    return allTasbihPresets.find((p) => p.id === initialPresetId) || allTasbihPresets[0];
  });

  const [count, setCount] = useState<number>(0);
  const [goal, setGoal] = useState<number>(selectedPreset.target);
  const [isCustomGoal, setIsCustomGoal] = useState<boolean>(false);
  const [customGoalInput, setCustomGoalInput] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [isGoalReachedPulse, setIsGoalReachedPulse] = useState<boolean>(false);

  // Modal for adding custom tasbih
  const [showAddDhikrModal, setShowAddDhikrModal] = useState<boolean>(false);
  const [newDhikrTitle, setNewDhikrTitle] = useState('');
  const [newDhikrTarget, setNewDhikrTarget] = useState('100');
  const [newDhikrMeaning, setNewDhikrMeaning] = useState('');

  // Lifetime counts
  const [lifetimeCount, setLifetimeCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('noor_lifetime_tasbih') || 0);
    } catch {
      return 0;
    }
  });

  // Soft click sound generator using Web Audio API (zero external assets needed)
  const playClickSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Celebrate goal sound
  const playGoalFanfare = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.3);
      });
    } catch {}
  };

  const handleTap = () => {
    // 1. Audio
    playClickSound();

    // 2. Haptics
    if (hapticsEnabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(22);
    }

    const next = count + 1;
    setCount(next);

    // Update Lifetime
    const nextLifetime = lifetimeCount + 1;
    setLifetimeCount(nextLifetime);
    try {
      localStorage.setItem('noor_lifetime_tasbih', nextLifetime.toString());
    } catch {}

    // Check goal target
    if (goal > 0 && next === goal) {
      setIsGoalReachedPulse(true);
      setTimeout(() => setIsGoalReachedPulse(false), 2000);

      playGoalFanfare();

      if (hapticsEnabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 80, 40, 80, 50]);
      }

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899'],
      });
    }
  };

  const handleReset = () => {
    setCount(0);
    setIsGoalReachedPulse(false);
  };

  const handleSelectPreset = (preset: TasbihPreset) => {
    setSelectedPreset(preset);
    setGoal(preset.target);
    setIsCustomGoal(false);
    setCount(0);
  };

  const handleSetCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customGoalInput, 10);
    if (!isNaN(val) && val > 0) {
      setGoal(val);
      setIsCustomGoal(false);
      setCount(0);
    }
  };

  const handleCreateCustomDhikr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDhikrTitle.trim()) return;

    const targetNum = parseInt(newDhikrTarget, 10) || 100;
    const created = addCustomTasbihPreset({
      title: newDhikrTitle.trim(),
      target: targetNum,
      meaning: newDhikrMeaning.trim() || 'تسبيح مخصص أضافه المستخدم',
    });

    handleSelectPreset(created);
    setNewDhikrTitle('');
    setNewDhikrMeaning('');
    setShowAddDhikrModal(false);
  };

  const progressPercent = goal > 0 ? Math.min(100, (count / goal) * 100) : 0;
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = goal > 0 ? circumference - (progressPercent / 100) * circumference : 0;

  return (
    <div className="space-y-6 animate-fade-in text-center max-w-md mx-auto">
      {/* Preset Dhikr Selector Header & Add Button */}
      <div className="space-y-2 text-right">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => setShowAddDhikrModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/35 text-cyan-300 font-bold text-xs transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة تسبيح خاص</span>
          </button>
          <span className="font-semibold text-cyan-400">صيغ الأذكار المتاحة</span>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {allTasbihPresets.map((p) => {
            const isSelected = selectedPreset.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`relative p-2.5 rounded-2xl text-xs font-bold transition text-right cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-950/60 ring-2 ring-cyan-400/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
                }`}
              >
                <div className="min-w-0 flex-1 truncate">
                  <div className="flex items-center gap-1">
                    <p className="truncate font-quran text-sm">{p.title}</p>
                    {p.isCustom && (
                      <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1 py-0.2 rounded font-sans flex-shrink-0">
                        مخصص
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-cyan-200/70 font-mono mt-0.5 block">
                    الهدف: {p.target}
                  </span>
                </div>

                {p.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`هل تريد حذف "${p.title}" من قائمة تسبيحاتك؟`)) {
                        deleteCustomTasbihPreset(p.id);
                        if (selectedPreset.id === p.id) {
                          handleSelectPreset(allTasbihPresets[0]);
                        }
                      }
                    }}
                    title="حذف هذا الذكر"
                    className="p-1 text-slate-400 hover:text-rose-400 transition ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Goal Targets Selector & Settings */}
      <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          {/* Quick presets */}
          <div className="flex items-center gap-1.5">
            {[33, 100, 1000, 0].map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGoal(g);
                  setIsCustomGoal(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  goal === g && !isCustomGoal
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                {g === 0 ? 'مفتوح' : g}
              </button>
            ))}

            <button
              onClick={() => setIsCustomGoal(!isCustomGoal)}
              className={`p-1.5 rounded-xl text-xs transition ${
                isCustomGoal
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
              title="تحديد عدد مخصص"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs text-slate-300 font-semibold">الهدف المطلوب:</span>
        </div>

        {/* Custom goal form */}
        {isCustomGoal && (
          <form onSubmit={handleSetCustomGoal} className="flex gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-cyan-600 text-white font-bold text-xs"
            >
              حفظ
            </button>
            <input
              type="number"
              min="1"
              max="99999"
              value={customGoalInput}
              onChange={(e) => setCustomGoalInput(e.target.value)}
              placeholder="أدخل عدداً مستهدفاً (مثال: 70)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 text-right"
              autoFocus
            />
          </form>
        )}

        {/* Sensory Feedback Toggles (Sound & Vibration) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400 px-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1 transition ${
                soundEnabled ? 'text-cyan-400' : 'text-slate-500 line-through'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>الصوت</span>
            </button>

            <button
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className={`flex items-center gap-1 transition ${
                hapticsEnabled ? 'text-cyan-400' : 'text-slate-500 line-through'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>الاهتزاز</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500">مؤثرات لمسية وصوتية</span>
        </div>
      </div>

      {/* Selected Dhikr Display Card */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-center">
        <h3 className="text-xl sm:text-2xl font-bold font-quran text-cyan-300 leading-relaxed">
          {selectedPreset.title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
          {selectedPreset.meaning}
        </p>
      </div>

      {/* Interactive Main Tap Area */}
      <div className="py-2 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Outer Ripple / Glow when goal reached */}
          {isGoalReachedPulse && (
            <div className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping pointer-events-none" />
          )}

          <button
            onClick={handleTap}
            aria-label="اضغط للتسبيح"
            className={`relative w-60 h-60 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950/70 border-4 ${
              isGoalReachedPulse
                ? 'border-emerald-400 shadow-emerald-500/50'
                : 'border-cyan-500/40 hover:border-cyan-400 shadow-cyan-950/80'
            } shadow-2xl active:scale-95 transition-all duration-150 flex flex-col items-center justify-center select-none group cursor-pointer`}
          >
            {/* SVG Circular Progress Meter */}
            {goal > 0 && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1">
                <circle
                  cx="116"
                  cy="116"
                  r={radius}
                  fill="none"
                  stroke="rgba(6, 182, 212, 0.12)"
                  strokeWidth="8"
                />
                <circle
                  cx="116"
                  cy="116"
                  r={radius}
                  fill="none"
                  stroke={count >= goal ? '#10b981' : '#06b6d4'}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              </svg>
            )}

            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>اضغط للتسبيح</span>
            </span>

            <span className="text-5xl sm:text-6xl font-black font-mono text-white tracking-tight group-hover:scale-105 transition">
              {count}
            </span>

            {goal > 0 ? (
              <span className="text-xs text-slate-400 font-mono mt-1">
                الهدف: {goal} ({Math.round(progressPercent)}%)
              </span>
            ) : (
              <span className="text-xs text-slate-400 mt-1">تسبيح حر مفتوح</span>
            )}

            {count >= goal && goal > 0 && (
              <span className="mt-1 text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                <Check className="w-3.5 h-3.5" />
                <span>تم إنجاز الهدف!</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Controls & Statistics Bottom Row */}
      <div className="flex items-center justify-between px-2 pt-1">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>تصفير العداد</span>
        </button>

        <div className="text-right text-xs text-slate-400">
          <span>إجمالي تسبيحاتك المسجلة: </span>
          <span className="font-mono text-cyan-400 font-bold text-sm">
            {lifetimeCount.toLocaleString('ar-EG')}
          </span>
        </div>
      </div>

      {/* Modal: Add Custom Tasbih Dhikr */}
      {showAddDhikrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-right">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                onClick={() => setShowAddDhikrModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-white text-base flex items-center gap-1.5 justify-end">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>إضافة صيغة تسبيح خاصة</span>
              </h3>
            </div>

            <form onSubmit={handleCreateCustomDhikr} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  نص الذكر أو الدعاء: <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDhikrTitle}
                  onChange={(e) => setNewDhikrTitle(e.target.value)}
                  placeholder="مثال: لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-quran text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  العدد المستهدف الافتراضي:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={newDhikrTarget}
                  onChange={(e) => setNewDhikrTarget(e.target.value)}
                  placeholder="33، 100، 40..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  فضله أو مناسبته (اختياري):
                </label>
                <input
                  type="text"
                  value={newDhikrMeaning}
                  onChange={(e) => setNewDhikrMeaning(e.target.value)}
                  placeholder="مثال: دعاء ذي النون لتفريج الكروب والهموم..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDhikrModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white shadow-lg active:scale-95 transition"
                >
                  إضافة للمسبحة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

