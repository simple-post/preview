import {
  defineSimplePostPreview,
  SimplePostPreviewElement,
  type PostPreviewData,
  type PreviewTheme,
} from "@simple-post/preview";
import type * as React from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties, type HTMLAttributes } from "react";

export interface PostPreviewProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  data: PostPreviewData;
  theme?: PreviewTheme;
  style?: CSSProperties;
}

export const PostPreview = forwardRef<SimplePostPreviewElement, PostPreviewProps>(function PostPreview(
  { data, theme, ...props },
  forwardedRef,
) {
  const elementRef = useRef<SimplePostPreviewElement>(null);

  useImperativeHandle(forwardedRef, () => elementRef.current as SimplePostPreviewElement, []);

  useEffect(() => {
    defineSimplePostPreview();
    if (elementRef.current) elementRef.current.data = theme ? { ...data, theme } : data;
  }, [data, theme]);

  return <simple-post-preview ref={elementRef} {...props} />;
});

export type {
  PostPreviewData,
  PreviewAccount,
  PreviewMedia,
  PreviewPlatform,
  PreviewPlatformInput,
  PreviewThreadItem,
  PreviewTheme,
} from "@simple-post/preview";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "simple-post-preview": React.DetailedHTMLProps<React.HTMLAttributes<SimplePostPreviewElement>, SimplePostPreviewElement>;
    }
  }
}
