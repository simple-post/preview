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
    return `<div class="${className}"><img src="${h(source || thumbnail)}" alt="${h(label)}" /></div>`;
  }
  return `<div class="${className}"><video${source ? ` src="${h(source)}"` : ""}${thumbnail ? ` poster="${h(thumbnail)}"` : ""} aria-label="${h(label)}" muted playsinline preload="metadata"></video>${showPlay ? `<span class="sp-play"><span>${playIcon}</span></span>` : ""}</div>`;
}

function mediaGallery(media: PreviewMedia[], className = "", natural = true, showPlay = true): string {
  if (!media.length) return "";
  if (media.length === 1) return `<div class="${className}" style="overflow:hidden">${mediaAsset(media[0], natural, showPlay)}</div>`;
  return `<section class="sp-gallery ${className}" aria-label="Post media" aria-roledescription="carousel"><div class="sp-gallery-track" tabindex="0" aria-label="Scroll through ${media.length} media items">${media.map((file, index) => `<div class="sp-gallery-slide" role="group" aria-roledescription="slide" aria-label="${index + 1} of ${media.length}">${mediaAsset(file, false, showPlay)}<span class="sp-counter">${index + 1}/${media.length}</span></div>`).join("")}</div><div class="sp-gallery-controls" hidden><button type="button" data-direction="-1" aria-label="Previous media">‹</button><span class="sp-gallery-status" aria-live="polite">1 / ${media.length}</span><button type="button" data-direction="1" aria-label="Next media">›</button></div></section>`;
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
  const mediaHtml = mediaGallery(media, "sp-x-media");
  const thread = data.thread.map((item) => `<div class="sp-x-thread"><div class="sp-row">${avatar(account)}<div class="sp-grow"><p class="sp-inline-meta sp-truncate"><b>${h(accountName(account))}</b><span class="sp-muted">${h(accountHandle(account))} · 1m</span></p><p class="sp-copy sp-x-thread-copy">${h(item.message)}</p>${mediaGallery(item.media || [], "sp-x-media")}</div></div></div>`).join("");
  return `<div class="sp-root sp-x"><div class="sp-x-main"><div class="sp-row sp-x-head">${avatar(account, "sp-avatar--48")}<div class="sp-grow"><p class="sp-x-name sp-truncate">${h(accountName(account))}</p><p class="sp-x-handle sp-truncate">${h(accountHandle(account))}</p></div></div><p class="sp-copy sp-x-copy">${message ? h(message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${mediaHtml}<p class="sp-x-time">${h(formatXTimestamp(previewDate))}</p></div>${thread}</div>`;
}

function instagramPreview(data: NormalizedPreviewData): string {
  const { account, message, media } = data;
  const first = media[0];
  return `<div class="sp-root sp-instagram"><div class="sp-row sp-instagram-head">${avatar(account, "sp-avatar--32")}<div class="sp-truncate">${h(accountHandle(account).slice(1))}</div></div><div class="sp-media--natural">${first ? mediaGallery(media) : `<div class="sp-instagram-blank">${emptyMedia("Add a photo or video")}</div>`}</div><p class="sp-copy sp-instagram-copy"><b>${h(accountHandle(account).slice(1))}</b>${message ? h(message) : `<span class="sp-muted">Your caption will appear here.</span>`}</p></div>`;
}

function facebookPreview(data: NormalizedPreviewData): string {
  const { account, message, media } = data;
  return `<div class="sp-root sp-facebook"><div class="sp-row sp-facebook-head">${avatar(account)}<div class="sp-grow"><p class="sp-facebook-name sp-truncate">${h(accountName(account))}</p><p class="sp-facebook-meta">Just now · Public</p></div></div><p class="sp-copy sp-facebook-copy">${message ? h(message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${mediaGallery(media)}</div>`;
}

function tiktokPreview(data: NormalizedPreviewData): string {
  const { account, media, options } = data;
  const caption = optionString(options, "title") || data.message || "Your caption will appear here.";
  return `<div class="sp-root sp-tiktok">${media[0] ? mediaGallery(media, "sp-tiktok-media", false, false) : `<div class="sp-tiktok-fallback"></div>`}<div class="sp-tiktok-shade"></div><div class="sp-avatar sp-tiktok-avatar">${safeUrl(account.profilePicture) ? `<img src="${h(safeUrl(account.profilePicture))}" alt="" />` : h(accountName(account)[0] || "S")}</div><div class="sp-tiktok-copy"><p class="sp-handle">${h(accountHandle(account))}</p><p class="sp-copy sp-caption">${h(caption)}</p><p class="sp-sound">${musicIcon} original sound - ${h(accountHandle(account).slice(1))}</p></div></div>`;
}

function youtubePreview(data: NormalizedPreviewData): string {
  const { account, media, options } = data;
  const title = optionString(options, "title") || firstLine(data.message, "Your video title");
  const description = optionString(options, "description") || data.message;
  return `<div class="sp-root sp-youtube">${media[0] ? mediaAsset(media[0], true) : `<div class="sp-youtube-empty">${emptyMedia("Add a video")}</div>`}<div class="sp-youtube-info"><h2 class="sp-youtube-title">${h(title)}</h2><p class="sp-youtube-meta">Just now</p><div class="sp-row sp-youtube-channel">${avatar(account, "sp-avatar--36")}<div class="sp-grow"><p class="sp-truncate" style="font-size:12px;font-weight:600">${h(accountName(account))}</p><p class="sp-youtube-meta">${h(accountHandle(account))}</p></div></div>${description && description !== title ? `<p class="sp-copy sp-youtube-description">${h(description)}</p>` : ""}</div></div>`;
}

