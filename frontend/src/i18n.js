import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import de from './locales/de.json';
import ru from './locales/ru.json';
import fr from './locales/fr.json';
import cs from './locales/cs.json';
import sr from './locales/sr.json';
import pl from './locales/pl.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      ru: { translation: ru },
      fr: { translation: fr },
      cs: { translation: cs },
      sr: { translation: sr },
      pl: { translation: pl },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
