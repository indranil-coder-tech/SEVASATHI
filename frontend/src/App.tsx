import { useState, lazy, Suspense } from 'react';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [calculatorInitialData, setCalculatorInitialData] = useState<{
    crop?: string;
    mandi?: string;
    currentPrice?: number;
    expectedFuturePrice?: number;
  }>({});

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E9EEE8] text-[#26352B] selection:bg-[#52785B]/20 selection:text-[#304C38]">
      {/* Top Navbar with Language Switcher & Detected Location */}
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'dashboard' && (
            <Dashboard onNavigate={handleTabChange} />
          )}

          {activeTab === 'market' && (
            <MarketIntelligence onNavigateToCalculator={handleNavigateToCalculator} />
          )}

          {activeTab === 'storage' && <NearbyStorage />}

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
