import { imageIcon, musicIcon, playIcon } from "./icons";
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

function mediaAsset(file: PreviewMedia, natural = false, showPlay = true): string {
  const source = safeUrl(file.url);
  const thumbnail = safeUrl(file.thumbnailUrl);
  const label = file.alt || file.filename || "Post media";
  if (!source && !thumbnail) return emptyMedia("Media unavailable");
  const className = `sp-media${natural ? " sp-media--natural" : ""}`;
  if (file.type === "image") {
    return `<div class="${className}"><img src="${h(thumbnail || source)}" alt="${h(label)}" /></div>`;
  }
  return `<div class="${className}"><video src="${h(source)}"${thumbnail ? ` poster="${h(thumbnail)}"` : ""} aria-label="${h(label)}" muted playsinline preload="metadata"></video>${showPlay ? `<span class="sp-play"><span>${playIcon}</span></span>` : ""}</div>`;
}

function mediaMosaic(media: PreviewMedia[], height: number, className = ""): string {
  const shown = media.slice(0, 4);
  if (!shown.length) return "";
  if (shown.length === 1) {
    return `<div class="${className}" style="overflow:hidden">${mediaAsset(shown[0], true)}</div>`;
  }
  return `<div class="sp-mosaic sp-mosaic--${shown.length} ${className}" style="height:${height}px">${shown
    .map((file, index) => `<div class="sp-media">${mediaAsset(file)}${index === 3 && media.length > 4 ? `<span class="sp-more">+${media.length - 4}</span>` : ""}</div>`)
    .join("")}</div>`;
}

function feedMedia(media: PreviewMedia[], height: number, className = ""): string {
  if (!media.length) return "";
  return media.length === 1
    ? `<div class="${className}" style="overflow:hidden">${mediaAsset(media[0], true)}</div>`
    : mediaMosaic(media, height, className);
}

function emptyMedia(label: string): string {
  return `<div class="sp-empty">${imageIcon}<span>${h(label)}</span></div>`;
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
  const mediaHtml = feedMedia(media, 204, "sp-x-media");
  const thread = data.thread.slice(0, 2).map((item) => `<div class="sp-x-thread"><div class="sp-row">${avatar(account)}<div class="sp-grow"><p class="sp-inline-meta sp-truncate"><b>${h(accountName(account))}</b><span class="sp-muted">${h(accountHandle(account))} · 1m</span></p><p class="sp-copy sp-x-thread-copy">${h(item.message)}</p>${feedMedia(item.media || [], 204, "sp-x-media")}</div></div></div>`).join("");
  return `<div class="sp-root sp-x"><div class="sp-x-main"><div class="sp-row sp-x-head">${avatar(account, "sp-avatar--48")}<div class="sp-grow"><p class="sp-x-name sp-truncate">${h(accountName(account))}</p><p class="sp-x-handle sp-truncate">${h(accountHandle(account))}</p></div></div><p class="sp-copy sp-x-copy">${message ? h(message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${mediaHtml}<p class="sp-x-time">${h(formatXTimestamp(previewDate))}</p></div>${thread}</div>`;
}

function instagramPreview(data: NormalizedPreviewData): string {
  const { account, message, media } = data;
  const first = media[0];
  return `<div class="sp-root sp-instagram"><div class="sp-row sp-instagram-head">${avatar(account, "sp-avatar--32")}<div class="sp-truncate">${h(accountHandle(account).slice(1))}</div></div><div class="sp-media--natural">${first ? mediaAsset(first, true) : `<div class="sp-instagram-blank">${emptyMedia("Add a photo or video")}</div>`}${media.length > 1 ? `<span class="sp-counter">1/${media.length}</span>` : ""}</div><p class="sp-copy sp-instagram-copy"><b>${h(accountHandle(account).slice(1))}</b>${message ? h(message) : `<span class="sp-muted">Your caption will appear here.</span>`}</p></div>`;
}

function facebookPreview(data: NormalizedPreviewData): string {
  const { account, message, media } = data;
  return `<div class="sp-root sp-facebook"><div class="sp-row sp-facebook-head">${avatar(account)}<div class="sp-grow"><p class="sp-facebook-name sp-truncate">${h(accountName(account))}</p><p class="sp-facebook-meta">Just now · Public</p></div></div><p class="sp-copy sp-facebook-copy">${message ? h(message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${feedMedia(media, 320)}</div>`;
}

function tiktokPreview(data: NormalizedPreviewData): string {
  const { account, media, options } = data;
  const caption = optionString(options, "title") || data.message || "Your caption will appear here.";
  return `<div class="sp-root sp-tiktok">${media[0] ? mediaAsset(media[0], false, false) : `<div class="sp-tiktok-fallback"></div>`}<div class="sp-tiktok-shade"></div><div class="sp-avatar sp-tiktok-avatar">${safeUrl(account.profilePicture) ? `<img src="${h(safeUrl(account.profilePicture))}" alt="" />` : h(accountName(account)[0] || "S")}</div><div class="sp-tiktok-copy"><p class="sp-handle">${h(accountHandle(account))}</p><p class="sp-copy sp-caption">${h(caption)}</p><p class="sp-sound">${musicIcon} original sound - ${h(accountHandle(account).slice(1))}</p></div></div>`;
}

