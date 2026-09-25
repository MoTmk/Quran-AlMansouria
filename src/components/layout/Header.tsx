import React, { useState } from 'react';
import {
  HardDrive,
  Info,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { useCustomContent } from '../../context/CustomContentContext';
import { useLibrary } from '../../context/LibraryContext';
import { formatBytes } from '../../utils/audioStorage';
import { AddContentModal } from '../content/AddContentModal';
import { PhoneInstallGuideModal } from '../pwa/PhoneInstallGuideModal';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const { isAdmin, loginAdmin, logoutAdmin } = useCustomContent();
  const { downloadedTracks, deleteDownload } = useLibrary();

  const totalBytes = downloadedTracks.reduce((acc, t) => acc + (t.sizeBytes || 0), 0);

  const handleClearAllDownloads = async () => {
    if (window.confirm('هل أنت متأكد من مسح جميع التنزيلات وحفظ المساحة؟')) {
      for (const track of downloadedTracks) {
        await deleteDownload(track.id);
      }
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(passcodeInput);
    if (success) {
      setLoginError(false);
      setPasscodeInput('');
      setShowAdminLoginModal(false);
    } else {
      setLoginError(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 pt-safe px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo & App Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-950 flex items-center justify-center">
              <div className="w-full h-full rounded-[10px] bg-slate-950/40 flex items-center justify-center">
                <Moon className="w-5 h-5 text-emerald-300" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-wide flex items-center gap-1.5 leading-none">
                <span>نُـور</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  صوتي
                </span>
                {isAdmin && (
                  <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                    <span>مشرف</span>
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                تلاوات، دروس وأذكار
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Admin-only Add Button (Hidden for regular public users) */}
            {isAdmin && (
              <button
                onClick={() => setShowAddContent(true)}
                title="لوحة المشرف: إضافة شيخ أو سورة"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition active:scale-95 animate-fade-in"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إدارة المحتوى</span>
              </button>
            )}

            {/* Install on phone guide button */}
            <button
              onClick={() => setShowInstallGuide(true)}
              title="تثبيت التطبيق على الهاتف"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تثبيت التطبيق</span>
            </button>

            <button
              onClick={onOpenSearch}
              aria-label="البحث"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-850 border border-slate-700/60 transition active:scale-95"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              aria-label="الإعدادات والمساحة"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-850 border border-slate-700/60 transition active:scale-95"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Add Content Modal (Admin Only) */}
      <AddContentModal
        isOpen={showAddContent}
        onClose={() => setShowAddContent(false)}
      />

      {/* Phone Install Guide Modal */}
      <PhoneInstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />

      {/* Admin Passcode Login Modal */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-right">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                onClick={() => {
                  setShowAdminLoginModal(false);
                  setLoginError(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-white text-base flex items-center gap-1.5 justify-end">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>دخول المشرفين (Admin Portal)</span>
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              هذه المنطقة مخصصة للمشرفين فقط لإضافة وحذف المشايخ والتسجيلات الخاصة.
            </p>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  أدخل رمز المرور (Passcode):
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      setLoginError(false);
                    }}
                    placeholder="رمز المرور الافتراضي: 7777"
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-left ltr font-mono"
                  />
                </div>
                {loginError && (
                  <p className="text-[11px] text-rose-400 mt-1.5">
                    رمز المرور غير صحيح. (الرمز الافتراضي: 7777)
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminLoginModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white shadow-lg active:scale-95 transition"
                >
                  دخول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings & Info Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 text-right">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-white text-base">إعدادات التطبيق والمساحة</h3>
            </div>

            {/* Admin Management Section */}
            {isAdmin ? (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>وضع المشرف مفعّل</span>
                  </div>
                  <button
                    onClick={() => logoutAdmin()}
                    className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>خروج</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowAddContent(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة وتعديل المشايخ والتسجيلات</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowAdminLoginModal(true);
                }}
                className="w-full p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>دخول المشرفين (إضافة المشايخ)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">رمز المرور</span>
              </button>
            )}

            {/* Offline Storage Manager */}
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">ذاكرة التخزين المحلية (الأوفلاين)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-emerald-400 font-bold">{formatBytes(totalBytes)}</span>
                <span>المساحة المستخدمة حالياً:</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-white font-bold">{downloadedTracks.length}</span>
                <span>عدد المقاطع المحمّلة:</span>
              </div>

              {downloadedTracks.length > 0 && (
                <button
                  onClick={handleClearAllDownloads}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تفريغ كافة التنزيلات وتحرير المساحة</span>
                </button>
              )}
            </div>

            {/* Audio Hosting & Quality Info */}
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <Info className="w-5 h-5 text-teal-400" />
                <span className="text-xs font-bold text-slate-200">الاستضافة وجودة الصوت</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                يتم بث التسجيلات عبر روابط البث المباشر (Archive.org و MP3Quran) بجودة عالية ومضغوطة تلقائياً لتوفير باقة الإنترنت بدون تكاليف استضافة سحابية باهظة.
              </p>
            </div>

            {/* About */}
            <div className="text-center pt-1 text-slate-500 text-[11px] space-y-1">
              <p className="text-slate-400 font-bold">تطبيق نور الصوتي الإسلامي • الإصدار 1.2.0</p>
              <p>Mobile-First PWA • صدقة جارية</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


