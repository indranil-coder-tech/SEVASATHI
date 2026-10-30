import { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { checkBackendHealth } from './services/api';

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const MarketIntelligence = lazy(() =>
  import('./pages/MarketIntelligence').then((m) => ({ default: m.MarketIntelligence }))
);
const NearbyStorage = lazy(() =>
  import('./pages/NearbyStorage').then((m) => ({ default: m.NearbyStorage }))
);
const CalculatorPage = lazy(() =>
  import('./pages/CalculatorPage').then((m) => ({ default: m.CalculatorPage }))
);
const About = lazy(() =>
  import('./pages/About').then((m) => ({ default: m.About }))
);

const TabFallback = ({ label = "लोड होत आहे... (Loading...)" }: { label?: string }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex flex-col items-center justify-center min-h-[420px] w-full rounded-2xl neo-card p-8 gap-3"
  >
    <div className="w-8 h-8 border-3 border-[#52785B] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-[#59665C] font-semibold">{label}</span>
  </div>
);

function AppContent() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [calculatorInitialData, setCalculatorInitialData] = useState<{
    crop?: string;
    mandi?: string;
    currentPrice?: number;
    expectedFuturePrice?: number;
  }>({});
  const [selectedCropForStorage, setSelectedCropForStorage] = useState<string>('all');
  const [backendOffline, setBackendOffline] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  useEffect(() => {
    checkBackendHealth().then((res) => {
      if (!res.healthy) {
        setBackendOffline(true);
      }
    });
  }, []);

  const handleNavigateToCalculator = (data: {
    crop: string;
    mandi: string;
    currentPrice: number;
    expectedFuturePrice: number;
  }) => {
    setCalculatorInitialData(data);
    setActiveTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToStorage = (crop: string) => {
    setSelectedCropForStorage(crop.toLowerCase());
    setActiveTab('storage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E9EEE8] text-[#26352B] selection:bg-[#52785B]/20 selection:text-[#304C38]">
      {/* Top Navbar with Language Switcher & Detected Location */}
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Global Backend Offline Banner */}
      {backendOffline && !bannerDismissed && (
        <div
          role="alert"
          className="bg-amber-100 border-b border-amber-300 text-amber-950 px-4 py-2 text-xs sm:text-sm flex items-center shadow-sm animate-fade-in"
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span className="font-bold text-amber-800">
              ⚠️ {t('common.backend_offline') || 'Backend Offline'}:
            </span>
            <span className="text-amber-900 flex-1 truncate">
              {t('common.backend_offline_banner') ||
                'Backend service is unreachable. Features may be running in offline/demo mode.'}
            </span>
            <button
              onClick={() => {
                checkBackendHealth().then((res) => {
                  if (res.healthy) setBackendOffline(false);
                });
              }}
              className="underline text-xs font-semibold text-amber-800 hover:text-amber-950 px-2 py-0.5"
            >
              {t('common.retry') || 'Retry'}
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss banner"
              className="text-amber-800 hover:text-amber-950 font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'dashboard' && (
            <Dashboard onNavigate={handleTabChange} />
          )}

          {activeTab === 'market' && (
            <MarketIntelligence
              onNavigateToCalculator={handleNavigateToCalculator}
              onNavigateToStorage={handleNavigateToStorage}
            />
          )}

          {activeTab === 'storage' && (
            <NearbyStorage initialCropFilter={selectedCropForStorage} />
          )}

          {activeTab === 'calculator' && (
            <CalculatorPage initialValues={calculatorInitialData} />
          )}

          {activeTab === 'about' && <About />}
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
