import React, { useState } from 'react';
import { BottomNav, NavigationTab } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { FullScreenPlayer } from './components/player/FullScreenPlayer';
import { MiniPlayer } from './components/player/MiniPlayer';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { AudioProvider } from './context/AudioContext';
import { CustomContentProvider } from './context/CustomContentContext';
import { LibraryProvider } from './context/LibraryContext';
import { Reciter, Scholar } from './types';
import { AdhkarView } from './views/AdhkarView';
import { HomeView } from './views/HomeView';
import { LessonsView } from './views/LessonsView';
import { LibraryView } from './views/LibraryView';
import { QuranView } from './views/QuranView';
import { SearchView } from './views/SearchView';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSelectReciter = (reciter: Reciter | null) => {
    setSelectedReciter(reciter);
    if (reciter) setCurrentTab('quran');
  };

  const handleSelectScholar = (scholar: Scholar | null) => {
    setSelectedScholar(scholar);
    if (scholar) setCurrentTab('lessons');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <OfflineIndicator />
      <Header onOpenSearch={() => setIsSearchOpen(true)} />

      <main className="flex-1 w-full">
        {currentTab === 'home' && (
          <HomeView
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onSelectReciter={handleSelectReciter}
            onSelectScholar={handleSelectScholar}
          />
        )}

        {currentTab === 'quran' && (
          <QuranView
            selectedReciter={selectedReciter}
            onSelectReciter={setSelectedReciter}
          />
        )}

        {currentTab === 'lessons' && (
          <LessonsView
            selectedScholar={selectedScholar}
            onSelectScholar={setSelectedScholar}
          />
        )}

        {currentTab === 'adhkar' && <AdhkarView />}

        {currentTab === 'library' && <LibraryView />}
      </main>

      {/* Global Search Overlay */}
      {isSearchOpen && (
        <SearchView
          onClose={() => setIsSearchOpen(false)}
          onSelectReciter={(r) => {
            handleSelectReciter(r);
            setIsSearchOpen(false);
          }}
          onSelectScholar={(s) => {
            handleSelectScholar(s);
            setIsSearchOpen(false);
          }}
        />
      )}

      {/* Bottom Mini Player & Full Screen Player */}
      <MiniPlayer />
      <FullScreenPlayer />

      {/* Mobile-First Bottom Navigation */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />
    </div>
  );
}

export default function App() {
  return (
    <CustomContentProvider>
      <LibraryProvider>
        <AudioProvider>
          <MainApp />
        </AudioProvider>
      </LibraryProvider>
    </CustomContentProvider>
  );
}
