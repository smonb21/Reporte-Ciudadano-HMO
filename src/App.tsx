import { useState, useEffect, useMemo } from 'react';
import { Camera, ShieldAlert, ClipboardList, Settings } from 'lucide-react';
import type { CiudadanoReport } from './types';
import { SEED_COMMUNITY_REPORTS } from './data/seedReports';
import { ReportTab } from './components/ReportTab';
import { AlertsTab } from './components/AlertsTab';
import { MyReportsTab } from './components/MyReportsTab';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PrintableOficio } from './components/PrintableOficio';
import { stopSpeaking } from './utils/speech';

type ActiveTab = 'reportar' | 'alertas' | 'mis-reportes';

const STORAGE_REPORTS_KEY = 'hmo_mis_reportes_v1';
const STORAGE_API_KEY = 'hmo_custom_gemini_key';

function loadUserReports(): CiudadanoReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadCustomApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_API_KEY) || '';
  } catch {
    return '';
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reportar');
  const [userReports, setUserReports] = useState<CiudadanoReport[]>(loadUserReports);
  const [customApiKey, setCustomApiKey] = useState<string>(loadCustomApiKey);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [printingReport, setPrintingReport] = useState<CiudadanoReport | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(userReports));
    } catch {
      // Ignora error de cuota de almacenamiento silenciosamente
    }
  }, [userReports]);

  const handleSaveApiKey = (newKey: string) => {
    setCustomApiKey(newKey);
    try {
      if (newKey) {
        localStorage.setItem(STORAGE_API_KEY, newKey);
      } else {
        localStorage.removeItem(STORAGE_API_KEY);
      }
    } catch {
      // Ignora error de localStorage
    }
  };

  const handleReportCreated = (report: CiudadanoReport) => {
    setUserReports((prev) => [report, ...prev]);
  };

  const handleUpdateReport = (id: string, updates: Partial<CiudadanoReport>) => {
    setUserReports((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const handleDeleteReport = (id: string) => {
    setUserReports((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSwitchTab = (tab: ActiveTab) => {
    stopSpeaking();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const communityReports = useMemo(
    () => [...userReports, ...SEED_COMMUNITY_REPORTS],
    [userReports],
  );

  const handlePrintReport = (report: CiudadanoReport) => {
    setPrintingReport(report);
  };

  return (
    <>
      <PrintableOficio
        report={printingReport}
        onClose={() => setPrintingReport(null)}
      />
      <div className="min-h-screen bg-[#FAF8F5] text-[#111827] pb-28 print:hidden">
      {/* Barra superior compacta */}
      <header className="sticky top-0 z-30 border-b-2 border-[#D6D3CD] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[58px] max-w-2xl items-center justify-between gap-4 px-4">
          <h1 className="truncate text-[20px] font-extrabold tracking-tight text-[#0F2C59]">
            Reporte Ciudadano HMO
          </h1>

          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            aria-label="Configurar API Key"
            title="Configurar API Key"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-[#D6D3CD] bg-[#FAF8F5] text-[#374151] hover:bg-[#EFECE6]"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="mx-auto max-w-2xl px-4 py-5">
        {activeTab === 'reportar' && (
          <ReportTab
            customApiKey={customApiKey}
            onReportCreated={handleReportCreated}
            onGoToMyReports={() => handleSwitchTab('mis-reportes')}
            onPrintReport={handlePrintReport}
          />
        )}

        {activeTab === 'alertas' && (
          <AlertsTab reports={communityReports} customApiKey={customApiKey} />
        )}

        {activeTab === 'mis-reportes' && (
          <MyReportsTab
            reports={userReports}
            onUpdateReport={handleUpdateReport}
            onDeleteReport={handleDeleteReport}
            onGoToCreate={() => handleSwitchTab('reportar')}
            onPrintReport={handlePrintReport}
          />
        )}
      </main>

      {/* Barra de navegación inferior fija con 3 pestañas grandes y claras */}
      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#111827] bg-white pb-safe shadow-lg"
      >
        <div className="mx-auto grid h-[74px] max-w-2xl grid-cols-3 gap-1.5 px-2 py-1.5">
          <button
            type="button"
            onClick={() => handleSwitchTab('reportar')}
            aria-current={activeTab === 'reportar' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center rounded-xl px-1 transition-colors ${
              activeTab === 'reportar'
                ? 'bg-[#0F2C59] text-white'
                : 'bg-[#FAF8F5] text-[#111827] hover:bg-[#EFECE6]'
            }`}
          >
            <Camera className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="mt-0.5 whitespace-nowrap text-[14px] font-extrabold leading-none tracking-tight sm:text-[16px]">
              Hacer Reporte
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('alertas')}
            aria-current={activeTab === 'alertas' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center rounded-xl px-1 transition-colors ${
              activeTab === 'alertas'
                ? 'bg-[#C2410C] text-white'
                : 'bg-[#FAF8F5] text-[#111827] hover:bg-[#EFECE6]'
            }`}
          >
            <ShieldAlert className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="mt-0.5 whitespace-nowrap text-[14px] font-extrabold leading-none tracking-tight sm:text-[16px]">
              Alertas Vecinales
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('mis-reportes')}
            aria-current={activeTab === 'mis-reportes' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center rounded-xl px-1 transition-colors ${
              activeTab === 'mis-reportes'
                ? 'bg-[#0F2C59] text-white'
                : 'bg-[#FAF8F5] text-[#111827] hover:bg-[#EFECE6]'
            }`}
          >
            <ClipboardList className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="mt-0.5 whitespace-nowrap text-[14px] font-extrabold leading-none tracking-tight sm:text-[16px]">
              Mis Reportes
            </span>
          </button>
        </div>
      </nav>

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        currentKey={customApiKey}
        onSave={handleSaveApiKey}
        onClose={() => setIsKeyModalOpen(false)}
      />
      </div>
    </>
  );
}
