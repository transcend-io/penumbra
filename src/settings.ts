export const settings =
  (document.currentScript || document.querySelector('script[data-penumbra]'))
    ?.dataset || ({} as DOMStringMap);
