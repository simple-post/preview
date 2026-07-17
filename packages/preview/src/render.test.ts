import { describe, expect, it } from "vitest";

import { renderPostPreviewHtml } from "./render";
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
