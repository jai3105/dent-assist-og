import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, User, Settings, LogOut, Globe, Mic, Users, ShoppingCart, Menu, ArrowLeft, Search } from 'lucide-react';
import { useTranslation, supportedLanguages } from '../../contexts/LanguageContext';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
  onDentaAiClick: () => void;
  onCommandPaletteClick: () => void;
  rolePrefix: string;
}

const LanguageDropdown: React.FC = () => {
    const { language, setLanguage } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLanguageChange = (langCode: string) => {
        setLanguage(langCode);
        setIsOpen(false);
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentLang = supportedLanguages.find(l => l.code === language);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-text-secondary-dark hover:text-white transition-colors">
                <Globe size={20} />
                <span className="hidden md:inline">{currentLang?.code.toUpperCase()}</span>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-surface-light rounded-lg shadow-lg border border-border-dark z-50 animate-fade-in">
                    <ul className="py-1 max-h-60 overflow-y-auto">
                        {supportedLanguages.map(lang => (
                            <li key={lang.code}>
                                <button onClick={() => handleLanguageChange(lang.code)} className={`w-full text-left px-4 py-2 text-sm ${language === lang.code ? 'bg-brand-primary text-background-dark' : 'text-text-secondary-dark hover:bg-surface-dark'}`}>
                                    {lang.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const ProfileDropdown: React.FC<{ rolePrefix: string }> = ({ rolePrefix }) => {
    const { t } = useTranslation();
    return (
        <div className="absolute top-full right-0 mt-2 w-48 bg-surface-light rounded-lg shadow-lg border border-border-dark z-50 animate-fade-in">
            <div className="py-1">
                <div className="px-4 py-2 border-b border-border-dark">
                    <p className="text-sm font-semibold text-text-primary-dark">Dr. Priya Sharma</p>
                    <p className="text-xs text-text-secondary-dark truncate">priya.sharma@dentassist.com</p>
                </div>
                <ReactRouterDOM.Link to={`${rolePrefix}/settings`} className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary-dark hover:bg-surface-dark hover:text-text-primary-dark transition-colors">
                    <Settings size={16} />
                    <span>{t('header.profile.settings')}</span>
                </ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/select-role" className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary-dark hover:bg-surface-dark hover:text-text-primary-dark transition-colors">
                    <Users size={16} />
                    <span>{t('header.profile.switch')}</span>
                </ReactRouterDOM.Link>
                <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary-dark hover:bg-surface-dark hover:text-red-400 transition-colors">
                    <LogOut size={16} />
                    <span>{t('header.profile.logout')}</span>
                </a>
            </div>
        </div>
    );
};

const NotificationDropdown: React.FC = () => {
    const { notifications, markAsRead } = useNotifications();
    const { t } = useTranslation();
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-surface-light rounded-lg shadow-lg border border-border-dark z-50 animate-fade-in">
            <div className="p-3 font-semibold text-text-primary-dark border-b border-border-dark">
                {t('header.notifications.title')} {unreadCount > 0 && `(${unreadCount})`}
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-3 border-l-4 ${n.read ? 'border-transparent' : 'border-brand-primary bg-brand-primary/10'} hover:bg-surface-dark cursor-pointer transition-colors`}>
                        <p className="font-bold text-sm text-text-primary-dark">{n.title}</p>
                        <p className="text-xs text-text-secondary-dark">{n.message}</p>
                        <p className="text-xs text-slate-500 text-right mt-1">{n.timestamp}</p>
                    </div>
                )) : (
                    <p className="p-4 text-center text-sm text-text-secondary-dark">{t('header.notifications.noNew')}</p>
                )}
            </div>
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick, isSidebarCollapsed, onDentaAiClick, onCommandPaletteClick, rolePrefix }) => {
  const { itemCount } = useCart();
  const { notifications } = useNotifications();
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNotifsOpen, setNotifsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
          if (notifsRef.current && !notifsRef.current.contains(event.target as Node)) setNotifsOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-16 glass-effect px-4 sm:px-6 border-b flex-shrink-0 sticky top-0 z-30">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="text-text-secondary-dark hover:text-text-primary-dark focus:outline-none md:hidden">
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold ml-4 text-text-primary-dark">{title}</h1>
      </div>
      <div className="flex items-center space-x-3 sm:space-x-4">
          <button onClick={onCommandPaletteClick} className="hidden md:flex items-center gap-2 text-text-secondary-dark hover:text-white transition-colors bg-surface-dark/50 border border-border-dark px-3 py-1.5 rounded-lg text-sm">
             <Search size={16}/>
             <span>Search...</span>
             <kbd className="font-sans text-xs bg-surface-light px-1.5 py-0.5 rounded-md border border-border-dark">⌘K</kbd>
          </button>
          <LanguageDropdown />
          <button onClick={onDentaAiClick} className="text-text-secondary-dark hover:text-brand-primary transition-colors" title="Activate DentaAI Voice Assistant">
              <Mic size={22} />
          </button>
          <div className="relative" ref={notifsRef}>
            <button onClick={() => setNotifsOpen(!isNotifsOpen)} className="relative text-text-secondary-dark hover:text-brand-primary transition-colors cursor-pointer">
              <Bell size={22}/>
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-surface-dark">
                  {unreadNotifs}
                </span>
              )}
            </button>
            {isNotifsOpen && <NotificationDropdown />}
          </div>
          {(rolePrefix === '/professional' || rolePrefix === '/student') && (
            <ReactRouterDOM.Link to={`${rolePrefix}/dentamart`} className="relative text-text-secondary-dark hover:text-brand-primary transition-colors cursor-pointer">
              <ShoppingCart size={22}/>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface-dark">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </ReactRouterDOM.Link>
          )}
          <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(!isProfileOpen)} className="w-9 h-9 bg-brand-primary rounded-full flex items-center justify-center font-bold text-background-dark ring-2 ring-offset-2 ring-offset-surface-dark ring-brand-secondary">
                  PS
              </button>
              {isProfileOpen && <ProfileDropdown rolePrefix={rolePrefix} />}
          </div>
      </div>
    </header>
  );
};