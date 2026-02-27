import React, { type ReactNode } from 'react';

type Language = 'en' | 'fr';

const LanguageContext = React.createContext<Language | undefined>(undefined);

const LanguageTranslationContext = React.createContext<
  ((en: string, fr: string) => string) | undefined
>(undefined);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage: Language;
}) {
  const t = React.useCallback(
    (en: string, fr: string) => {
      return initialLanguage === 'en' ? en : fr;
    },
    [initialLanguage],
  );

  return (
    <LanguageContext.Provider value={initialLanguage}>
      <LanguageTranslationContext.Provider value={t}>
        {children}
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
    throw new Error('useTranslate must be used within a LanguageProvider');
  }
  return context;
}
