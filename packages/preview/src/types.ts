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
  filename?: string;
  alt?: string;
}

export interface PreviewThreadItem {
  message: string;
  media?: PreviewMedia[];
}

export interface PostPreviewData {
  platform?: PreviewPlatformInput | (string & {});
  account: PreviewAccount;
  message?: string;
  media?: PreviewMedia[];
  options?: Record<string, unknown>;
  thread?: PreviewThreadItem[];
  previewDate?: Date | string | number;
}

export interface RenderPostPreviewOptions {
  shadow?: boolean;
}