function telegramPreview(data: NormalizedPreviewData): string {
  const items = [{ message: data.message, media: data.media }, ...data.thread.map((item) => ({ message: item.message, media: item.media || [] }))];
  return `<div class="sp-root sp-telegram">${items.map((item) => `<div class="sp-bubble">${item.media.length ? mediaGallery(item.media, "sp-bubble-media") : ""}<div class="sp-bubble-copy"><p class="sp-copy">${item.message ? h(item.message) : `<span class="sp-muted">Your message will appear here.</span>`}</p><p class="sp-bubble-time">9:41</p></div></div>`).join("")}</div>`;
}

function blueskyPreview(data: NormalizedPreviewData): string {
  const items = [{ message: data.message, media: data.media }, ...data.thread.map((item) => ({ message: item.message, media: item.media || [] }))];
  return `<div class="sp-root sp-bluesky">${items.map((item) => `<div class="sp-bluesky-post"><div class="sp-row sp-bluesky-head">${avatar(data.account)}<div class="sp-grow"><p class="sp-bluesky-name sp-truncate">${h(accountName(data.account))}</p><p class="sp-bluesky-handle sp-truncate">${h(accountHandle(data.account))}</p></div></div><p class="sp-copy sp-bluesky-copy">${item.message ? h(item.message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${mediaGallery(item.media, "sp-bluesky-media")}<p class="sp-bluesky-time">${h(formatCompactTimestamp(data.previewDate))}</p></div>`).join("")}</div>`;
}

function threadsPreview(data: NormalizedPreviewData): string {
  const items = [{ message: data.message, media: data.media }, ...data.thread.map((item) => ({ message: item.message, media: item.media || [] }))];
  return `<div class="sp-root sp-threads">${items.map((item, index) => `<div class="sp-thread-item"><div class="sp-row sp-thread-row"><div class="sp-thread-avatar">${avatar(data.account)}${index < items.length - 1 ? `<span class="sp-thread-line"></span>` : ""}</div><div class="sp-grow"><p class="sp-thread-meta"><b>${h(accountHandle(data.account).slice(1))}</b><span class="sp-thread-age">1m</span></p><p class="sp-copy sp-thread-copy">${item.message ? h(item.message) : `<span class="sp-muted">Start a thread…</span>`}</p>${mediaGallery(item.media, "sp-thread-media")}</div></div></div>`).join("")}</div>`;
}

function linkedinPreview(data: NormalizedPreviewData): string {
  const { account, message, media } = data;
  return `<div class="sp-root sp-linkedin"><div class="sp-row sp-linkedin-head">${avatar(account)}<div class="sp-grow"><p class="sp-linkedin-name sp-truncate">${h(accountName(account))} <span class="sp-muted" style="font-weight:400">• 3rd+</span></p><p class="sp-linkedin-meta">1m •</p></div><span class="sp-follow">Follow</span></div><p class="sp-copy sp-linkedin-copy">${message ? h(message) : `<span class="sp-muted">Your post will appear here.</span>`}</p>${mediaGallery(media)}</div>`;
}

function pinterestPreview(data: NormalizedPreviewData): string {
  const title = optionString(data.options, "title") || firstLine(data.message, "Your Pin");
  const description = optionString(data.options, "description") || data.message || "Your description will appear here.";
  return `<div class="sp-root sp-pinterest"><div class="sp-pin-media">${data.media[0] ? mediaGallery(data.media) : `<div class="sp-pin-empty">${emptyMedia("Add media for your Pin")}</div>`}</div><div class="sp-pin-info"><h2 class="sp-pin-title">${h(title)}</h2><p class="sp-pin-description">${h(description)}</p><div class="sp-row sp-pin-account">${avatar(data.account, "sp-avatar--32")}<p class="sp-truncate">${h(accountName(data.account))}</p></div></div></div>`;
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
  target.querySelectorAll<HTMLElement>(".sp-gallery").forEach((gallery) => {
    if (gallery.dataset.initialized) return;
    gallery.dataset.initialized = "true";
    const track = gallery.querySelector<HTMLElement>(".sp-gallery-track")!;
    const controls = gallery.querySelector<HTMLElement>(".sp-gallery-controls")!;
    const buttons = controls.querySelectorAll<HTMLButtonElement>("button");
    const status = controls.querySelector<HTMLElement>(".sp-gallery-status")!;
    const last = track.children.length - 1;
    const index = () => Math.max(0, Math.min(last, Math.round(track.scrollLeft / (track.clientWidth || 1))));
    const update = () => {
      const current = index();
      buttons[0].disabled = current === 0;
      buttons[1].disabled = current === last;
      status.textContent = `${current + 1} / ${last + 1}`;
    };
    const navigate = (next: number) => {
      track.scrollTo({ left: Math.max(0, Math.min(last, next)) * track.clientWidth, behavior: "instant" });
      update();
    };
    buttons.forEach((button) => button.addEventListener("click", () => navigate(index() + Number(button.dataset.direction))));
    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      navigate(event.key === "Home" ? 0 : event.key === "End" ? last : index() + (event.key === "ArrowRight" ? 1 : -1));
    });
    controls.hidden = false;
    update();
  });
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
