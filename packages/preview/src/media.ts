import { imageIcon, playIcon } from "./icons";
import type { PreviewMedia, PreviewPlatform } from "./types";
import { escapeHtml as h, safeUrl } from "./utils";

export function emptyMedia(label: string): string {
  return `<div class="sp-empty">${imageIcon}<span>${h(label)}</span></div>`;
}

export function mediaAsset(file: PreviewMedia, natural = false, showPlay = true): string {
  const source = safeUrl(file.url);
  const thumbnail = safeUrl(file.thumbnailUrl);
  const label = file.alt || file.filename || "Post media";
  if (!source && !thumbnail) return emptyMedia("Media unavailable");
  const className = `sp-media${natural ? " sp-media--natural" : ""}`;
  if (file.type === "image") return `<div class="${className}"><img src="${h(source || thumbnail)}" alt="${h(label)}" draggable="false" /></div>`;
  return `<div class="${className}"><video${source ? ` src="${h(source)}"` : ""}${thumbnail ? ` poster="${h(thumbnail)}"` : ""} aria-label="${h(label)}" muted playsinline preload="metadata"></video>${showPlay ? `<span class="sp-play"><span>${playIcon}</span></span>` : ""}</div>`;
}

function ratio(file: PreviewMedia): number {
  return file.width && file.height && Number.isFinite(file.width / file.height) && file.width > 0 && file.height > 0 ? file.width / file.height : 1;
}

type GalleryStyle = "instagram" | "tiktok" | "x" | "threads" | "pinterest" | "viewer";
const chevron = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function carousel(media: PreviewMedia[], style: GalleryStyle, className = ""): string {
  const arrows = style !== "x" && style !== "tiktok";
  const dots = style !== "threads" && style !== "viewer";
  const counter = style === "instagram" || style === "tiktok" || style === "viewer";
  const aspect = Math.max(style === "pinterest" ? 2 / 3 : 4 / 5, Math.min(1.91, ratio(media[0])));
  return `<section class="sp-gallery sp-gallery--${style} ${className}" style="--sp-media-ratio:${aspect}" aria-label="Post media" aria-roledescription="carousel"><div class="sp-gallery-stage"><div class="sp-gallery-track" tabindex="0" aria-label="Scroll through ${media.length} media items">${media.map((file, index) => `<div class="sp-gallery-slide" role="group" aria-roledescription="slide" aria-label="${index + 1} of ${media.length}">${mediaAsset(file, false, style !== "tiktok")}</div>`).join("")}</div>${counter ? `<span class="sp-counter" aria-hidden="true">1/${media.length}</span>` : ""}${arrows ? `<div class="sp-gallery-controls" hidden><button class="sp-gallery-prev" type="button" data-direction="-1" aria-label="Previous media">${chevron}</button><button class="sp-gallery-next" type="button" data-direction="1" aria-label="Next media">${chevron}</button></div>` : ""}</div>${dots ? `<div class="sp-gallery-dots" aria-hidden="true">${media.map((_, i) => `<span class="sp-gallery-dot${i === 0 ? " sp-active" : ""}"></span>`).join("")}</div>` : ""}<span class="sp-sr-only sp-gallery-status" aria-live="polite">1 / ${media.length}</span></section>`;
}

function mosaic(media: PreviewMedia[], platform: PreviewPlatform, className: string): string {
  const limit = platform === "telegram" ? media.length : platform === "facebook" || platform === "linkedin" ? 5 : 4;
  const shown = media.slice(0, limit);
  const count = shown.length;
  const landscape = ratio(media[0]) > 4 / 3;
  const tiles = shown.map((file, i) => `<button type="button" class="sp-mosaic-tile" data-open-index="${i}" aria-label="View media ${i + 1} of ${media.length}${i === count - 1 && media.length > count ? `, ${media.length - count} more` : ""}">${mediaAsset(file)}${i === count - 1 && media.length > count ? `<span class="sp-more">+${media.length - count}</span>` : ""}</button>`);
  let grid: string;
  if (platform === "telegram" && count > 4) {
    // Justified rows preserve the album's order and show every item in the chat bubble.
    const rows: string[] = [];
    for (let i = 0; i < count;) {
      const size = count - i === 4 ? 2 : Math.min(3, count - i);
      const row = shown.slice(i, i + size);
      const ratios = row.map(file => Math.max(.6, Math.min(1.7, ratio(file))));
      rows.push(`<div class="sp-album-row" style="aspect-ratio:${ratios.reduce((a, b) => a + b, 0)}">${tiles.slice(i, i + size).map((tile, j) => tile.replace('class="sp-mosaic-tile"', `class="sp-mosaic-tile" style="flex:${ratios[j]}"`)).join("")}</div>`);
      i += size;
    }
    grid = `<div class="sp-mosaic sp-mosaic--album">${rows.join("")}</div>`;
  } else {
    grid = `<div style="--sp-first-ratio:${ratio(media[0])}" class="sp-mosaic sp-mosaic--${count} sp-mosaic--${platform} ${landscape ? "sp-mosaic--landscape" : "sp-mosaic--portrait"}">${tiles.join("")}</div>`;
  }
  // The feed remains a native-looking collage. A tile opens an inline, non-zooming viewer.
  return `<section class="sp-media-group ${className}" aria-label="Photo album">${grid}<div class="sp-album-viewer" hidden><button class="sp-album-back" type="button">Back to album</button>${carousel(media, "viewer")}</div></section>`;
}

