
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { studentSidebarConfig, professionalSidebarConfig, publicSidebarConfig } from '../layout/sidebarConfigs';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  rolePrefix: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, rolePrefix }) => {
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = ReactRouterDOM.useNavigate();
  const { t } = useTranslation();

  const commands = useMemo(() => {
    let config = [];
    if (rolePrefix.startsWith('/student')) {
      config = studentSidebarConfig;
    } else if (rolePrefix.startsWith('/professional')) {
      config = professionalSidebarConfig;
    } else {
      config = publicSidebarConfig;
    }
    
    return config.flatMap(group => 
      group.items.map(item => ({
        ...item,
        label: t(item.translationKey),
        group: t(group.titleKey),
      }))
    );
  }, [rolePrefix, t]);

  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    const lowercasedSearch = search.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(lowercasedSearch) ||
      cmd.group.toLowerCase().includes(lowercasedSearch)
    );
  }, [search, commands]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setSearch('');
    }
    setActiveIndex(0);
  }, [isOpen]);
  
  useEffect(() => {
      setActiveIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = filteredCommands[activeIndex];
        if (command) {
          navigate(command.path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands, navigate, onClose]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-xl border border-border-dark shadow-2xl glass-effect"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center p-4 border-b border-border-dark">
          <Search className="text-text-secondary-dark mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for a page or command..."
            className="w-full bg-transparent text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none text-lg"
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => (
                <div
                    key={cmd.path}
                    data-active={index === activeIndex}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => {
                        navigate(cmd.path);
                        onClose();
                    }}
                    className="command-palette-item flex items-center justify-between p-3 rounded-lg cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <cmd.icon className="text-text-secondary-dark" size={20} />
                        <div>
                            <span className="font-semibold">{cmd.label}</span>
                            <span className="text-xs ml-2 opacity-70">{cmd.group}</span>
                        </div>
                    </div>
                    <CornerDownLeft size={16} />
                </div>
            ))
          ) : (
            <p className="text-center p-8 text-text-secondary-dark">No results found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
