import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (compact) {
      return (
        <button
          onClick={install}
          title="تثبيت التطبيق على جهازك (PWA)"
          aria-label="تثبيت التطبيق"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/50 hover:text-white text-xs font-semibold transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تثبيت</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition"
      >
        <Smartphone className="w-4 h-4" />
        <span>تثبيت التطبيق (PWA)</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>تثبيت على آيفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-right">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-base font-bold text-white">تثبيت التطبيق على iPhone / iPad</h3>
              </div>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح Safari بالأسفل.
                </p>
                <p>
                  2. مرر للأسفل واضغط على <strong>إضافة إلى الصفحة الرئيسية (Add to Home Screen)</strong>.
                </p>
                <p className="text-xs text-emerald-400">
                  سيظهر التطبيق كأيقونة مستقلة على شاشتك الرئيسية ويعمل بملء الشاشة مع تشغيل الخلفية!
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
