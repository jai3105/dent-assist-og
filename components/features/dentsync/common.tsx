
import React, { useEffect, ReactNode, createContext, useReducer, useContext } from 'react';
import ReactDOM from 'react-dom';
import { ICONS, AppState, AppAction, appReducer, initialState } from './data';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return ReactDOM.createPortal(
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity p-4 animate-fade-in" 
        aria-modal="true" 
        role="dialog"
        onClick={onClose}
    >
      <div 
        className={`bg-surface-dark rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col pointer-events-auto border border-border-dark`}
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-dark">
          <h3 className="text-xl font-semibold text-text-primary-dark">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-text-secondary-dark hover:bg-border-dark hover:text-text-primary-dark" aria-label="Close modal">
            {ICONS.close}
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- APP CONTEXT & REDUCER (MOVED HERE) ---
const APP_STORAGE_KEY = 'dentSyncDataV2';

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> }>({
  state: initialState, dispatch: () => null,
});

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};
