import {
  defineSimplePostPreview,
  type PostPreviewData,
  type PreviewTheme,
  type SimplePostPreviewElement,
} from "@simple-post/preview";
import { defineComponent, h, onMounted, ref, watch, type PropType } from "vue";

export const PostPreview = defineComponent({
  name: "PostPreview",
  inheritAttrs: false,
  props: {
    data: {
      type: Object as PropType<PostPreviewData>,
      required: true,
    },
    theme: {
      type: String as PropType<PreviewTheme>,
      required: false,
    },
  },
  setup(props, { attrs, expose }) {
    const element = ref<SimplePostPreviewElement>();
    const update = () => {
      if (element.value) element.value.data = props.theme ? { ...props.data, theme: props.theme } : props.data;
    };

    onMounted(() => {
      defineSimplePostPreview();
      update();
    });
    watch([() => props.data, () => props.theme], update, { deep: true });
    expose({ element });

    return () => h("simple-post-preview", { ...attrs, ref: element });
  },
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
