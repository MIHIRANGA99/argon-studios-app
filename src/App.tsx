import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { MetricRibbon } from './components/MetricRibbon';
import { CardGrid } from './components/CardGrid';
import { CreateCardWizard } from './components/CreateCardWizard';
import { QRCodeModal } from './components/QRCodeModal';
import { WebARViewer } from './components/ar/WebARViewer';
import { StorageService } from './utils/storage';
import type { ARCard } from './types';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [cards, setCards] = useState<ARCard[]>([]);
  const [activeTab, setActiveTab] = useState<'cards' | 'new'>('cards');
  const [selectedQRCard, setSelectedQRCard] = useState<ARCard | null>(null);
  const [activeARCardId, setActiveARCardId] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = StorageService.getTheme();
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;

    const loadedCards = StorageService.getCards();
    setCards(loadedCards);

    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) {
      setActiveARCardId(viewParam);
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    StorageService.setTheme(nextTheme);
    document.documentElement.className = nextTheme;
  };

  const refreshCards = () => {
    setCards(StorageService.getCards());
  };

  const activeARCard = activeARCardId ? StorageService.getCardById(activeARCardId) : null;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        theme === 'dark' ? 'bg-[#0A0A0C] text-[#E5E2E3]' : 'bg-[#FBFBFA] text-[#1A1A1A]'
      }`}
    >
      {activeARCard ? (
        <WebARViewer
          card={activeARCard}
          onClose={() => {
            setActiveARCardId(null);
            window.history.replaceState({}, '', window.location.pathname);
            refreshCards();
          }}
        />
      ) : (
        <>
          <Navigation
            theme={theme}
            onToggleTheme={handleToggleTheme}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'cards' ? (
              <>
                <MetricRibbon cards={cards} theme={theme} />
                <CardGrid
                  cards={cards}
                  theme={theme}
                  onSelectCard={setSelectedQRCard}
                  onPreviewAR={(id) => setActiveARCardId(id)}
                />
              </>
            ) : (
              <CreateCardWizard
                theme={theme}
                onCancel={() => setActiveTab('cards')}
                onCreated={(newCardId) => {
                  refreshCards();
                  setActiveTab('cards');
                  const created = StorageService.getCardById(newCardId);
                  if (created) setSelectedQRCard(created);
                }}
              />
            )}
          </main>

          <footer
            className={`mt-20 border-t py-8 transition-colors ${
              theme === 'dark'
                ? 'border-neutral-800/80 text-neutral-500 bg-[#0A0A0C]'
                : 'border-neutral-200 text-neutral-400 bg-[#FBFBFA]'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>WebAR Engine: <strong>Operational (MindAR + Three.js)</strong></span>
              </div>
              <div className="text-center font-serif-luxury text-[#D4AF37] font-semibold tracking-wider">
                ARGON Studios — Handcrafted Spatial Print Excellence
              </div>
              <div>
                © {new Date().getFullYear()} ARGON Studios. All Rights Reserved.
              </div>
            </div>
          </footer>

          {selectedQRCard && (
            <QRCodeModal
              card={selectedQRCard}
              isOpen={Boolean(selectedQRCard)}
              onClose={() => setSelectedQRCard(null)}
              theme={theme}
            />
          )}
        </>
      )}
    </div>
  );
}
export default App;
