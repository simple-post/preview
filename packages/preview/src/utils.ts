import { PREVIEW_PLATFORMS, type PreviewPlatform } from "./types";

const platformSet = new Set<string>(PREVIEW_PLATFORMS);

export function normalizePreviewPlatform(platform: string): PreviewPlatform | undefined {
  const normalized = platform.toLowerCase() === "twitter" ? "x" : platform.toLowerCase();
  return platformSet.has(normalized) ? (normalized as PreviewPlatform) : undefined;
}

export function getUniquePreviewPlatforms(platforms: string[]): PreviewPlatform[] {
  const result: PreviewPlatform[] = [];
  const seen = new Set<PreviewPlatform>();
  for (const value of platforms) {
    const platform = normalizePreviewPlatform(value);
    if (platform && !seen.has(platform)) {
      seen.add(platform);
      result.push(platform);
    }
  }
  return result;
}

export function normalizePreviewTitle(value: string | undefined, fallback: string): string {
  const title = value?.split("\n").map((line) => line.trim()).find(Boolean) || fallback;
  return title.replace(/^#+\s*/, "") || fallback;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function safeUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, typeof document === "undefined" ? "https://preview.invalid" : document.baseURI);
    if (["http:", "https:", "blob:", "data:"].includes(url.protocol)) return value;
  } catch {
    return undefined;
  }
  return undefined;
}
