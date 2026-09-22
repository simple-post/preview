import { describe, expect, it, vi } from "vitest";

import { renderPostPreviewHtml, renderPostPreview, initializePostPreview } from "./render";
import { PREVIEW_PLATFORMS, type PostPreviewData } from "./types";
import { defineSimplePostPreview } from "./web-component";

const base: Omit<PostPreviewData, "platform"> = {
  account: {
    id: "account-1",
    platform: "x",
    displayName: "Edmund Clompton",
    username: "clompton",
    profilePicture: "https://example.com/avatar.jpg",
  },
  message: `<script>alert("unsafe")</script> Hello`,
  media: [{ id: "media-1", type: "image", url: "https://example.com/image.jpg", filename: "Example" }],
  previewDate: "2026-07-16T08:08:00Z",
};

describe("renderPostPreviewHtml", () => {
  it.each(PREVIEW_PLATFORMS)("renders %s", (platform) => {
    const html = renderPostPreviewHtml({ ...base, platform, account: { ...base.account, platform } });
    expect(html).toContain(`sp-${platform === "x" ? "x" : platform}`);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it.each(PREVIEW_PLATFORMS)("renders %s in light mode", (platform) => {
    const html = renderPostPreviewHtml({
      ...base,
      platform,
      theme: "light",
      account: { ...base.account, platform },
    });
    expect(html).toContain("sp-theme-light");
    expect(html).toContain(`sp-${platform === "x" ? "x" : platform}`);
  });

  it("normalizes the twitter alias", () => {
    expect(renderPostPreviewHtml({ ...base, platform: "twitter" })).toContain("sp-x");
  });

  it.each(["dark", "light"] as const)("renders the %s theme", (theme) => {
    const html = renderPostPreviewHtml({ ...base, theme });
    expect(html).toContain(`sp-theme-${theme}`);
  });

  it("defaults to the dark theme", () => {
    expect(renderPostPreviewHtml(base)).toContain("sp-theme-dark");
  });

  it("rejects unsafe media URLs", () => {
    const html = renderPostPreviewHtml({
      ...base,
      media: [{ type: "image", url: "javascript:alert(1)" }],
    });
    expect(html).not.toContain("javascript:");
  });
});

describe("SimplePostPreviewElement", () => {
  it("defines and updates the custom element", async () => {
    defineSimplePostPreview();
    const element = document.createElement("simple-post-preview");
    document.body.append(element);
    element.data = { ...base, platform: "youtube", account: { ...base.account, platform: "youtube" } };
    expect(element.shadowRoot?.textContent).toContain("Edmund Clompton");
    expect(element.shadowRoot?.querySelector(".sp-youtube")).not.toBeNull();
  });

  it("supports the theme attribute and returns to dark when it is removed", () => {
    defineSimplePostPreview();
    const element = document.createElement("simple-post-preview");
    element.setAttribute("theme", "light");
    document.body.append(element);
    expect(element.shadowRoot?.querySelector(".sp-theme-light")).not.toBeNull();

    element.removeAttribute("theme");
    expect(element.shadowRoot?.querySelector(".sp-theme-dark")).not.toBeNull();
  });
});

describe("complete media and threads", () => {
  it.each(["x", "threads", "bluesky", "telegram"])("keeps every reply on %s", (platform) => {
    const html = renderPostPreviewHtml({ ...base, platform, thread: Array.from({ length: 12 }, (_, i) => ({ message: `Reply number ${i}`, media: base.media })) });
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(container.textContent).toContain("Reply number 11");
    expect(container.querySelectorAll("img").length).toBeGreaterThanOrEqual(13);
    expect(container.querySelector(".sp-viewport--scroll")?.getAttribute("style")).toContain("720px");
  });

  it.each(["instagram", "tiktok", "telegram", "x", "threads", "bluesky", "facebook", "linkedin", "pinterest"])("includes all six gallery images on %s", (platform) => {
    const container = document.createElement("div");
    container.innerHTML = renderPostPreviewHtml({ ...base, platform, media: Array.from({ length: 6 }, (_, i) => ({ type: "image", url: `https://example.com/${i}.png` })) });
    expect(container.querySelectorAll(".sp-gallery-slide")).toHaveLength(6);
    expect(container.querySelector('[aria-label="6 of 6"] img')?.getAttribute("src")).toBe("https://example.com/5.png");
  });

  it("supports custom height, rejects invalid heights, and expands without a cap", () => {
    expect(renderPostPreviewHtml({ ...base, maxHeight: 480 })).toContain("480px");
    for (const maxHeight of [NaN, Infinity, -1, 0]) expect(renderPostPreviewHtml({ ...base, maxHeight })).toContain("720px");
    const expanded = renderPostPreviewHtml({ ...base, threadLayout: "expand", maxHeight: 480 });
    expect(expanded).toContain("sp-viewport--expand");
    expect(expanded).not.toContain("max-height");
  });

  it("prefers original images over thumbnails", () => {
    const html = renderPostPreviewHtml({ ...base, media: [{ type: "image", url: "https://example.com/original.png", thumbnailUrl: "https://example.com/tiny.png" }] });
    expect(html).toContain("original.png");
    expect(html).not.toContain("tiny.png");
  });
});

describe("interactive previews", () => {
  it("navigates, updates boundaries, and initializes only once", () => {
    const container = document.createElement("div");
    renderPostPreview(container, { ...base, platform: "instagram", media: [base.media![0], base.media![0], base.media![0]] });
    initializePostPreview(container);
    const track = container.querySelector<HTMLElement>(".sp-gallery-track")!;
    Object.defineProperty(track, "clientWidth", { value: 300 });
    Object.defineProperty(track, "scrollWidth", { value: 900 });
    Array.from(track.children).forEach((slide, i) => Object.defineProperty(slide, "offsetLeft", { value: i * 300 }));
    track.scrollTo = vi.fn((options?: ScrollToOptions | number) => { track.scrollLeft = typeof options === "number" ? options : options?.left ?? 0; track.dispatchEvent(new Event("scroll")); });
    const [previous, next] = container.querySelectorAll<HTMLButtonElement>("button");
    expect(previous.disabled).toBe(true);
    next.click();
    expect(track.scrollLeft).toBe(300);
    expect(track.scrollTo).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".sp-gallery-status")?.textContent).toBe("2 / 3");
    track.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
    expect(track.scrollLeft).toBe(600);
    expect(next.disabled).toBe(true);
    previous.click();
    expect(track.scrollLeft).toBe(300);
    track.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
    expect(track.scrollLeft).toBe(0);
    expect(previous.disabled).toBe(true);
  });

  it("decodes an original video frame while retaining the poster until seek succeeds", () => {
    const container = document.createElement("div");
    renderPostPreview(container, { ...base, media: [{ type: "video", url: "https://example.com/video.mp4", thumbnailUrl: "https://example.com/poster.jpg" }] });
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "duration", { value: 4 });
    video.dispatchEvent(new Event("loadedmetadata"));
    expect(video.currentTime).toBe(0.1);
    expect(video.hasAttribute("poster")).toBe(true);
    video.dispatchEvent(new Event("seeked"));
    expect(video.hasAttribute("poster")).toBe(false);
    expect(video.autoplay).toBe(false);
  });
});

describe("media fallback and mixed galleries", () => {
  it("retains a safe poster when the video source is unavailable", () => {
    const container = document.createElement("div");
    renderPostPreview(container, { ...base, media: [{ type: "video", url: "javascript:alert(1)", thumbnailUrl: "https://example.com/poster.jpg" }] });
    const video = container.querySelector("video")!;
    expect(video.hasAttribute("src")).toBe(false);
    expect(video.getAttribute("poster")).toContain("poster.jpg");
  });

  it("keeps mixed galleries independent inside thread replies", () => {
    const container = document.createElement("div");
    const media = [base.media![0], { type: "video" as const, url: "https://example.com/video.mp4" }];
    renderPostPreview(container, { ...base, platform: "threads", media, thread: [{ message: "Reply", media }] });
    expect(container.querySelectorAll(".sp-gallery")).toHaveLength(2);
    expect(container.querySelectorAll(".sp-gallery-slide video")).toHaveLength(2);
    expect(container.querySelectorAll(".sp-gallery-controls:not([hidden])")).toHaveLength(2);
  });
});
