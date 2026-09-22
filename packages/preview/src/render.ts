import { musicIcon } from "./icons";
import { emptyMedia, mediaAsset, platformMedia, initializeMedia } from "./media";
import { previewStyles } from "./styles";
import type { PostPreviewData, PreviewAccount, PreviewMedia, PreviewPlatform, PreviewTheme, PreviewThreadItem } from "./types";
import { escapeHtml as h, normalizePreviewPlatform, normalizePreviewTitle, safeUrl } from "./utils";

export const POST_PREVIEW_RUNTIME_EVENT = "simple-post-preview:runtime-update";
const runtimeKey = Symbol.for("@simple-post/preview/runtime");

interface PostPreviewRuntime {
  render(target: HTMLElement | ShadowRoot, data: PostPreviewData): void;
}

interface NormalizedPreviewData {
  platform?: PreviewPlatform;
  theme: PreviewTheme;
  xMediaLayout: "carousel" | "grid";
  account: PreviewAccount;
  message: string;
  media: PreviewMedia[];
  options: Record<string, unknown>;
  thread: PreviewThreadItem[];
  previewDate: Date;
}

function normalizeData(data: PostPreviewData): NormalizedPreviewData {
  const date = new Date(data.previewDate ?? Date.now());
  return {
    platform: normalizePreviewPlatform(data.platform || data.account.platform),
    theme: data.theme === "light" ? "light" : "dark",
    xMediaLayout: data.xMediaLayout === "grid" ? "grid" : "carousel",
    account: data.account,
    message: data.message || "",
    media: Array.isArray(data.media) ? data.media : [],
    options: data.options || {},
    thread: Array.isArray(data.thread) ? data.thread : [],
    previewDate: Number.isNaN(date.getTime()) ? new Date() : date,
  };
}

function accountName(account: PreviewAccount): string {
  return account.displayName || account.username || "Your account";
}

function accountHandle(account: PreviewAccount): string {
  const value = account.username || account.displayName || "youraccount";
  return `@${value.replace(/^@/, "").replaceAll(/\s+/g, "").toLowerCase()}`;
}

function avatar(account: PreviewAccount, modifier = ""): string {
  const image = safeUrl(account.profilePicture);
  const fallback = accountName(account).match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() || "S";
  return `<span class="sp-avatar ${modifier}">${image ? `<img src="${h(image)}" alt="" />` : h(fallback)}</span>`;
}

function optionString(options: Record<string, unknown>, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function firstLine(value: string, fallback: string): string {
  return value.split("\n").map((line) => line.trim()).find(Boolean) || fallback;
}

function formatXTimestamp(date: Date): string {
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date);
  return `${time} · ${day}`;
}

function formatCompactTimestamp(date: Date): string {
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
  return `${time} · ${day}`;
}

function xPreview(data: NormalizedPreviewData): string {
  const { account, message, media, previewDate } = data;
  const mediaHtml = platformMedia(media, "x", "sp-x-media", data.xMediaLayout);
  const thread = data.thread.map((item) => `<div class="sp-x-thread"><div class="sp-row">${avatar(account)}<div class="sp-grow"><p class="sp-inline-meta sp-truncate"><b>${h(accountName(account))}</b><span class="sp-muted">${h(accountHandle(account))} · 1m</span></p><p class="sp-copy sp-x-thread-copy">${h(item.message)}</p>${platformMedia(item.media || [], "x", "sp-x-media", data.xMediaLayout)}</div></div></div>`).join("");
  return `<div class="sp-root sp-x"><div class="sp-x-main"><div class="sp-row sp-x-head">${avatar(account, "sp-avatar--48")}<div class="sp-grow"><p class="sp-x-name sp-truncate">${h(accountName(account))}</p><p class="sp-x-handle sp-truncate">${h(accountHandle(account))}</p></div></div><p class="sp-copy sp-x-copy">${message ? h(message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${mediaHtml}<p class="sp-x-time">${h(formatXTimestamp(previewDate))}</p></div>${thread}</div>`;
}

function instagramPreview(data: NormalizedPreviewData): string {
  const { account, message, media } = data;
  const first = media[0];
  return `<div class="sp-root sp-instagram"><div class="sp-row sp-instagram-head">${avatar(account, "sp-avatar--32")}<div class="sp-truncate">${h(accountHandle(account).slice(1))}</div></div><div class="sp-media--natural">${first ? platformMedia(media, "instagram") : `<div class="sp-instagram-blank">${emptyMedia("Add a photo or video")}</div>`}</div><p class="sp-copy sp-instagram-copy"><b>${h(accountHandle(account).slice(1))}</b>${message ? h(message) : `<span class="sp-muted">Your caption will appear here.</span>`}</p></div>`;
}

