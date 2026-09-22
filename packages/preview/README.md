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
