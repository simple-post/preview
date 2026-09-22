import { describe, expect, it, vi } from "vitest";
import { renderPostPreview, renderPostPreviewHtml, initializePostPreview } from "./render";
import type { PostPreviewData } from "./types";

function data(platform: string, count = 4): PostPreviewData {
  return { account: { platform }, media: Array.from({ length: count }, (_, i) => ({ type: "image", url: `https://example.com/${i}.jpg`, width: 1200, height: 1200 })) };
}
function render(platform: string, count = 4) {
  const node = document.createElement("div");
  renderPostPreview(node, data(platform, count));
  return node;
}
function layout(track: HTMLElement, width: number, step: number) {
  Object.defineProperty(track, "clientWidth", { value: width });
  Object.defineProperty(track, "scrollWidth", { value: step * (track.children.length - 1) + width });
  Array.from(track.children).forEach((slide, i) => Object.defineProperty(slide, "offsetLeft", { value: i * step }));
  track.scrollTo = vi.fn((options?: ScrollToOptions | number) => { track.scrollLeft = typeof options === "number" ? options : options?.left ?? 0; track.dispatchEvent(new Event("scroll")); });
}

describe("platform-specific media", () => {
  it("uses arrow-free X cards, indicators, and an explicit classic-grid option", () => {
    const node = render("x");
    expect(node.querySelector(".sp-gallery--x")).not.toBeNull();
    expect(node.querySelectorAll("[data-direction]")).toHaveLength(0);
    expect(node.querySelectorAll(".sp-gallery-dot")).toHaveLength(4);
    expect(renderPostPreviewHtml({ ...data("x"), xMediaLayout: "grid" })).toContain("sp-mosaic--x");
  });
  it("places Instagram controls inside the image stage and dots below it", () => {
    const node = render("instagram");
    expect(node.querySelectorAll(".sp-gallery-stage [data-direction]")).toHaveLength(2);
    expect(node.querySelector(".sp-gallery > .sp-gallery-dots")).not.toBeNull();
    expect(node.querySelector(".sp-counter")?.textContent).toBe("1/4");
  });
  it("uses TikTok swipe navigation and dots without desktop arrow chrome", () => {
    const node = render("tiktok");
    expect(node.querySelectorAll("[data-direction]")).toHaveLength(0);
    expect(node.querySelectorAll(".sp-gallery-dot")).toHaveLength(4);
  });
  it("uses a Threads strip without a counter or pagination dots", () => {
    const node = render("threads");
    expect(node.querySelector(".sp-gallery--threads")).not.toBeNull();
    expect(node.querySelector(".sp-counter,.sp-gallery-dots")).toBeNull();
  });
  it.each([2, 3, 4])("renders %i Bluesky photos as a feed grid", count => {
    const node = render("bluesky", count);
    expect(node.querySelector(`.sp-mosaic--bluesky.sp-mosaic--${count}`)).not.toBeNull();
    expect(node.querySelectorAll(".sp-mosaic-tile")).toHaveLength(count);
    expect(node.querySelector(".sp-album-viewer")?.hasAttribute("hidden")).toBe(true);
  });
  it("shows all ten Telegram album tiles without a hidden overflow count", () => {
    const node = render("telegram", 10);
    expect(node.querySelectorAll(".sp-mosaic-tile")).toHaveLength(10);
    expect(node.querySelectorAll(".sp-album-row")).toHaveLength(4);
    expect(node.querySelector(".sp-more")).toBeNull();
  });
  it.each(["facebook", "linkedin"])("makes overflow photos reachable from the %s collage", platform => {
    const node = render(platform, 8);
    document.body.append(node);
    initializePostPreview(node);
    const track = node.querySelector<HTMLElement>(".sp-gallery-track")!;
    layout(track, 300, 300);
    expect(node.querySelector(".sp-more")?.textContent).toBe("+3");
    const tile = node.querySelectorAll<HTMLButtonElement>(".sp-mosaic-tile")[4];
    tile.click();
    expect(node.querySelector<HTMLElement>(".sp-mosaic")!.hidden).toBe(true);
    expect(node.querySelector<HTMLElement>(".sp-album-viewer")!.hidden).toBe(false);
    expect(track.scrollLeft).toBe(1200);
    track.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
    expect(track.scrollLeft).toBe(2100);
    node.querySelector(".sp-album-viewer")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(node.querySelector<HTMLElement>(".sp-album-viewer")!.hidden).toBe(true);
    expect(document.activeElement).toBe(tile);
    node.remove();
  });
  it("uses source orientation for LinkedIn and updates when the image loads", () => {
    const node = document.createElement("div");
    renderPostPreview(node, { ...data("linkedin", 3), media: data("linkedin", 3).media!.map(file => ({ ...file, width: 1600, height: 900 })) });
    const grid = node.querySelector(".sp-mosaic")!;
    expect(grid.classList.contains("sp-mosaic--landscape")).toBe(true);
    const image = grid.querySelector("img")!;
    Object.defineProperty(image, "naturalWidth", { value: 800 });
    Object.defineProperty(image, "naturalHeight", { value: 1200 });
    image.dispatchEvent(new Event("load"));
    expect(grid.classList.contains("sp-mosaic--portrait")).toBe(true);
  });
  it("navigates peeking cards by their real offsets and updates indicators on native scroll", () => {
    const node = render("x");
    const track = node.querySelector<HTMLElement>(".sp-gallery-track")!;
    layout(track, 390, 260);
    track.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(track.scrollLeft).toBe(260);
    expect(node.querySelectorAll(".sp-gallery-dot")[1].classList.contains("sp-active")).toBe(true);
    track.scrollLeft = 780;
    track.dispatchEvent(new Event("scroll"));
    expect(node.querySelector(".sp-gallery-status")?.textContent).toBe("4 / 4");
    track.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
    expect(track.scrollLeft).toBe(0);
  });
});
