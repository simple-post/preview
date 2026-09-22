# Multi-image rendering references

Reviewed 22 September 2026. These previews model feed posts, not upload/composer
screens. Platform UI varies across clients and rollouts; the choices below are
explicit reference variants, not a claim of identical rendering on every device.

| Platform | Feed presentation implemented | Reference and limits |
| --- | --- | --- |
| Instagram | One image per page; small white circular arrows at the left/right center on desktop; upper-right count; gray dots with a blue active dot below the media. Touch users swipe. | [Meta announcement and screenshots](https://about.fb.com/ja/news/2017/02/instagram_sharemultiple/) establish swipe and dots. Desktop side-arrow positioning also follows the user's observed Instagram UI. The first image establishes the frame ratio; mixed images are cropped into that frame. |
| X | Arrow-free horizontal cards with the next card peeking in and small dots above. `xMediaLayout: "grid"` selects the classic 2/3/4-image collage. | [Firsthand August 2026 comparison with screenshots](https://note.com/colorsher/n/nc1927fc5193e) documents a gradual carousel rollout and surviving grid clients. [X Help](https://help.x.com/en/using-x/posting-gifs-and-pictures) documents up to four images. The carousel reference screenshot was visually inspected; it shows no arrows and dots above the cards. |
| Threads | Separately rounded cards in a horizontally scrolling strip, a visible next card, no numbered badge or dots; small overlaid desktop arrows. | [Meta identifies photo/video carousel posts](https://about.fb.com/news/2024/10/find-your-community-with-new-threads-educational-insights/). [Launch feed screenshots](https://www.g-enews.com/article/Global-Biz/2023/07/202307061113372596b418061615_1) provide visual context. The strip sizing is a preview approximation, rather than a published pixel specification. |
| TikTok | Portrait photo-mode stage; images contained against black, count at upper right, dots above the caption, swipe/drag navigation, no arrow toolbar. | [TikTok Photo Mode announcement](https://newsroom.tiktok.com/editing-tools?lang=en) describes swiping through still photos. The preview remains paused and silent rather than automatically advancing with music. Overlay spacing is an approximation of the mobile feed. |
| Bluesky | Two square cells side by side; three cells with one large left and two stacked right; four 3:2 cells in a 2×2 grid, with 4px gutters. | [Official app source, ImageLayoutGrid](https://github.com/bluesky-social/social-app/blob/main/src/components/images/ImageLayoutGrid.tsx), read directly from the repository, specifies these geometries. |
| Telegram | Contiguous album tiles in a chat bubble, no carousel chrome; justified rows for larger albums and orientation-aware small groups. | [Telegram album announcement](https://telegram.org/blog/albums-saved-messages) specifies proportioned thumbnails and up to ten items per album. The preview uses a simplified justified-row layout; Telegram's full client algorithm can crop mixed-ratio albums differently. |
| Facebook | Multi-photo collage, two large cells above three smaller cells for five or more images, +N on the last visible cell. | [Facebook Help](https://www.facebook.com/help/iphone-app/187741037945488) confirms selectable multi-photo layouts. This implements the conventional collage variant, not every optional layout or ad carousel. |
| LinkedIn | Multi-photo collage, with a prominent first image at the top for landscape or at the left for square/portrait; two-image posts sit side by side. +N opens additional images. | [LinkedIn's layout rules](https://www.linkedin.com/help/linkedin/answer/a527229/share-photos-or-videos?lang=en) distinguish these orientation-dependent layouts. [Official multi-photo launch examples](https://news.linkedin.com/2017/7/july-product-roundup) show the collage format. This is a photo post, not a PDF/document carousel. Secondary-cell crop sizes are approximated. |
| Pinterest | Carousel Pin with one card at a time, bottom dots and overlaid desktop arrows. | [Pinterest carousel documentation](https://help.pinterest.com/en/business/article/create-a-carousel) describes feed swiping, 2–5 cards, and square or 2:3 formats. This models the carousel Pin format, which is created through business tools, not a claim that all ordinary Pins support albums. |
| YouTube / Forem | Existing single video / article-cover behavior. | Neither is treated as a multi-image social feed in this library. |

## Interaction and fidelity boundaries

- Collage tiles open an **inline album viewer**, with Back to album / Escape,
  keyboard navigation and previous/next buttons. This is an intentional preview
  convenience: actual platforms commonly open a full-screen/lightbox viewer.
  No zoom is implemented. Feed collages never display carousel arrows.
- `PreviewMedia.width` and `height` seed orientation before image loading. Loaded
  dimensions refine the first-image orientation and carousel frame. Missing
  dimensions initially use square media. Telegram's larger row proportions use
  the supplied dimensions; pass them for mixed-ratio albums.
- The library preserves all supplied attachments. Inputs above platform posting
  limits remain inspectable and are **not publishing validation**. The demo starts
  with four images and offers larger counts as stress cases.
- Tests cover platform markup, real-offset navigation for peeking strips, active
  indicators, album overflow/return focus, source orientation, and all replies.
  Browser QA checks geometry and interaction rather than just HTML snapshots.