function facebookPreview(data: NormalizedPreviewData): string {
  const { account, message, media } = data;
  return `<div class="sp-root sp-facebook"><div class="sp-row sp-facebook-head">${avatar(account)}<div class="sp-grow"><p class="sp-facebook-name sp-truncate">${h(accountName(account))}</p><p class="sp-facebook-meta">Just now · Public</p></div></div><p class="sp-copy sp-facebook-copy">${message ? h(message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${platformMedia(media, "facebook")}</div>`;
}

function tiktokPreview(data: NormalizedPreviewData): string {
  const { account, media, options } = data;
  const caption = optionString(options, "title") || data.message || "Your caption will appear here.";
  return `<div class="sp-root sp-tiktok">${media[0] ? platformMedia(media, "tiktok", "sp-tiktok-media") : `<div class="sp-tiktok-fallback"></div>`}<div class="sp-tiktok-shade"></div><div class="sp-avatar sp-tiktok-avatar">${safeUrl(account.profilePicture) ? `<img src="${h(safeUrl(account.profilePicture))}" alt="" />` : h(accountName(account)[0] || "S")}</div><div class="sp-tiktok-copy"><p class="sp-handle">${h(accountHandle(account))}</p><p class="sp-copy sp-caption">${h(caption)}</p><p class="sp-sound">${musicIcon} original sound - ${h(accountHandle(account).slice(1))}</p></div></div>`;
}

function youtubePreview(data: NormalizedPreviewData): string {
  const { account, media, options } = data;
  const title = optionString(options, "title") || firstLine(data.message, "Your video title");
  const description = optionString(options, "description") || data.message;
  return `<div class="sp-root sp-youtube">${media[0] ? mediaAsset(media[0], true) : `<div class="sp-youtube-empty">${emptyMedia("Add a video")}</div>`}<div class="sp-youtube-info"><h2 class="sp-youtube-title">${h(title)}</h2><p class="sp-youtube-meta">Just now</p><div class="sp-row sp-youtube-channel">${avatar(account, "sp-avatar--36")}<div class="sp-grow"><p class="sp-truncate" style="font-size:12px;font-weight:600">${h(accountName(account))}</p><p class="sp-youtube-meta">${h(accountHandle(account))}</p></div></div>${description && description !== title ? `<p class="sp-copy sp-youtube-description">${h(description)}</p>` : ""}</div></div>`;
}

function telegramPreview(data: NormalizedPreviewData): string {
  const items = [{ message: data.message, media: data.media }, ...data.thread.map((item) => ({ message: item.message, media: item.media || [] }))];
  return `<div class="sp-root sp-telegram">${items.map((item) => `<div class="sp-bubble">${item.media.length ? platformMedia(item.media, "telegram", "sp-bubble-media") : ""}<div class="sp-bubble-copy"><p class="sp-copy">${item.message ? h(item.message) : `<span class="sp-muted">Your message will appear here.</span>`}</p><p class="sp-bubble-time">9:41</p></div></div>`).join("")}</div>`;
}