function youtubePreview(data: NormalizedPreviewData): string {
  const { account, media, options } = data;
  const title = optionString(options, "title") || firstLine(data.message, "Your video title");
  const description = optionString(options, "description") || data.message;
  return `<div class="sp-root sp-youtube">${media[0] ? mediaAsset(media[0], true) : `<div class="sp-youtube-empty">${emptyMedia("Add a video")}</div>`}<div class="sp-youtube-info"><h2 class="sp-youtube-title">${h(title)}</h2><p class="sp-youtube-meta">Just now</p><div class="sp-row sp-youtube-channel">${avatar(account, "sp-avatar--36")}<div class="sp-grow"><p class="sp-truncate" style="font-size:12px;font-weight:600">${h(accountName(account))}</p><p class="sp-youtube-meta">${h(accountHandle(account))}</p></div></div>${description && description !== title ? `<p class="sp-copy sp-youtube-description">${h(description)}</p>` : ""}</div></div>`;
}

function telegramPreview(data: NormalizedPreviewData): string {
  const items = [{ message: data.message, media: data.media }, ...data.thread.slice(0, 2).map((item) => ({ message: item.message, media: item.media || [] }))];
  return `<div class="sp-root sp-telegram">${items.map((item) => `<div class="sp-bubble">${item.media.length ? mediaMosaic(item.media, 210, "sp-bubble-media") : ""}<div class="sp-bubble-copy"><p class="sp-copy">${item.message ? h(item.message) : `<span class="sp-muted">Your message will appear here.</span>`}</p><p class="sp-bubble-time">9:41</p></div></div>`).join("")}</div>`;
}

function blueskyPreview(data: NormalizedPreviewData): string {
  const items = [{ message: data.message, media: data.media }, ...data.thread.slice(0, 2).map((item) => ({ message: item.message, media: item.media || [] }))];
  return `<div class="sp-root sp-bluesky">${items.map((item) => `<div class="sp-bluesky-post"><div class="sp-row sp-bluesky-head">${avatar(data.account)}<div class="sp-grow"><p class="sp-bluesky-name sp-truncate">${h(accountName(data.account))}</p><p class="sp-bluesky-handle sp-truncate">${h(accountHandle(data.account))}</p></div></div><p class="sp-copy sp-bluesky-copy">${item.message ? h(item.message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${feedMedia(item.media, 232, "sp-bluesky-media")}<p class="sp-bluesky-time">${h(formatCompactTimestamp(data.previewDate))}</p></div>`).join("")}</div>`;
}

function threadsPreview(data: NormalizedPreviewData): string {
  const items = [{ message: data.message, media: data.media }, ...data.thread.slice(0, 2).map((item) => ({ message: item.message, media: item.media || [] }))];
  return `<div class="sp-root sp-threads">${items.map((item, index) => `<div class="sp-thread-item"><div class="sp-row sp-thread-row"><div class="sp-thread-avatar">${avatar(data.account)}${index < items.length - 1 ? `<span class="sp-thread-line"></span>` : ""}</div><div class="sp-grow"><p class="sp-thread-meta"><b>${h(accountHandle(data.account).slice(1))}</b><span class="sp-thread-age">1m</span></p><p class="sp-copy sp-thread-copy">${item.message ? h(item.message) : `<span class="sp-muted">Start a thread…</span>`}</p>${feedMedia(item.media, 240, "sp-thread-media")}</div></div></div>`).join("")}</div>`;
}

function linkedinPreview(data: NormalizedPreviewData): string {
  const { account, message, media } = data;
  return `<div class="sp-root sp-linkedin"><div class="sp-row sp-linkedin-head">${avatar(account)}<div class="sp-grow"><p class="sp-linkedin-name sp-truncate">${h(accountName(account))} <span class="sp-muted" style="font-weight:400">• 3rd+</span></p><p class="sp-linkedin-meta">1m •</p></div><span class="sp-follow">Follow</span></div><p class="sp-copy sp-linkedin-copy">${message ? h(message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${feedMedia(media, 320)}</div>`;
}

function pinterestPreview(data: NormalizedPreviewData): string {
  const title = optionString(data.options, "title") || firstLine(data.message, "Your Pin");
  const description = optionString(data.options, "description") || data.message || "Your description will appear here.";
  return `<div class="sp-root sp-pinterest"><div class="sp-pin-media">${data.media[0] ? mediaAsset(data.media[0], true) : `<div class="sp-pin-empty">${emptyMedia("Add media for your Pin")}</div>`}${data.media.length > 1 ? `<span class="sp-counter sp-pin-counter">1/${data.media.length}</span>` : ""}</div><div class="sp-pin-info"><h2 class="sp-pin-title">${h(title)}</h2><p class="sp-pin-description">${h(description)}</p><div class="sp-row sp-pin-account">${avatar(data.account, "sp-avatar--32")}<p class="sp-truncate">${h(accountName(data.account))}</p></div></div></div>`;
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
  return html.replace("class=\"sp-root", `class="sp-root sp-theme-${normalized.theme}`);
}

export function renderPostPreview(target: HTMLElement | ShadowRoot, data: PostPreviewData): void {
  target.innerHTML = `<style>${previewStyles}</style>${renderPostPreviewHtml(data)}`;
}

export function getPostPreviewRuntime(): PostPreviewRuntime {
  const runtime = (globalThis as Record<PropertyKey, unknown>)[runtimeKey];
  return (runtime as PostPreviewRuntime | undefined) || { render: renderPostPreview };
}

(globalThis as Record<PropertyKey, unknown>)[runtimeKey] = { render: renderPostPreview } satisfies PostPreviewRuntime;
if (typeof document !== "undefined" && typeof Event !== "undefined") {
  document.dispatchEvent(new Event(POST_PREVIEW_RUNTIME_EVENT));
}
