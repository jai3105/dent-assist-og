
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';

// Layout Components
import { Header } from './components/layout/Header';
import { StudentSidebar } from './components/layout/StudentSidebar';
import { ProfessionalSidebar } from './components/layout/ProfessionalSidebar';
import { PublicSidebar } from './components/layout/PublicSidebar';

// Page Components
import { RoleSelectionPage } from './components/pages/RoleSelectionPage';
import { AdminDashboard } from './components/admin/AdminDashboard';

// New Dashboard Components
import { StudentDashboard } from './components/dashboards/StudentDashboard';
import { ProfessionalDashboard } from './components/dashboards/ProfessionalDashboard';
import { PublicDashboard } from './components/dashboards/PublicDashboard';


// Feature Components
import { Dentforge } from './components/features/Dentforge';
import { Dentomedia } from './components/features/Dentomedia';
import { DentaHunt } from './components/features/Dentahunt';
import { Dentafeed } from './components/features/Dentafeed';
import { Dentaround } from './components/features/Dentaround';
import { Dentradar } from './components/features/Dentradar';
import { DentSync } from './components/features/DentSync';
import { DentStats } from './components/features/DentStats';
import { AiScanner } from './components/features/AiScanner';
import { DentalSearchEngine } from './components/features/DentalSearchEngine';
import { DentPrepHub } from './components/features/DentPrepHub';
import { DentaScribe } from './components/features/DentaScribe';
import { Settings } from './components/features/Settings';
import { DentaMart } from './components/features/DentaMart';
import { DentaLabConnect } from './components/features/DentaLabConnect';
import { DentaVersity } from './components/features/Dentaversity';
import { DentaVault } from './components/features/DentaVault';
import { DentalDiary } from './components/features/DentalDiary';
import { SymptomChecker } from './components/features/SymptomChecker';
import { MythBusters } from './components/features/MythBusters';
import { ProcedurePedia } from './components/features/ProcedurePedia';
import { InsuranceDecoder } from './components/features/InsuranceDecoder';
import { OralScreen } from './components/features/OralScreen';
import { TraumaCareCompanion } from './components/features/TraumaCareCompanion';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { DentaAI } from './components/features/DentaAI';
import { PatientCompanion } from './components/features/PatientCompanion';
import { TeleDentAI } from './components/features/TeleDentAI';
import { DentaSim } from './components/features/DentaSim';
import { CdeAi } from './components/features/CdeAi';
import { DentaJourney } from './components/features/DentaJourney';
import { CommandPalette } from './components/common/CommandPalette';
import { DentaSlides } from './components/features/DentaSlides';

