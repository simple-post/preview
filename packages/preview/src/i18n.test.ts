import { describe, expect, it } from "vitest";
import { PREVIEW_LOCALES, resolvePreviewLocale } from "./i18n";
import { catalogs } from "./locales/catalogs";
import { renderPostPreviewHtml } from "./render";
import { defineSimplePostPreview } from "./web-component";

const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();

describe("localized preview contract", () => {
  it.each(PREVIEW_LOCALES)("ships a complete %s catalog with matching placeholders", locale => {
    expect(Object.keys(catalogs[locale]).sort()).toEqual(Object.keys(catalogs.en).sort());
    for (const [key, value] of Object.entries(catalogs[locale])) {
      expect(value.trim()).not.toBe("");
      expect(placeholders(value)).toEqual(placeholders(catalogs.en[key as keyof typeof catalogs.en]));
    }
  });

  it.each([
    ["fr-CA", "fr"], ["pt-PT", "pt-BR"], ["zh-TW", "zh-Hant"],
    ["zh-HK", "zh-Hant"], ["zh-CN", "zh-Hans"], ["zh-Hant-CN", "zh-Hant"],
    ["ar-EG", "ar"], ["bg-BG", "bg"], ["invalid_tag", "en"], ["xx", "en"],
  ])("negotiates %s as %s", (input, resolved) => {
    expect(resolvePreviewLocale(input)).toBe(resolved);
  });

  it("keeps independent locale state and preserves user content and media alt text", () => {
    const data = {
      account: { platform: "instagram", displayName: "Your account", username: "my_name" },
      message: "Your post will appear here.",
      media: [{ type: "image" as const, url: "https://example.com/photo.jpg", alt: "Post media" }],
    };
    const arabic = renderPostPreviewHtml({ ...data, locale: "ar" });
    const english = renderPostPreviewHtml({ ...data, locale: "en" });
    expect(arabic).toContain('lang="ar" dir="rtl"');
    expect(arabic).toContain("Your post will appear here.");
    expect(arabic).toContain('alt="Post media"');
    expect(english).toContain('lang="en" dir="ltr"');
    expect(english).toContain('aria-label="Post preview"');
  });

  it("translates placeholders and carousel accessibility labels", () => {
    const html = renderPostPreviewHtml({
      locale: "bg", account: { platform: "instagram" },
      media: [1, 2].map(index => ({ type: "image", url: `https://example.com/${index}.jpg` })),
    });
    expect(html).toContain(catalogs.bg.captionPlaceholder);
    expect(html).toContain(`aria-label="${catalogs.bg.nextMedia}"`);
    expect(html).not.toContain("{count}");
    expect(html).not.toContain("{index}");
  });

  it("updates and removes the locale attribute without changing the post", () => {
    defineSimplePostPreview();
    const element = document.createElement("simple-post-preview");
    element.data = { account: { platform: "x" }, message: "Do not translate me." };
    document.body.append(element);
    element.setAttribute("locale", "bg");
    expect(element.shadowRoot?.querySelector(".sp-viewport")?.getAttribute("lang")).toBe("bg");
    expect(element.shadowRoot?.textContent).toContain("Do not translate me.");
    element.removeAttribute("locale");
    expect(element.shadowRoot?.querySelector(".sp-viewport")?.getAttribute("lang")).toBe("en");
    element.remove();
  });
});
