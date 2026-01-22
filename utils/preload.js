// utils/preload.js

export const preloadModel = (url) => {
  if (!url) return;
  
  // Check if already preloaded to avoid duplicates
  if (document.querySelector(`link[rel="preload"][href="${url}"]`)) return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "fetch"; // 'fetch' is correct for .glb files
  link.href = url;
  link.crossOrigin = "anonymous";
  
  document.head.appendChild(link);
  
  // Optional: Actually fetch it to force disk caching immediately
  fetch(url, { mode: 'cors' }).catch(() => {});
};