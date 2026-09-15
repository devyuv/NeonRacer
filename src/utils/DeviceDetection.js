export const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
export function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch { return false; }
}
export function vibrate(ms, enabled=true) {
  if (enabled && navigator.vibrate) navigator.vibrate(ms);
}