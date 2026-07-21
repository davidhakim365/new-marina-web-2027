import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import type { InitOptions } from "i18next";

import enTranslation from "./locales/en/translation.json";
import arTranslation from "./locales/ar/translation.json";

const applyDocumentLanguage = (lng: string) => {
  const isArabic = lng === "ar" || lng.startsWith("ar");
  document.documentElement.lang = isArabic ? "ar" : "en";
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.title = isArabic ? "أ/ مارينا عاطف" : "Mrs Marina Atef";
};

const options: InitOptions = {
  resources: {
    en: {
      translation: enTranslation,
    },
    ar: {
      translation: arTranslation,
    },
  },
  fallbackLng: "ar",
  lng: undefined,
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ["localStorage", "navigator"],
    caches: ["localStorage"],
    lookupLocalStorage: "i18nextLng",
  },
};

i18n.use(LanguageDetector).use(initReactI18next).init(options).then(() => {
  // Prefer Arabic on first visit when no stored preference exists
  const stored = localStorage.getItem("i18nextLng");
  if (!stored) {
    i18n.changeLanguage("ar");
  }
  applyDocumentLanguage(i18n.language);
});

i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
