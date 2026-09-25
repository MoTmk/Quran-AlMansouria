import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  Edit3,
  FileAudio,
  GraduationCap,
  HelpCircle,
  Link as LinkIcon,
  Mic,
  Music,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { useCustomContent } from '../../context/CustomContentContext';
import { SURAHS_LIST } from '../../data/islamicData';
import { Reciter, ReciterTrack } from '../../types';
import { saveCustomAudioBlob } from '../../utils/audioStorage';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'reciter_track' | 'reciter' | 'lesson' | 'manage';
  targetReciterId?: string;
  editingTrack?: ReciterTrack | null;
}

export const AddContentModal: React.FC<AddContentModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'reciter_track',
  targetReciterId,
  editingTrack,
}) => {
  const {
    allReciters,
    addCustomReciter,
    deleteCustomReciter,
    customReciters,
    customReciterTracks,
    addCustomReciterTrack,
    updateCustomReciterTrack,
    deleteCustomReciterTrack,
    addCustomLesson,
    customLessons,
    deleteCustomLesson,
    cleanAudioUrl,
  } = useCustomContent();

  const [activeTab, setActiveTab] = useState<'reciter_track' | 'reciter' | 'lesson' | 'manage'>(defaultMode);

  // Reciter Track Form State (e.g. "آيات من سورة الفرقان")
  const [selectedReciterId, setSelectedReciterId] = useState<string>(
    editingTrack?.reciterId || targetReciterId || allReciters[0]?.id || ''
  );
  const [trackTitle, setTrackTitle] = useState(editingTrack?.title || '');
  const [trackAudioUrl, setTrackAudioUrl] = useState(editingTrack?.audioUrl || '');
  const [trackDurationMinutes, setTrackDurationMinutes] = useState(
    editingTrack?.duration ? Math.round(editingTrack.duration / 60).toString() : '10'
  );
  const [trackDescription, setTrackDescription] = useState(editingTrack?.description || '');
  const [trackSuccess, setTrackSuccess] = useState(false);

  // Surah Helper selector
  const [helperSurahNumber, setHelperSurahNumber] = useState<string>('');

  // Reciter Profile Form State
  const [reciterName, setReciterName] = useState('');
  const [reciterRewayah, setReciterRewayah] = useState('تلاوات ومختارات خاشعة');
  const [reciterPhoto, setReciterPhoto] = useState('');
  const [reciterBio, setReciterBio] = useState('');
  const [reciterSuccess, setReciterSuccess] = useState(false);

  // Lesson Form State
  const [lessonTitle, setLessonTitle] = useState('');
  const [scholarName, setScholarName] = useState('');
  const [seriesName, setSeriesName] = useState('سلاسل إيمانية');
  const [lessonAudioUrl, setLessonAudioUrl] = useState('');
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState('25');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonSuccess, setLessonSuccess] = useState(false);

  // Hosting Advice Collapsible
  const [showHostingGuide, setShowHostingGuide] = useState(false);

  // Local File Uploading state (IndexedDB/Blob)
  const [uploadingLocalFile, setUploadingLocalFile] = useState(false);
  const [localFileName, setLocalFileName] = useState('');

  // Sync mode if targetReciterId or editingTrack changes
  useEffect(() => {
    if (editingTrack) {
      setActiveTab('reciter_track');
      setSelectedReciterId(editingTrack.reciterId);
      setTrackTitle(editingTrack.title);
      setTrackAudioUrl(editingTrack.audioUrl);
      setTrackDurationMinutes(editingTrack.duration ? Math.round(editingTrack.duration / 60).toString() : '10');
      setTrackDescription(editingTrack.description || '');
      setLocalFileName(editingTrack.audioUrl.startsWith('blob_key:') ? 'ملف صوتي مخزن محلياً' : '');
    } else if (targetReciterId) {
      setActiveTab('reciter_track');
      setSelectedReciterId(targetReciterId);
    } else {
      setActiveTab(defaultMode);
    }
  }, [targetReciterId, defaultMode, editingTrack, isOpen]);

  if (!isOpen) return null;

  // Preset portrait suggestions
  const presetPhotos = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80',
  ];

  // Handle local audio file selection directly from phone/laptop with IndexedDB storage!
  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'track' | 'lesson') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLocalFile(true);
    setLocalFileName(file.name);

    try {
      const key = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Save directly into IndexedDB!
      const blobRef = await saveCustomAudioBlob(key, file);

      // Detect duration automatically
      try {
        const tempAudio = new Audio(URL.createObjectURL(file));
        tempAudio.onloadedmetadata = () => {
          if (tempAudio.duration && !isNaN(tempAudio.duration)) {
            const mins = Math.max(1, Math.round(tempAudio.duration / 60));
            if (targetField === 'track') {
              setTrackDurationMinutes(mins.toString());
            } else {
              setLessonDurationMinutes(mins.toString());
            }
          }
        };
      } catch {}

      if (targetField === 'track') {
        setTrackAudioUrl(blobRef);
        if (!trackTitle) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          setTrackTitle(nameWithoutExt);
        }
      } else {
        setLessonAudioUrl(blobRef);
        if (!lessonTitle) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          setLessonTitle(nameWithoutExt);
        }
      }
    } catch (err) {
      console.error('Local file storage error', err);
      alert('حدث خطأ أثناء حفظ الملف الصوتي محلياً.');
    } finally {
      setUploadingLocalFile(false);
    }
  };

  // Quick helper to fill title from Surah
  const applySurahHelper = (templateType: 'selection' | 'full' | 'clip') => {
    if (!helperSurahNumber) return;
    const s = SURAHS_LIST.find((item) => item.number === parseInt(helperSurahNumber, 10));
    if (!s) return;

    if (templateType === 'selection') {
      setTrackTitle(`آيات من سورة ${s.name}`);
    } else if (templateType === 'full') {
      setTrackTitle(`سورة ${s.name} كاملة`);
    } else {
      setTrackTitle(`تلاوة خاشعة من سورة ${s.name}`);
    }
  };

  // Submit Handler: Add / Update Track for Reciter
  const handleCreateOrUpdateTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTitle.trim() || !trackAudioUrl.trim() || !selectedReciterId) return;

    const targetReciter = allReciters.find((r) => r.id === selectedReciterId);
    const reciterNameStr = targetReciter?.name || 'الشيخ';
    const durSec = Math.max(30, (parseInt(trackDurationMinutes, 10) || 10) * 60);

    if (editingTrack) {
      updateCustomReciterTrack(editingTrack.id, {
        reciterId: selectedReciterId,
        reciterName: reciterNameStr,
        title: trackTitle.trim(),
        audioUrl: cleanAudioUrl(trackAudioUrl),
        duration: durSec,
        description: trackDescription.trim() || 'تسجيل قرآني مضاف',
      });
    } else {
      addCustomReciterTrack({
        reciterId: selectedReciterId,
        reciterName: reciterNameStr,
        title: trackTitle.trim(),
        audioUrl: cleanAudioUrl(trackAudioUrl),
        duration: durSec,
        description: trackDescription.trim() || 'تسجيل قرآني مضاف',
      });
    }

    setTrackSuccess(true);
    setTimeout(() => {
      setTrackSuccess(false);
      if (!editingTrack) {
        setTrackTitle('');
        setTrackAudioUrl('');
        setTrackDescription('');
        setLocalFileName('');
      }
      onClose();
    }, 1000);
  };

  // Submit Handler: Add Reciter Profile
  const handleCreateReciter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reciterName.trim()) return;

    const created = addCustomReciter({
      name: reciterName.trim(),
      englishName: reciterName.trim(),
      rewayah: reciterRewayah.trim() || 'تلاوات ومختارات خاشعة',
      photoUrl: reciterPhoto.trim() || presetPhotos[0],
      bio: reciterBio.trim() || 'تسجيلات وتلاوات قرآنية مسجلة حديثاً.',
      totalSurahs: 0,
    });

    // select this new sheikh automatically for track adding!
    setSelectedReciterId(created.id);

    setReciterSuccess(true);
    setTimeout(() => {
      setReciterSuccess(false);
      setReciterName('');
      setReciterBio('');
      // switch to adding tracks for this sheikh immediately!
      setActiveTab('reciter_track');
    }, 1000);
  };

  // Submit Handler: Add Lesson
  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !lessonAudioUrl.trim()) return;

    const durationSec = Math.max(60, (parseInt(lessonDurationMinutes, 10) || 20) * 60);

    addCustomLesson({
      scholarId: 'scholar_' + Date.now(),
      scholarName: scholarName.trim() || 'داعية / شيخ',
      title: lessonTitle.trim(),
      series: seriesName.trim() || 'سلاسل خاصة',
      duration: durationSec,
      audioUrl: cleanAudioUrl(lessonAudioUrl),
      description: lessonDescription.trim() || 'درس إسلامي ومحاضرة مضافة.',
    });

    setLessonSuccess(true);
    setTimeout(() => {
      setLessonSuccess(false);
      setLessonTitle('');
      setLessonAudioUrl('');
      setScholarName('');
      onClose();
    }, 1000);
  };

  const selectedReciterObj = allReciters.find((r) => r.id === selectedReciterId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-right overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl my-6 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-right">
            <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-1.5 justify-end">
              {editingTrack ? (
                <>
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  <span>تعديل بيانات التسجيل</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-emerald-400" />
                  <span>إدارة وإضافة التلاوات والشيوخ</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {editingTrack
                ? 'تعديل اسم المقطع، الوصف أو الرابط الصوتي'
                : 'إضافة سور، آيات مختارة، مشايخ جدد ودروس صوتية'}
            </p>
          </div>
        </div>

        {/* Tab Switcher (hidden if editing a single track) */}
        {!editingTrack && (
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none gap-1">
            <button
              onClick={() => setActiveTab('reciter_track')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'reciter_track'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>إضافة تلاوة / مقطع</span>
            </button>

            <button
              onClick={() => setActiveTab('reciter')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'reciter'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>إنشاء ملف شيخ جديد</span>
            </button>

            <button
              onClick={() => setActiveTab('lesson')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'lesson'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>إضافة درس</span>
            </button>

            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'manage'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>المضاف ({customReciterTracks.length + customReciters.length})</span>
            </button>
          </div>
        )}

        {/* Audio Hosting Advice Card & Alternatives */}
        <div className="bg-emerald-950/40 rounded-2xl p-3 border border-emerald-500/25 space-y-1.5">
          <button
            type="button"
            onClick={() => setShowHostingGuide(!showHostingGuide)}
            className="w-full flex items-center justify-between text-xs text-emerald-300 font-bold"
          >
            <span className="text-[11px] underline">
              {showHostingGuide
                ? 'إخفاء دليل روابط الصوت وتليجرام'
                : 'أسهل طريقة لرفع الصوت (من هاتفك مباشرة أو روابط خارجية وتليجرام)؟ اضغط هنا'}
            </span>
            <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          </button>

          {showHostingGuide && (
            <div className="text-xs text-slate-300 space-y-2 pt-2 border-t border-emerald-500/20 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-slate-900/95 border border-emerald-500/30 space-y-1">
                <p className="font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. الخيار الأسهل والأسرع 100%: رفع الملف من هاتفك مباشرة</span>
                </p>
                <p className="text-[11px] text-slate-300">
                  لا تحتاج لأي موقع خارجي أو تعقيدات! اضغط على زر <strong>"ملف من جهازك"</strong>، اختر ملف الـ MP3 من هاتفك أو لابتوبك، وسيتم حفظه داخل قاعدة بيانات التطبيق (IndexedDB) ويشتغل فوراً أوفلاين وأونلاين!
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/95 border border-slate-800 space-y-1">
                <p className="font-bold text-amber-300">2. هل يمكن استخدام تليجرام؟</p>
                <p className="text-[11px] text-slate-300">
                  تليجرام ممتاز للمشاركة، ولكن روابط تليجرام العادية (مثل <code>t.me/...</code>) هي صفحات ويب مغلقة وتمنع متصفحات الهواتف من تشغيلها كملف صوتي مباشر بسبب قيود الحماية (CORS). إذا أردت رفع الملف أونلاين لمشاركته، فأسهل موقعين مجانيين يعطيانك رابط MP3 مباشر دائم هما:
                  <br />
                  - <strong>Catbox.moe</strong> (ترفع الملف بضغطة زر وتنسخ الرابط المباشر).
                  <br />
                  - <strong>Archive.org</strong> (إذا رفعت في Archive، انسخ رابط الملف نفسه الذي ينتهي بـ <code>.mp3</code>).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* TAB 1: ADD / EDIT RECITER TRACK */}
        {activeTab === 'reciter_track' && (
          <form onSubmit={handleCreateOrUpdateTrack} className="space-y-3.5 overflow-y-auto flex-1 pr-1">
            {trackSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{editingTrack ? 'تم تحديث بيانات التلاوة بنجاح!' : 'تمت إضافة التلاوة للشيخ بنجاح!'}</span>
              </div>
            )}

            {/* Choose الشيخ */}
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                اختر القارئ / الشيخ التابع له التسجيل: <span className="text-emerald-400">*</span>
              </label>
              <select
                value={selectedReciterId}
                onChange={(e) => setSelectedReciterId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {allReciters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.isCustom ? '(شيخ مخصص)' : ''}
                  </option>
                ))}
              </select>
              {selectedReciterObj && (
                <p className="text-[11px] text-emerald-400 mt-1">
                  القارئ المختار: {selectedReciterObj.name} ({selectedReciterObj.rewayah})
                </p>
              )}
            </div>

            {/* Quick Surah Template Helper */}
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block">
                مساعد تسمية السورة (اختياري لتسهيل الكتابة):
              </span>
              <div className="flex gap-2">
                <select
                  value={helperSurahNumber}
                  onChange={(e) => setHelperSurahNumber(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="">اختر سورة لملء العنوان...</option>
                  {SURAHS_LIST.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. سورة {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {helperSurahNumber && (
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => applySurahHelper('selection')}
                    className="flex-1 py-1 px-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px] hover:bg-emerald-900 transition"
                  >
                    آيات مختارة
                  </button>
                  <button
                    type="button"
                    onClick={() => applySurahHelper('full')}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 text-[10px] hover:bg-slate-800 transition"
                  >
                    سورة كاملة
                  </button>
                  <button
                    type="button"
                    onClick={() => applySurahHelper('clip')}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 text-[10px] hover:bg-slate-800 transition"
                  >
                    تلاوة خاشعة
                  </button>
                </div>
              )}
            </div>

            {/* Track Title */}
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                عنوان المقطع أو السورة: <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder="مثال: آيات من سورة الفرقان (٦٣ - ٧٧)، سورة الكهف، تلاوة خاشعة..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Audio URL or Direct File Upload */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 block font-semibold">
                الملف الصوتي (اختر من هاتفك أو ضع رابطاً مباشراً): <span className="text-emerald-400">*</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={trackAudioUrl}
                  onChange={(e) => {
                    setTrackAudioUrl(e.target.value);
                    setLocalFileName('');
                  }}
                  placeholder="رابط مباشر MP3 أو ارفع ملفك..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 ltr text-left font-mono"
                />

                {/* Local file picker */}
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 flex-shrink-0 transition">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uploadingLocalFile ? 'جارٍ الحفظ...' : 'ملف من جهازك'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleLocalFileChange(e, 'track')}
                  />
                </label>
              </div>

              {(trackAudioUrl.startsWith('blob_key:') || localFileName) && (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 pt-0.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>تم حفظ الملف ({localFileName || 'ملف صوتي'}) في قاعدة بيانات التطبيق! سيعمل بدون إنترنت.</span>
                </p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                المدة التقريبية (بالدقائق):
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={trackDurationMinutes}
                onChange={(e) => setTrackDurationMinutes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                ملاحظات أو مناسبة التلاوة (اختياري):
              </label>
              <input
                type="text"
                value={trackDescription}
                onChange={(e) => setTrackDescription(e.target.value)}
                placeholder="مثال: تسجيل من صلاة التراويح، تراويح ليلة ٢٧، تلاوة نادرة..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={uploadingLocalFile}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg active:scale-95 transition"
            >
              {editingTrack ? 'حفظ التعديلات' : 'حفظ ونشر التلاوة في قائمة الشيخ'}
            </button>
          </form>
        )}

        {/* TAB 2: CREATE RECITER PROFILE */}
        {activeTab === 'reciter' && (
          <form onSubmit={handleCreateReciter} className="space-y-3 overflow-y-auto flex-1 pr-1">
            {reciterSuccess && (
              <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400" />
                <span>تم إنشاء ملف الشيخ بنجاح! يمكنك الآن إضافة مقاطعه فوراً.</span>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                اسم الشيخ / القارئ: <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={reciterName}
                onChange={(e) => setReciterName(e.target.value)}
                placeholder="مثال: الشيخ فلان الفلاني..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                الرواية / نوع التلاوة:
              </label>
              <input
                type="text"
                value={reciterRewayah}
                onChange={(e) => setReciterRewayah(e.target.value)}
                placeholder="مثال: تلاوات خاصة، حفص عن عاصم، تسجيلات نادرة..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                صورة الشيخ (اختر نموذجاً أو ضع رابطاً):
              </label>
              <input
                type="url"
                value={reciterPhoto}
                onChange={(e) => setReciterPhoto(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 ltr text-left"
              />
              <div className="flex gap-2 mt-1.5">
                {presetPhotos.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="preset"
                    onClick={() => setReciterPhoto(url)}
                    className={`w-9 h-9 rounded-lg object-cover cursor-pointer border-2 transition ${
                      reciterPhoto === url ? 'border-cyan-400 scale-105' : 'border-slate-700 hover:border-slate-500'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                نبذة تعريفية:
              </label>
              <textarea
                rows={2}
                value={reciterBio}
                onChange={(e) => setReciterBio(e.target.value)}
                placeholder="نبذة مختصرة عن القارئ والمسجد أو التسجيلات..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white shadow-lg active:scale-95 transition"
            >
              إنشاء ملف الشيخ والمتابعة لإضافة المقاطع
            </button>
          </form>
        )}

        {/* TAB 3: ADD LESSON */}
        {activeTab === 'lesson' && (
          <form onSubmit={handleCreateLesson} className="space-y-3 overflow-y-auto flex-1 pr-1">
            {lessonSuccess && (
              <div className="p-3 bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400" />
                <span>تمت إضافة الدرس بنجاح!</span>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                عنوان الدرس: <span className="text-teal-400">*</span>
              </label>
              <input
                type="text"
                required
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="مثال: تفسير سورة الإخلاص، محاضرة الصبر..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  اسم الشيخ / الداعية:
                </label>
                <input
                  type="text"
                  value={scholarName}
                  onChange={(e) => setScholarName(e.target.value)}
                  placeholder="اسم المحاضر..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  السلسلة:
                </label>
                <input
                  type="text"
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  placeholder="سيرة، تفسير..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 block font-semibold">
                رابط الصوت المباشر أو ملف من جهازك: <span className="text-teal-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={lessonAudioUrl}
                  onChange={(e) => setLessonAudioUrl(e.target.value)}
                  placeholder="https://.../lesson.mp3"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 ltr text-left font-mono"
                />
                <label className="cursor-pointer flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 flex-shrink-0 transition">
                  <Upload className="w-3.5 h-3.5 text-teal-400" />
                  <span>ملف محلي</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleLocalFileChange(e, 'lesson')}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 font-bold text-xs text-white shadow-lg active:scale-95 transition"
            >
              حفظ الدرس الصوتي
            </button>
          </form>
        )}

        {/* TAB 4: MANAGE ALL CUSTOM CONTENT */}
        {activeTab === 'manage' && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {customReciters.length === 0 && customReciterTracks.length === 0 && customLessons.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FileAudio className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">لم تقم بإضافة أي محتوى خاص بعد</p>
              </div>
            ) : (
              <>
                {/* Custom Tracks (e.g. Surat Al-Furqan) */}
                {customReciterTracks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400">التلاوات والمقاطع المضافة ({customReciterTracks.length}):</h4>
                    {customReciterTracks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                      >
                        <div className="text-right min-w-0 flex-1 pl-2">
                          <p className="text-xs font-bold text-white truncate">{t.title}</p>
                          <p className="text-[10px] text-emerald-400">{t.reciterName}</p>
                        </div>
                        <button
                          onClick={() => deleteCustomReciterTrack(t.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition flex-shrink-0"
                          title="حذف هذا المقطع"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Sheikhs */}
                {customReciters.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-cyan-400">الشيوخ والقراء المضافون ({customReciters.length}):</h4>
                    {customReciters.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={r.photoUrl} alt={r.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="text-right">
                            <p className="text-xs font-bold text-white">{r.name}</p>
                            <p className="text-[10px] text-slate-400">{r.rewayah}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCustomReciter(r.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                          title="حذف القارئ وكافة تسجيلاته"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Lessons */}
                {customLessons.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-teal-400">الدروس المضافة ({customLessons.length}):</h4>
                    {customLessons.map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                      >
                        <div className="text-right min-w-0 flex-1 pl-2">
                          <p className="text-xs font-bold text-white truncate">{l.title}</p>
                          <p className="text-[10px] text-slate-400">{l.scholarName} • {l.series}</p>
                        </div>
                        <button
                          onClick={() => deleteCustomLesson(l.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition flex-shrink-0"
                          title="حذف الدرس"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