function blueskyPreview(data: NormalizedPreviewData): string {
  const items = [{ message: data.message, media: data.media }, ...data.thread.map((item) => ({ message: item.message, media: item.media || [] }))];
  return `<div class="sp-root sp-bluesky">${items.map((item) => `<div class="sp-bluesky-post"><div class="sp-row sp-bluesky-head">${avatar(data.account)}<div class="sp-grow"><p class="sp-bluesky-name sp-truncate">${h(accountName(data.account))}</p><p class="sp-bluesky-handle sp-truncate">${h(accountHandle(data.account))}</p></div></div><p class="sp-copy sp-bluesky-copy">${item.message ? h(item.message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${platformMedia(item.media, "bluesky", "sp-bluesky-media")}<p class="sp-bluesky-time">${h(formatCompactTimestamp(data.previewDate))}</p></div>`).join("")}</div>`;
}

function threadsPreview(data: NormalizedPreviewData): string {
  const items = [{ message: data.message, media: data.media }, ...data.thread.map((item) => ({ message: item.message, media: item.media || [] }))];
  return `<div class="sp-root sp-threads">${items.map((item, index) => `<div class="sp-thread-item"><div class="sp-row sp-thread-row"><div class="sp-thread-avatar">${avatar(data.account)}${index < items.length - 1 ? `<span class="sp-thread-line"></span>` : ""}</div><div class="sp-grow"><p class="sp-thread-meta"><b>${h(accountHandle(data.account).slice(1))}</b><span class="sp-thread-age">1m</span></p><p class="sp-copy sp-thread-copy">${item.message ? h(item.message) : `<span class="sp-muted">Start a thread…</span>`}</p>${platformMedia(item.media, "threads", "sp-thread-media")}</div></div></div>`).join("")}</div>`;
}

function linkedinPreview(data: NormalizedPreviewData): string {
  const { account, message, media } = data;
  return `<div class="sp-root sp-linkedin"><div class="sp-row sp-linkedin-head">${avatar(account)}<div class="sp-grow"><p class="sp-linkedin-name sp-truncate">${h(accountName(account))} <span class="sp-muted" style="font-weight:400">• 3rd+</span></p><p class="sp-linkedin-meta">1m •</p></div><span class="sp-follow">Follow</span></div><p class="sp-copy sp-linkedin-copy">${message ? h(message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${platformMedia(media, "linkedin")}</div>`;
}

function pinterestPreview(data: NormalizedPreviewData): string {
  const title = optionString(data.options, "title") || firstLine(data.message, "Your Pin");
  const description = optionString(data.options, "description") || data.message || "Your description will appear here.";
  return `<div class="sp-root sp-pinterest"><div class="sp-pin-media">${data.media[0] ? platformMedia(data.media, "pinterest") : `<div class="sp-pin-empty">${emptyMedia("Add media for your Pin")}</div>`}</div><div class="sp-pin-info"><h2 class="sp-pin-title">${h(title)}</h2><p class="sp-pin-description">${h(description)}</p><div class="sp-row sp-pin-account">${avatar(data.account, "sp-avatar--32")}<p class="sp-truncate">${h(accountName(data.account))}</p></div></div></div>`;
}

function foremPreview(data: NormalizedPreviewData): string {
  const title = normalizePreviewTitle(optionString(data.options, "title") || data.message, "Your article title");
  const tags = Array.isArray(data.options.tags) ? data.options.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 4) : [];
  return `<div class="sp-root sp-forem">${data.media[0] ? `<div class="sp-forem-cover">${mediaAsset(data.media[0])}</div>` : ""}<div class="sp-forem-info"><div class="sp-row sp-forem-head">${avatar(data.account, "sp-avatar--32")}<div><p>${h(accountName(data.account))}</p><p class="sp-forem-meta">Posted just now</p></div></div><h2 class="sp-forem-title">${h(title)}</h2>${tags.length ? `<div class="sp-tags">${tags.map((tag) => `<span>#${h(tag)}</span>`).join("")}</div>` : ""}<p class="sp-forem-copy">${h(data.message || "Your article body will appear here.")}</p></div></div>`;
}

const renderers: Record<PreviewPlatform, (data: NormalizedPreviewData) => string> = {
  x: xPreview,
  instagram: instagramPreview,
  facebook: facebookPreview,
  tiktok: tiktokPreview,
  youtube: youtubePreview,
  telegram: telegramPreview,
  bluesky: blueskyPreview,
  threads: threadsPreview,
  linkedin: linkedinPreview,
  pinterest: pinterestPreview,
  forem: foremPreview,
};

export function renderPostPreviewHtml(data: PostPreviewData): string {
  const normalized = normalizeData(data);
  const html = normalized.platform
    ? renderers[normalized.platform](normalized)
    : `<div class="sp-root sp-unsupported">Unsupported platform</div>`;
  const layout = data.threadLayout === "expand" ? "expand" : "scroll";
  const height = typeof data.maxHeight === "number" && Number.isFinite(data.maxHeight) && data.maxHeight > 0 ? data.maxHeight : 720;
  const content = html.replace("class=\"sp-root", `class="sp-root sp-theme-${normalized.theme}`);
  return `<div class="sp-viewport sp-viewport--${layout}"${layout === "scroll" ? ` style="max-height:var(--simple-post-preview-max-height,${height}px)" tabindex="0" role="region" aria-label="Post preview"` : ""}>${content}</div>`;
}

export function renderPostPreview(target: HTMLElement | ShadowRoot, data: PostPreviewData): void {
  target.innerHTML = `<style>${previewStyles}</style>${renderPostPreviewHtml(data)}`;
  initializePostPreview(target);
}

/** Enhance server-rendered HTML, or call renderPostPreview for automatic setup. */
export function initializePostPreview(target: HTMLElement | ShadowRoot): void {
  initializeMedia(target);
  target.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
    if (video.dataset.initialized || !video.getAttribute("src")) return;
    video.dataset.initialized = "true";
    // Seeking decodes a full-resolution frame without canvas, autoplay, or CORS requirements.
    const seek = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Math.min(0.1, video.duration / 2);
    };
    video.addEventListener("loadedmetadata", seek, { once: true });
    video.addEventListener("seeked", () => video.removeAttribute("poster"), { once: true });
    if (video.readyState >= 1) seek();
  });
}

export function getPostPreviewRuntime(): PostPreviewRuntime {
  const runtime = (globalThis as Record<PropertyKey, unknown>)[runtimeKey];
  return (runtime as PostPreviewRuntime | undefined) || { render: renderPostPreview };
}

(globalThis as Record<PropertyKey, unknown>)[runtimeKey] = { render: renderPostPreview } satisfies PostPreviewRuntime;
if (typeof document !== "undefined" && typeof Event !== "undefined") {
  document.dispatchEvent(new Event(POST_PREVIEW_RUNTIME_EVENT));
}
