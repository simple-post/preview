import {
  defineSimplePostPreview,
  type PostPreviewData,
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
  },
  setup(props, { attrs, expose }) {
    const element = ref<SimplePostPreviewElement>();
    const update = () => {
      if (element.value) element.value.data = props.data;
    };

    onMounted(() => {
      defineSimplePostPreview();
      update();
    });
    watch(() => props.data, update, { deep: true });
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
} from "@simple-post/preview";
