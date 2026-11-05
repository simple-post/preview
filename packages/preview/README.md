# `@simple-post/preview`

Framework-agnostic social post previews and the `<simple-post-preview>` Web Component.

```html
<simple-post-preview platform="x" theme="light" message="Hello!"></simple-post-preview>
```

Dark is the default. Pass `theme: "light"` in `PostPreviewData` when using the JavaScript rendering API.

See the [repository documentation](https://github.com/simple-post/preview#readme) for supported platforms and usage.

### Media galleries and long threads

Multi-item `media` arrays use platform-specific carousels, strips, grids, or
albums. Instagram has centered overlay arrows; X has an arrow-free strip
(`xMediaLayout: "grid"` selects its classic layout). Collage tiles open an inline
album viewer. Swiping, mouse dragging and keyboard navigation remain available. Threads include all replies. Set `data.threadLayout` to
`"scroll"` (default, 720px maximum) or `"expand"` to fit the complete thread, and
use `data.maxHeight` to customize the scroll height in pixels. These data options
also work through the React and Vue adapters.

Video previews decode a frame from the original source; `thumbnailUrl` is the
loading/error fallback. Images prefer the original `url` over `thumbnailUrl`.
When inserting `renderPostPreviewHtml()` output yourself, include `previewStyles`
and call `initializePostPreview(container)` to enable gallery controls and video
frame loading. Direct rendering and Web Components do this automatically.

## Localization

Set `locale` on `PostPreviewData` in JavaScript, React, or Vue, or use the
`locale` attribute on `<simple-post-preview>`. The default is English.

```ts
renderPostPreview(element, {
  locale: "bg",
  account: { platform: "x", username: "ada" },
  message: "This user-authored text stays exactly as supplied.",
});
```

Bundled locales: `en`, `es`, `pt-BR`, `fr`, `de`, `ja`, `it`, `ko`, `zh-Hans`,
`zh-Hant`, `ar`, `hi`, `id`, `tr`, and `bg`. Regional variants resolve to a
supported language; Chinese script variants are preserved. Unsupported or
malformed tags fall back to English. Arabic uses right-to-left interface
direction. Ordered media tracks retain left-to-right navigation.

Controls, empty placeholders, fallback media labels, timestamps, and live media
position announcements are localized per preview. Post text, threads, account
identity, filenames, supplied alternative text, and platform option values are
never translated. Locale state is isolated between renders, including SSR.

`yarn check` builds all adapters, typechecks, tests locale resolution, verifies
catalog keys and placeholders, and checks package contents.