interface AppLayoutProps {
  SidebarComponent: React.FC<any>;
  children: React.ReactNode;
  rolePrefix: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ SidebarComponent, children, rolePrefix }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDentaAiOpen, setIsDentaAiOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(isOpen => !isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getTitle = () => {
    const pathTitleMap: { [key: string]: string } = {
      '/dashboard': 'header.title.dashboard',
      '/dentforge': 'header.title.dentforge',
      '/dentomedia': 'header.title.dentomedia',
      '/dentafeed': 'header.title.dentafeed',
      '/dentahunt': 'header.title.dentahunt',
      '/dentaround': 'header.title.dentaround',
      '/dentradar': 'header.title.dentradar',
      '/dentamart': 'header.title.dentamart',
      '/dentsync': 'header.title.dentsync',
      '/dentalab-connect': 'header.title.dentalab_connect',
      '/dentstats': 'header.title.dentstats',
      '/dentaversity': 'header.title.dentaversity',
      '/dentavault': 'header.title.dentavault',
      '/dentascribe': 'header.title.dentascribe',
      '/dentaslides': 'header.title.dentaslides',
      '/dentasim': 'header.title.dentasim',
      '/cde-ai': 'header.title.cdeai',
      '/dentajourney': 'header.title.dentajourney',
      '/dental-diary': 'header.title.dental_diary',
      '/ai-scanner': 'header.title.ai_scanner',
      '/symptom-checker': 'header.title.symptom_checker',
      '/myth-busters': 'header.title.myth_busters',
      '/procedure-pedia': 'header.title.procedure_pedia',
      '/insurance-decoder': 'header.title.insurance_decoder',
      '/oralscreen': 'header.title.oralscreen',
      '/trauma-care': 'header.title.trauma_care',
      '/patient-companion': 'header.title.patient_companion',
      '/search-engine': 'header.title.search_engine',
      '/prep-hub': 'header.title.prep_hub',
      '/settings': 'header.title.settings',
      '/teledent-ai': 'header.title.teledent_ai',
      '/': 'header.title.dashboard'
    };
    
    const pathWithoutRole = location.pathname.replace(rolePrefix, '');
    const matchingKey = Object.keys(pathTitleMap)
        .sort((a, b) => b.length - a.length)
        .find(key => key !== '/' && pathWithoutRole.startsWith(key));

    const key = pathTitleMap[matchingKey || '/'] || 'header.title.default';
    const translated = t(key);
    return translated === key ? 'DentAssist' : translated;
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(!isSidebarOpen);
    } else {
      setSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleAiNavigate = (path: string) => {
    navigate(`${rolePrefix}${path}`);
  };
  
  return (
    <>
      <div className="flex h-screen bg-background-dark text-text-primary-dark font-sans">
        <SidebarComponent 
          isOpen={isSidebarOpen} 
          isCollapsed={isSidebarCollapsed} 
          setSidebarOpen={setSidebarOpen} 
        />
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <Header 
              title={getTitle()}
              onMenuClick={toggleSidebar} 
              isSidebarCollapsed={isSidebarCollapsed}
              onDentaAiClick={() => setIsDentaAiOpen(true)}
              onCommandPaletteClick={() => setCommandPaletteOpen(true)}
              rolePrefix={rolePrefix}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background-dark">
             <div key={location.pathname} className="animate-slide-in-up p-6 sm:p-8 lg:p-10">
                {children}
            </div>
          </main>
        </div>
      </div>
      <DentaAI isOpen={isDentaAiOpen} onClose={() => setIsDentaAiOpen(false)} onNavigate={handleAiNavigate} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)}
        rolePrefix={rolePrefix}
      />
    </>
  );
};

const StudentRoutes: React.FC = () => (
  <AppLayout SidebarComponent={StudentSidebar} rolePrefix="/student">
    <ReactRouterDOM.Routes>
      <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="dashboard" replace />} />
      <ReactRouterDOM.Route path="dashboard" element={<StudentDashboard />} />
      {/* Primary Features */}
      <ReactRouterDOM.Route path="dentforge" element={<Dentforge />} />
      <ReactRouterDOM.Route path="dentomedia" element={<Dentomedia />} />
      <ReactRouterDOM.Route path="dentafeed" element={<Dentafeed />} />
      <ReactRouterDOM.Route path="dentahunt" element={<DentaHunt />} />
      <ReactRouterDOM.Route path="dentaround" element={<Dentaround />} />
      <ReactRouterDOM.Route path="dentradar" element={<Dentradar />} />
      <ReactRouterDOM.Route path="dentamart" element={<DentaMart />} />
      
      {/* Student Tools */}
      <ReactRouterDOM.Route path="dentaversity" element={<DentaVersity />} />
      <ReactRouterDOM.Route path="dentavault" element={<DentaVault />} />
      <ReactRouterDOM.Route path="dentascribe" element={<DentaScribe />} />
      <ReactRouterDOM.Route path="dentaslides" element={<DentaSlides />} />
      <ReactRouterDOM.Route path="prep-hub" element={<DentPrepHub />} />
      <ReactRouterDOM.Route path="search-engine" element={<DentalSearchEngine />} />
      <ReactRouterDOM.Route path="dentasim" element={<DentaSim />} />
      
      <ReactRouterDOM.Route path="settings" element={<Settings />} />
    </ReactRouterDOM.Routes>
  </AppLayout>
);

