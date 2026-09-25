import React, { useState } from 'react';
import {
  Apple,
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Share2,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PhoneInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneInstallGuideModal: React.FC<PhoneInstallGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios'>('android');

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href.split('?')[0]
      : 'https://ais-pre-jvtgbdvgaj52j3abbv7dzo-71513007763.europe-west2.run.app';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-right overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl space-y-4 my-8">
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
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span>تثبيت التطبيق على هاتفك</span>
            </h3>
            <p className="text-xs text-slate-400">
              استمتع بالتطبيق كأنه تطبيق أصلي مع تشغيل بالخلفية وبدون نت
            </p>
          </div>
        </div>

        {/* 1-Click Install Button if available */}
        {isInstallable && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 space-y-2 text-center">
            <p className="text-xs text-emerald-300 font-bold">متصفحك يدعم التثبيت الفوري بنقرة واحدة:</p>
            <button
              onClick={async () => {
                await install();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span>اضغط هنا لتثبيت التطبيق فوراً</span>
            </button>
          </div>
        )}

        {/* Share / Copy link for phone */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[11px] text-slate-400 block font-semibold">
            رابط التطبيق (افتحه من متصفح الهاتف):
          </span>
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700/60">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
            </button>
            <p className="text-xs text-slate-300 font-mono truncate select-all flex-1 text-left ltr">
              {currentUrl}
            </p>
          </div>
        </div>

        {/* Android / iOS Tabs */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setDeviceType('android')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              deviceType === 'android'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>هواتف أندرويد (Android)</span>
          </button>

          <button
            onClick={() => setDeviceType('ios')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              deviceType === 'ios'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>هواتف آيفون (iOS Safari)</span>
          </button>
        </div>

        {/* Step by step guide */}
        {deviceType === 'android' ? (
          <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                1
              </span>
              <p>افتح الرابط أعلاه في متصفح <strong>Google Chrome</strong> على هاتفك.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                2
              </span>
              <p>اضغط على قائمة الثلاث نقاط <strong>(⋮)</strong> في أعلى أو أسفل يمين المتصفح.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                3
              </span>
              <p>
                اختر <strong>"تثبيت التطبيق" (Install app)</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية" (Add to Home screen)</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                4
              </span>
              <p className="text-emerald-300">
                مبروك! سيظهر تطبيق "نور" كأيقونة تطبيق كاملة على هاتفك بدون إعلانات وبسرعة خيالية.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                1
              </span>
              <p>افتح الرابط في متصفح <strong>Safari (سفاري)</strong> على جهاز iPhone أو iPad.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                2
              </span>
              <p>اضغط على زر <strong>المشاركة (Share)</strong> في الشريط بالأسفل (المربع بسهم لأعلى).</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                3
              </span>
              <p>
                مرر للأسفل واضغط على <strong>"إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                4
              </span>
              <p className="text-emerald-300">
                اضغط <strong>"إضافة" (Add)</strong> بالأعلى؛ وسيصبح التطبيق متاحاً على شاشتك الرئيسية ويعمل بملء الشاشة مع تشغيل الصوت بالخلفية!
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
        >
          إغلاق النافذة
        </button>
      </div>
    </div>
  );
};
