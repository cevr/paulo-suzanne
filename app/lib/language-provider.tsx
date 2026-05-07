import React, { type ReactNode } from 'react';

import type { SiteContent } from '~/content/schema';

type Language = 'en' | 'fr';

const LanguageContext = React.createContext<Language | undefined>(undefined);

const LanguageTranslationContext = React.createContext<
  ((en: string, fr: string) => string) | undefined
>(undefined);

const ContentContext = React.createContext<SiteContent | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLanguage,
  content,
}: {
  children: ReactNode;
  initialLanguage: Language;
  content: SiteContent;
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
        <ContentContext.Provider value={content}>
          {children}
        </ContentContext.Provider>
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

export function useContent() {
  const context = React.useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a LanguageProvider');
  }
  return context;
}
