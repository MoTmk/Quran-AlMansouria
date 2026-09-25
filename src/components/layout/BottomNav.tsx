import React from 'react';
import { BookOpen, Compass, GraduationCap, Library, MoonStar } from 'lucide-react';

export type NavigationTab = 'home' | 'quran' | 'lessons' | 'adhkar' | 'library';

interface BottomNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home' as NavigationTab, label: 'الرئيسية', icon: Compass },
    { id: 'quran' as NavigationTab, label: 'القرآن', icon: BookOpen },
    { id: 'lessons' as NavigationTab, label: 'الدروس', icon: GraduationCap },
    { id: 'adhkar' as NavigationTab, label: 'الأذكار والسبحة', icon: MoonStar },
    { id: 'library' as NavigationTab, label: 'المكتبة', icon: Library },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 pb-safe">
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 select-none ${
                isActive
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : ''
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
