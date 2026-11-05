import en from "./locales/en.json";
import { catalogs } from "./locales/catalogs";

export const PREVIEW_LOCALES = ["en", "es", "pt-BR", "fr", "de", "ja", "it", "ko", "zh-Hans", "zh-Hant", "ar", "hi", "id", "tr", "bg"] as const;
export type PreviewLocale = typeof PREVIEW_LOCALES[number];
export type PreviewMessage = keyof typeof en;
export type PreviewCatalog = Record<PreviewMessage, string>;

/** Resolve a language without consulting browser globals, including on the server. */
export function resolvePreviewLocale(input?: string): PreviewLocale {
  if (!input) return "en";
  try {
    const locale = new Intl.Locale(input);
    const exact = PREVIEW_LOCALES.find(value => value.toLowerCase() === locale.baseName.toLowerCase());
    if (exact) return exact;
    if (locale.language === "zh") return locale.maximize().script === "Hant" ? "zh-Hant" : "zh-Hans";
    if (locale.language === "pt") return "pt-BR";
    return PREVIEW_LOCALES.find(value => value === locale.language) || "en";
  } catch {
    return "en";
  }
}

export function previewI18n(input?: string) {
  const locale = resolvePreviewLocale(input);
  const messages: PreviewCatalog = catalogs[locale];
  const number = new Intl.NumberFormat(locale);
  return {
    locale,
    direction: locale === "ar" ? "rtl" as const : "ltr" as const,
    number: (value: number) => number.format(value),
    minuteAgo: new Intl.RelativeTimeFormat(locale, { style: "narrow" }).format(-1, "minute"),
    t(key: PreviewMessage, values: Record<string, string | number> = {}) {
      return messages[key].replace(/\{(\w+)\}/g, (placeholder, name: string) => {
        const value = values[name];
        return value === undefined ? placeholder : typeof value === "number" ? number.format(value) : value;
      });
    },
  };
}

export type PreviewI18n = ReturnType<typeof previewI18n>;