export function platformMedia(media: PreviewMedia[], platform: PreviewPlatform, className = "", xLayout: "carousel" | "grid" = "carousel"): string {
  if (!media.length) return "";
  if (media.length === 1) return `<div class="${className}" style="overflow:hidden">${mediaAsset(media[0], platform !== "tiktok", platform !== "tiktok")}</div>`;
  if (["telegram", "bluesky", "facebook", "linkedin"].includes(platform) || platform === "x" && xLayout === "grid") return mosaic(media, platform, className);
  return carousel(media, platform as GalleryStyle, className);
}

export function initializeMedia(target: HTMLElement | ShadowRoot): void {
  const navigators = new Map<HTMLElement, (index: number) => void>();
  target.querySelectorAll<HTMLElement>(".sp-gallery").forEach(gallery => {
    if (gallery.dataset.initialized) return;
    gallery.dataset.initialized = "true";
    const track = gallery.querySelector<HTMLElement>(".sp-gallery-track")!;
    const slides = Array.from(track.children) as HTMLElement[];
    const buttons = gallery.querySelectorAll<HTMLButtonElement>("[data-direction]");
    const dots = gallery.querySelectorAll<HTMLElement>(".sp-gallery-dot");
    const status = gallery.querySelector<HTMLElement>(".sp-gallery-status")!;
    const counter = gallery.querySelector<HTMLElement>(".sp-counter");
    const last = slides.length - 1;
    // Offsets, rather than container widths, handle peeking cards, gaps, and resizing.
    const position = (i: number) => Math.min(slides[i].offsetLeft - slides[0].offsetLeft, Math.max(0, track.scrollWidth - track.clientWidth));
    const index = () => {
      let nearest = 0;
      for (let i = 1; i <= last; i++) if (Math.abs(track.scrollLeft - position(i)) < Math.abs(track.scrollLeft - position(nearest))) nearest = i;
      return nearest;
    };
    const update = () => {
      const current = index();
      buttons.forEach(button => { button.disabled = Number(button.dataset.direction) < 0 ? current === 0 : current === last; });
      dots.forEach((dot, i) => {
        dot.classList.toggle("sp-active", i === current);
        dot.hidden = dots.length > 7 && Math.abs(i - current) > 3;
      });
      status.textContent = `${current + 1} / ${last + 1}`;
      if (counter) counter.textContent = `${current + 1}/${last + 1}`;
    };
    const navigate = (next: number) => {
      track.scrollTo({ left: position(Math.max(0, Math.min(last, next))), behavior: "instant" });
      update();
    };
    navigators.set(gallery, navigate);
    buttons.forEach(button => button.addEventListener("click", () => navigate(index() + Number(button.dataset.direction))));
    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      navigate(event.key === "Home" ? 0 : event.key === "End" ? last : index() + (event.key === "ArrowRight" ? 1 : -1));
    });
    // Mouse drag supplements native touch/trackpad scrolling on arrow-free feeds.
    let drag: { x: number; left: number } | undefined;
    track.addEventListener("pointerdown", event => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      drag = { x: event.clientX, left: track.scrollLeft };
      track.setPointerCapture(event.pointerId);
      track.classList.add("sp-dragging");
      track.focus({ preventScroll: true });
    });
    track.addEventListener("pointermove", event => { if (drag) track.scrollLeft = drag.left + drag.x - event.clientX; });
    const endDrag = () => { if (!drag) return; drag = undefined; track.classList.remove("sp-dragging"); navigate(index()); };
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("lostpointercapture", endDrag);
    const controls = gallery.querySelector<HTMLElement>(".sp-gallery-controls");
    if (controls) controls.hidden = false;
    const firstImage = slides[0].querySelector("img");
    const setRatio = () => {
      if (firstImage?.naturalWidth && firstImage.naturalHeight) gallery.style.setProperty("--sp-media-ratio", String(Math.max(gallery.classList.contains("sp-gallery--pinterest") ? 2 / 3 : 4 / 5, Math.min(1.91, firstImage.naturalWidth / firstImage.naturalHeight))));
    };
    firstImage?.addEventListener("load", setRatio, { once: true });
    setRatio();
    update();
  });
  target.querySelectorAll<HTMLElement>(".sp-media-group").forEach(group => {
    if (group.dataset.initialized) return;
    group.dataset.initialized = "true";
    const grid = group.querySelector<HTMLElement>(".sp-mosaic")!;
    const viewer = group.querySelector<HTMLElement>(".sp-album-viewer")!;
    const back = viewer.querySelector<HTMLButtonElement>(".sp-album-back")!;
    const gallery = viewer.querySelector<HTMLElement>(".sp-gallery")!;
    let opener: HTMLButtonElement | undefined;
    group.querySelectorAll<HTMLButtonElement>("[data-open-index]").forEach(button => button.addEventListener("click", () => {
      opener = button;
      grid.hidden = true;
      viewer.hidden = false;
      navigators.get(gallery)?.(Number(button.dataset.openIndex));
      back.focus({ preventScroll: true });
    }));
    const close = () => { viewer.hidden = true; grid.hidden = false; opener?.focus({ preventScroll: true }); };
    back.addEventListener("click", close);
    viewer.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); close(); } });
    const firstImage = grid.querySelector("img");
    const orient = () => {
      if (!firstImage?.naturalWidth) return;
      const firstRatio = firstImage.naturalWidth / firstImage.naturalHeight;
      grid.style.setProperty("--sp-first-ratio", String(firstRatio));
      const landscape = firstRatio > 4 / 3;
      grid.classList.toggle("sp-mosaic--landscape", landscape);
      grid.classList.toggle("sp-mosaic--portrait", !landscape);
    };
    firstImage?.addEventListener("load", orient, { once: true });
    orient();
  });
}
