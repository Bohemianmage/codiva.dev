import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/core.json';
import es from './locales/es/core.json';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'es',
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    load: 'languageOnly',
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