const ProfessionalRoutes: React.FC = () => (
  <AppLayout SidebarComponent={ProfessionalSidebar} rolePrefix="/professional">
    <ReactRouterDOM.Routes>
        <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="dashboard" replace />} />
        <ReactRouterDOM.Route path="dashboard" element={<ProfessionalDashboard />} />
        <ReactRouterDOM.Route path="dentforge" element={<Dentforge />} />
        <ReactRouterDOM.Route path="dentomedia" element={<Dentomedia />} />
        <ReactRouterDOM.Route path="dentafeed" element={<Dentafeed />} />
        <ReactRouterDOM.Route path="dentahunt" element={<DentaHunt />} />
        <ReactRouterDOM.Route path="dentaround" element={<Dentaround />} />
        <ReactRouterDOM.Route path="dentradar" element={<Dentradar />} />
        <ReactRouterDOM.Route path="dentamart" element={<DentaMart />} />
        <ReactRouterDOM.Route path="dentsync/*" element={<DentSync />} />
        <ReactRouterDOM.Route path="dentalab-connect" element={<DentaLabConnect />} />
        <ReactRouterDOM.Route path="dentstats" element={<DentStats />} />
        <ReactRouterDOM.Route path="dental-diary" element={<DentalDiary />} />
        <ReactRouterDOM.Route path="teledent-ai" element={<TeleDentAI />} />
        <ReactRouterDOM.Route path="cde-ai" element={<CdeAi />} />
        <ReactRouterDOM.Route path="settings" element={<Settings />} />
    </ReactRouterDOM.Routes>
  </AppLayout>
);

const PublicRoutes: React.FC = () => (
  <AppLayout SidebarComponent={PublicSidebar} rolePrefix="/public">
    <ReactRouterDOM.Routes>
      <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="dashboard" replace />} />
      <ReactRouterDOM.Route path="dashboard" element={<PublicDashboard />} />
      <ReactRouterDOM.Route path="patient-companion" element={<PatientCompanion />} />
      <ReactRouterDOM.Route path="symptom-checker" element={<SymptomChecker />} />
      <ReactRouterDOM.Route path="ai-scanner" element={<AiScanner />} />
      <ReactRouterDOM.Route path="oralscreen" element={<OralScreen />} />
      <ReactRouterDOM.Route path="procedure-pedia" element={<ProcedurePedia />} />
      <ReactRouterDOM.Route path="myth-busters" element={<MythBusters />} />
      <ReactRouterDOM.Route path="insurance-decoder" element={<InsuranceDecoder />} />
      <ReactRouterDOM.Route path="trauma-care" element={<TraumaCareCompanion />} />
      <ReactRouterDOM.Route path="dentajourney" element={<DentaJourney />} />
      <ReactRouterDOM.Route path="dentradar" element={<Dentradar />} />
      <ReactRouterDOM.Route path="settings" element={<Settings />} />
    </ReactRouterDOM.Routes>
  </AppLayout>
);


const App: React.FC = () => {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <CartProvider>
          <ReactRouterDOM.HashRouter>
            <ReactRouterDOM.Routes>
              <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="/select-role" replace />} />
              <ReactRouterDOM.Route path="/select-role" element={<RoleSelectionPage />} />
              <ReactRouterDOM.Route path="/student/*" element={<StudentRoutes />} />
              <ReactRouterDOM.Route path="/professional/*" element={<ProfessionalRoutes />} />
              <ReactRouterDOM.Route path="/public/*" element={<PublicRoutes />} />
              <ReactRouterDOM.Route path="/admin" element={<AdminDashboard />} />
              <ReactRouterDOM.Route path="/app/*" element={<ReactRouterDOM.Navigate to="/select-role" replace />} />
            </ReactRouterDOM.Routes>
          </ReactRouterDOM.HashRouter>
        </CartProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
};

export default App;
