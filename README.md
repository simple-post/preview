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

For simple text previews, `platform` and `message` are also available as HTML attributes.

## React

```bash
npm install @simple-post/preview-react
```

```tsx
import { PostPreview } from "@simple-post/preview-react";

export function Example() {
  return <PostPreview data={{ platform: "bluesky", account: { platform: "bluesky", username: "ada" }, message: "Hello!" }} />;
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
  <PostPreview :data="{ platform: 'threads', account: { platform: 'threads', username: 'ada' }, message: 'Hello!' }" />
</template>
```

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
