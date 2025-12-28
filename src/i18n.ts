import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import ro from "@/locales/ro.json";

export const LANGUAGE_STORAGE_KEY = "amber.language";

export const supportedLanguages = ["en", "ro"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export function getStoredLanguage(): SupportedLanguage | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "ro") {
        return stored;
    }

    return undefined;
}

export function setStoredLanguage(language: SupportedLanguage) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function getInitialLanguage(): SupportedLanguage {
    const stored = getStoredLanguage();
    if (stored) {
        return stored;
    }

    const browserLanguage = (typeof navigator !== "undefined" ? navigator.language : "")
        .toLowerCase()
        .split("-")[0];

    return browserLanguage === "ro" ? "ro" : "en";
}

void i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ro: { translation: ro },
        },
        lng: getInitialLanguage(),
        fallbackLng: "en",
        supportedLngs: ["en", "ro"],
        interpolation: {
            escapeValue: false,
        },
    })
    .then(() => {
        const current = i18n.resolvedLanguage === "ro" ? "ro" : "en";
        setStoredLanguage(current);
    });

export async function changeAppLanguage(language: SupportedLanguage) {
    setStoredLanguage(language);
    await i18n.changeLanguage(language);
}

export default i18n;
