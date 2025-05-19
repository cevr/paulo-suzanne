import React, { type ReactNode } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (en: string, fr: string) => string;
}

const LanguageContext = React.createContext<
  LanguageContextType['language'] | undefined
>(undefined);

const LanguageTranslationContext = React.createContext<
  LanguageContextType['t'] | undefined
>(undefined);

const SetLanguageContext = React.createContext<
  React.Dispatch<React.SetStateAction<Language>> | undefined
>(undefined);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  const [language, setLanguage] = React.useState<Language>(initialLanguage);
  const t = React.useCallback(
    (en: string, fr: string) => {
      return language === 'en' ? en : fr;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={language}>
      <LanguageTranslationContext.Provider value={t}>
        <SetLanguageContext.Provider value={setLanguage}>
          {children}
        </SetLanguageContext.Provider>
      </LanguageTranslationContext.Provider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslate() {
  const context = React.useContext(LanguageTranslationContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useSetLanguage() {
  const context = React.useContext(SetLanguageContext);
  if (context === undefined) {
    throw new Error('useSetLanguage must be used within a LanguageProvider');
  }
  return context;
}
