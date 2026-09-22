# Simple Post Preview

Framework-agnostic previews of unpublished social posts. One renderer powers the native Web Component and the React and Vue adapters, so each framework produces the same output.

Supported platforms: X, Instagram, Facebook, TikTok, YouTube, Bluesky, Threads, LinkedIn, Pinterest, Telegram, and Forem.

## Packages

| Package | Use it for |
| --- | --- |
| `@simple-post/preview` | Vanilla JavaScript, the Web Component, or direct DOM rendering |
| `@simple-post/preview-react` | React 18 and newer |
| `@simple-post/preview-vue` | Vue 3.3 and newer |

## Web Component

```bash
npm install @simple-post/preview
```

```ts
import "@simple-post/preview/element";

const preview = document.querySelector("simple-post-preview");
preview.data = {
  platform: "x",
  theme: "light",
  account: {
    platform: "x",
    displayName: "Ada Lovelace",
    username: "ada",
    profilePicture: "https://example.com/ada.jpg",
  },
  message: "A post that has not been published yet.",
  media: [
    { type: "image", url: "https://example.com/image.jpg", alt: "Example" },
  ],
};
```

```html
<simple-post-preview></simple-post-preview>
```

For simple text previews, `platform`, `message`, and `theme` are also available as HTML attributes:

```html
<simple-post-preview platform="x" theme="light" message="Hello!"></simple-post-preview>
```

## React

```bash
npm install @simple-post/preview-react
```

```tsx
import { PostPreview } from "@simple-post/preview-react";

export function Example() {
  return <PostPreview theme="light" data={{ platform: "bluesky", account: { platform: "bluesky", username: "ada" }, message: "Hello!" }} />;
}
```

## Vue

```bash
npm install @simple-post/preview-vue
```

```vue
<script setup lang="ts">
import { PostPreview } from "@simple-post/preview-vue";
</script>

<template>
  <PostPreview theme="light" :data="{ platform: 'threads', account: { platform: 'threads', username: 'ada' }, message: 'Hello!' }" />
</template>
```

## Themes

Every renderer supports `dark` and `light`. Dark is the default, preserving the behavior of earlier releases. Set `theme` on `PostPreviewData`, use the framework adapter's `theme` prop, or use the Web Component attribute. Each platform has its own light palette rather than a generic color inversion.

## Direct DOM rendering

The core package also exposes `renderPostPreview(target, data)` and `renderPostPreviewHtml(data)`. Content and attribute values are escaped, and media URLs are limited to browser-safe protocols.

## Local development

This repository uses Yarn 4 (the pinned release in `.yarn/releases` runs automatically).

```bash
yarn install
yarn test
yarn build
yarn check   # build + typecheck + test + pack dry-run, same as CI
```

### Developing against the Simple Post scheduler

When this repository is checked out next to the Simple Post `core` repository, link the packages into the scheduler with [Yarn portals](https://yarnpkg.com/cli/link):

```bash
# in core/scheduler — adds portal: resolutions to core/package.json
yarn preview:link

# in this repository — rebuild dist/ on every change
yarn dev
```

Then run `yarn dev` in `core/scheduler` as usual; Next.js picks up rebuilt output through the portal symlinks. When you are done, remove the portals so the scheduler uses the published npm packages again:

```bash
# in core/scheduler
yarn preview:unlink
```

Do not commit the `portal:` resolutions that `preview:link` adds to `core/package.json` — they only resolve on machines that have this repository checked out as a sibling. Note that `preview:unlink` re-resolves the pinned versions from npm, so it requires the versions referenced by `core` to actually be published.

## Releasing

Releases use [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and do not require an npm token.

1. Configure each npm package to trust the GitHub repository `simple-post/preview` and workflow `publish.yml`.
2. Push a semantic-version tag such as `v0.1.0` from the commit to release.
3. The workflow verifies, builds, stamps all package versions from the tag, and publishes the core package before its adapters.

```bash
git tag v0.1.0
git push origin v0.1.0
```

The tag is the source of truth for the published version; no release commit is generated.

## License

MIT

## Carousels, long threads, and video quality

Provide every attachment in `media`. Rendering follows the platform's feed:

- Instagram: overlaid, vertically centered arrows and pagination dots.
- X: arrow-free swipeable cards with dots above; `xMediaLayout: "grid"` selects
  the classic grid for clients without the carousel rollout.
- Threads: rounded cards with the next image peeking into view.
- TikTok: portrait photo mode with swipe navigation and overlaid dots.
- Bluesky and Telegram: feed grids / tiled chat albums.
- Facebook and LinkedIn: multi-photo collages with overflow counts.
- Pinterest: carousel Pin presentation with dots and overlaid controls.

Swipe, drag with a mouse, use supported arrow controls, or focus a strip and use
Left/Right, Home, or End. Click collage tiles to open an inline album viewer;
Back to album or Escape restores the feed and focus. All attachments remain
reachable without zoom. Single attachments retain their existing layout.
YouTube and Forem retain their single video/cover layout.

Optional `PreviewMedia.width` and `height` provide source dimensions for initial
layout. The first loaded image refines carousel framing and collage orientation.
See [research notes](examples/media-research.md) for source links, client variants,
and deliberate approximations.

Threads on X, Threads, Bluesky, and Telegram include **every** reply. By default,
the complete preview scrolls vertically within 720px. Configure the same data in
vanilla JavaScript, React, or Vue:

```ts
const data = {
  account: { platform: "x", username: "alex" },
  message: "The beginning of a long thread",
  thread: Array.from({ length: 12 }, (_, i) => ({ message: `Reply ${i + 1}` })),
  threadLayout: "scroll" as const, // "expand" grows to fit all content
  maxHeight: 520,                 // positive CSS pixels; scroll mode only
};
```

`--simple-post-preview-max-height` overrides `maxHeight` in scroll mode. For
expanded previews, ensure the containing application also allows the element to
grow rather than imposing a fixed height with hidden overflow.

Images use their original URL instead of a potentially small thumbnail. Video
previews decode a frame near the start of the original video without autoplay or
canvas downsampling. `thumbnailUrl` remains the loading/error fallback. This
requires the browser to load video data; source resolution, browser codec support,
and media availability still determine the result.

`renderPostPreview` and all adapters initialize galleries and video frames
automatically. With `renderPostPreviewHtml`, include `previewStyles` and call
`initializePostPreview(container)` after inserting the HTML to enable buttons and
original video frames. Without JavaScript, galleries still scroll natively.

### Interactive examples

Run `yarn examples` and open <http://127.0.0.1:5173/examples/>. The demo uses local
media and includes platform/theme switches, side-by-side platform layouts, image-count and aspect-ratio controls, twelve-reply
threads with a scroll/expand toggle, and a 1280×720 video with an intentionally
small poster to compare quality. The generated video test pattern is included at
`examples/quality.webm`; no external media services are required.
