import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { MetricRibbon } from './components/MetricRibbon';
import { CardGrid } from './components/CardGrid';
import { CreateCardWizard } from './components/CreateCardWizard';
import { QRCodeModal } from './components/QRCodeModal';
import { RSVPModal } from './components/RSVPModal';
import { EditCardModal } from './components/EditCardModal';
import { WebARViewer } from './components/ar/WebARViewer';
import { StorageService } from './utils/storage';
import type { ARCard } from './types';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [cards, setCards] = useState<ARCard[]>([]);
  const [activeTab, setActiveTab] = useState<'cards' | 'new'>('cards');
  const [selectedQRCard, setSelectedQRCard] = useState<ARCard | null>(null);
  const [editingCard, setEditingCard] = useState<ARCard | null>(null);
  const [activeARCard, setActiveARCard] = useState<ARCard | null>(null);
  const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);

  useEffect(() => {
    const savedTheme = StorageService.getTheme();
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;

    // 1. Instant local render
    const localCards = StorageService.getCards();
    setCards(localCards);

    // 2. Background cloud fetch
    StorageService.fetchCardsAsync().then((fetched) => {
      setCards(fetched);
    });

    // 3. Direct URL viewer check (?view=card-id)
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) {
      StorageService.fetchCardByIdAsync(viewParam).then((foundCard) => {
        if (foundCard) {
          setActiveARCard(foundCard);
        }
      });
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    StorageService.setTheme(nextTheme);
    document.documentElement.className = nextTheme;
  };

  const refreshCards = async () => {
    const updated = await StorageService.fetchCardsAsync();
    setCards(updated);
  };

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
            setActiveARCard(null);
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
            onOpenRSVPInbox={() => setIsRSVPModalOpen(true)}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'cards' ? (
              <>
                <MetricRibbon cards={cards} theme={theme} />
                <CardGrid
                  cards={cards}
                  theme={theme}
                  onSelectCard={setSelectedQRCard}
                  onEditCard={setEditingCard}
                  onPreviewAR={(id) => {
                    const target = cards.find((c) => c.id === id);
                    if (target) setActiveARCard(target);
                  }}
                />
              </>
            ) : (
              <CreateCardWizard
                theme={theme}
                onCancel={() => setActiveTab('cards')}
                onCreated={async (newCardId) => {
                  await refreshCards();
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

          {editingCard && (
            <EditCardModal
              card={editingCard}
              isOpen={Boolean(editingCard)}
              onClose={() => setEditingCard(null)}
              onUpdated={refreshCards}
              theme={theme}
            />
          )}

          <RSVPModal
            cards={cards}
            isOpen={isRSVPModalOpen}
            onClose={() => setIsRSVPModalOpen(false)}
            theme={theme}
          />
        </>
      )}
    </div>
  );
}
