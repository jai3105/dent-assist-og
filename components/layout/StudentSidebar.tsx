
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { Bot, Users, Newspaper, Briefcase, Calendar, Compass, Store, BrainCircuit, Feather, GraduationCap, Search, Settings, LayoutDashboard, ClipboardList, Archive, Presentation } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; isCollapsed: boolean }> = ({ to, icon, label, isCollapsed }) => (
  <ReactRouterDOM.NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center p-3 my-1 rounded-md transition-colors duration-200 group relative ${
        isActive 
          ? 'bg-brand-primary/10 text-brand-primary font-semibold' 
          : 'text-text-secondary-dark hover:bg-surface-light hover:text-text-primary-dark'
      }`
    }
  >
    {({ isActive }) => (
        <>
            <div className={`w-6 text-center transition-all duration-200 group-hover:scale-110 ${isActive ? 'text-brand-primary' : ''}`}>{icon}</div>
            {!isCollapsed && (
              <span className="ml-4 font-medium">{label}</span>
            )}
            {isCollapsed && (
              <div className="absolute left-full rounded-md px-2 py-1 ml-4 bg-surface-light text-text-primary-dark text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap shadow-lg border border-border-dark z-20">
                {label}
              </div>
            )}
        </>
    )}
  </ReactRouterDOM.NavLink>
);

export const StudentSidebar: React.FC<SidebarProps> = ({ isOpen, isCollapsed, setSidebarOpen }) => {
  const { t } = useTranslation();
  const sidebarClasses = `
    flex-shrink-0 transition-all duration-300 ease-in-out 
    flex flex-col border-r 
    fixed md:relative md:translate-x-0 h-full z-40 glass-effect
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    ${isCollapsed ? 'md:w-20' : 'md:w-64'}
  `;

  return (
    <>
      {isOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden"></div>}
      <aside className={sidebarClasses}>
        <div className={`flex items-center justify-center h-16 border-b border-border-dark flex-shrink-0 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <svg width="32" height="32" viewBox="0 0 24 24" className="text-brand-primary">
            <path fill="currentColor" d="M17 2H7c-1.1 0-2 .9-2 2v5c0 1.66 1.34 3 3 3h1.34c.48 0 .93.2 1.25.53A3.991 3.991 0 0 0 12 14a3.991 3.991 0 0 0 1.41-1.47c.32-.33.77-.53 1.25-.53H16c1.66 0 3-1.34 3-3V4c0-1.1-.9-2-2-2zm-3 15.5c-1.18 1.18-3.03 1.18-4.2 0l-.8-.8c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41l.8.8c1.95 1.95 5.12 1.95 7.07 0l.8-.8c.39-.39.39-1.02 0-1.41s-1.02-.39-1.41 0l-.8.8z"/>
          </svg>
          {!isCollapsed && <h1 className="text-2xl font-bold text-text-primary-dark ml-2 tracking-tighter">{t('sidebar.logo')}</h1>}
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          <NavItem to="/student/dashboard" icon={<LayoutDashboard size={20}/>} label="Dashboard" isCollapsed={isCollapsed} />
          <div>
            <h3 className={`px-3 py-2 text-xs font-semibold uppercase text-text-tertiary-dark tracking-wider ${isCollapsed ? 'text-center' : ''}`}>
              {isCollapsed ? t('sidebar.app') : t('sidebar.primaryFeatures')}
            </h3>
            <NavItem to="/student/dentforge" icon={<Bot size={20}/>} label={t('sidebar.dentforge.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/dentomedia" icon={<Users size={20}/>} label={t('sidebar.dentomedia.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/dentafeed" icon={<Newspaper size={20}/>} label={t('sidebar.dentafeed.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/dentahunt" icon={<Briefcase size={20}/>} label={t('sidebar.dentahunt.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/dentaround" icon={<Calendar size={20}/>} label={t('sidebar.dentaround.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/dentradar" icon={<Compass size={20}/>} label={t('sidebar.dentradar.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/dentamart" icon={<Store size={20}/>} label={t('sidebar.dentamart.label')} isCollapsed={isCollapsed} />
          </div>

          <div className="pt-4">
            <h3 className={`px-3 py-2 text-xs font-semibold uppercase text-text-tertiary-dark tracking-wider ${isCollapsed && 'text-center'}`}>
              {isCollapsed ? t('sidebar.pro') : 'Student Tools'}
            </h3>
            <NavItem to="/student/dentaversity" icon={<BrainCircuit size={20}/>} label={t('sidebar.dentaversity.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/dentavault" icon={<Archive size={20}/>} label={t('sidebar.dentavault.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/dentascribe" icon={<Feather size={20}/>} label={t('sidebar.dentascribe.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/dentaslides" icon={<Presentation size={20}/>} label={t('sidebar.dentaslides.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/prep-hub" icon={<GraduationCap size={20}/>} label={t('sidebar.prepHub.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/search-engine" icon={<Search size={20}/>} label={t('sidebar.searchEngine.label')} isCollapsed={isCollapsed} />
            <NavItem to="/student/dentasim" icon={<ClipboardList size={20}/>} label={t('sidebar.dentasim.label')} isCollapsed={isCollapsed} />
          </div>
        </nav>
          <div className="p-2 border-t border-border-dark flex-shrink-0">
               <NavItem to="/student/settings" icon={<Settings size={20}/>} label={t('sidebar.settings.label')} isCollapsed={isCollapsed}/>
          </div>
      </aside>
    </>
  );
};
