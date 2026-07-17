import { getPostPreviewRuntime, POST_PREVIEW_RUNTIME_EVENT } from "./render";
import type { PostPreviewData } from "./types";

const emptyData: PostPreviewData = {
  account: { platform: "x" },
  platform: "x",
};

const HTMLElementBase = (globalThis.HTMLElement || class {}) as typeof HTMLElement;

export class SimplePostPreviewElement extends HTMLElementBase {
  static readonly tagName = "simple-post-preview";
  static get observedAttributes(): string[] {
    return ["platform", "message", "theme"];
  }

  readonly #root: ShadowRoot;
  #data: PostPreviewData = emptyData;
  readonly #handleRuntimeUpdate = () => this.#render();

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    document.addEventListener(POST_PREVIEW_RUNTIME_EVENT, this.#handleRuntimeUpdate);
    this.#readAttributes();
    this.#render();
  }

  disconnectedCallback(): void {
    document.removeEventListener(POST_PREVIEW_RUNTIME_EVENT, this.#handleRuntimeUpdate);
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === "theme" && newValue === null) {
      this.#data = { ...this.#data, theme: "dark" };
    }
    this.#readAttributes();
    if (this.isConnected) this.#render();
  }

  get data(): PostPreviewData {
    return this.#data;
  }

  set data(value: PostPreviewData) {
    this.#data = value || emptyData;
    if (this.isConnected) this.#render();
  }

  #readAttributes(): void {
    const platform = this.getAttribute("platform");
    const message = this.getAttribute("message");
    const theme = this.getAttribute("theme");
    if (platform || message !== null || theme !== null) {
      this.#data = {
        ...this.#data,
        ...(platform ? { platform, account: { ...this.#data.account, platform } } : {}),
        ...(message !== null ? { message } : {}),
        ...(theme !== null ? { theme: theme === "light" ? "light" : "dark" } : {}),
      };
    }
  }

  #render(): void {
    getPostPreviewRuntime().render(this.#root, this.#data);
  }
}

export function defineSimplePostPreview(tagName = SimplePostPreviewElement.tagName): void {
  if (typeof customElements !== "undefined" && !customElements.get(tagName)) {
    customElements.define(tagName, SimplePostPreviewElement);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "simple-post-preview": SimplePostPreviewElement;
  }
}
