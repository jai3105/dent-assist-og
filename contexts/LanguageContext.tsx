import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

type Translations = { [key: string]: string };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'ur', name: 'اردو' },
  { code: 'gu', name: 'ગુજરાતી' },
];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>('en');
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch(`/translations/${language}.json`);
        if (!response.ok) {
            console.warn(`Translation file for ${language}.json not found, falling back to English.`);
            const fallbackResponse = await fetch(`/translations/en.json`);
            const data = await fallbackResponse.json();
            setTranslations(data);
            return;
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error('Could not load translation file', error);
         try {
            const fallbackResponse = await fetch(`/translations/en.json`);
            const data = await fallbackResponse.json();
            setTranslations(data);
        } catch (fallbackError) {
            console.error('Could not load fallback translation file', fallbackError);
        }
      }
    };
    fetchTranslations();
  }, [language]);

  const t = (key: string, options?: { [key: string]: string | number }): string => {
    let translation = translations[key] || key;
    if (options) {
        Object.keys(options).forEach(optionKey => {
            translation = translation.replace(new RegExp(`{{${optionKey}}}`, 'g'), String(options[optionKey]));
        });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};