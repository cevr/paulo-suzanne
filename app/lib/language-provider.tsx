import React, { type ReactNode } from 'react';

import type { SiteContent } from '~/content/schema';

import type { Lang } from './language';

const LanguageContext = React.createContext<Lang | undefined>(undefined);
const ContentContext = React.createContext<SiteContent | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLanguage,
  content,
}: {
  children: ReactNode;
  initialLanguage: Lang;
  content: SiteContent;
}) {
  return (
    <LanguageContext.Provider value={initialLanguage}>
      <ContentContext.Provider value={content}>
        {children}
      </ContentContext.Provider>
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

export function useContent() {
  const context = React.useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a LanguageProvider');
  }
  return context;
}
