import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
// don't want to use this?
// have a look at the Quick start guide
// for passing in lng and translations on init

i18n
  // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  // learn more: https://github.com/i18next/i18next-http-backend
  // want your translations to be loaded from a professional CDN? => https://github.com/locize/react-tutorial#step-2---use-the-locize-cdn
  .use(Backend)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    // Both bundles are BASE languages (public/locales/en, public/locales/nb),
    // and `load: "languageOnly"` strips any region before requesting one. So
    // a browser reporting nb-NO, en-US or en-GB all resolve to a file that
    // actually exists.
    //
    // This replaced a supportedLngs + nonExplicitSupportedLngs setup that
    // looked right and was subtly broken: with an "en-US" bundle, i18next
    // resolved the language down to base "en" and requested
    // /locales/en/translation.json, which did not exist. The SPA rewrite
    // answered with index.html, the JSON parse failed, and the UI rendered
    // raw keys ("about.header") instead of English. Keeping both bundles at
    // the base level removes the specific/base mismatch entirely rather than
    // trying to configure around it.
    fallbackLng: "en",
    supportedLngs: ["en", "nb"],
    load: "languageOnly",

    // Developer noise; do not ship it to visitors.
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;
