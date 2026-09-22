export const PREVIEW_PLATFORMS = [
  "x",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "bluesky",
  "threads",
  "linkedin",
  "pinterest",
  "telegram",
  "forem",
] as const;

export type PreviewPlatform = (typeof PREVIEW_PLATFORMS)[number];
export type PreviewPlatformInput = PreviewPlatform | "twitter";
export const PREVIEW_THEMES = ["dark", "light"] as const;
export type PreviewTheme = (typeof PREVIEW_THEMES)[number];

export interface PreviewAccount {
  id?: string;
  platform: PreviewPlatformInput | (string & {});
  displayName?: string | null;
  username?: string | null;
  profilePicture?: string | null;
}

export interface PreviewMedia {
  id?: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string | null;
  /** Optional source dimensions, used for media layout before images load. */
  width?: number;
  height?: number;
  filename?: string;
  alt?: string;
}

export interface PreviewThreadItem {
  message: string;
  media?: PreviewMedia[];
}

export interface PostPreviewData {
  platform?: PreviewPlatformInput | (string & {});
  theme?: PreviewTheme;
  /** X is rolling out swipeable media; select grid for its classic feed layout. */
  xMediaLayout?: "carousel" | "grid";
  account: PreviewAccount;
  message?: string;
  media?: PreviewMedia[];
  options?: Record<string, unknown>;
  thread?: PreviewThreadItem[];
  /** Scroll within maxHeight (default), or expand to fit the complete post/thread. */
  threadLayout?: "scroll" | "expand";
  /** Maximum preview height in CSS pixels in scroll mode. Defaults to 720. */
  maxHeight?: number;
  previewDate?: Date | string | number;
}

export interface RenderPostPreviewOptions {
  shadow?: boolean;
}
