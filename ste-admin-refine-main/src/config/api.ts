const rawApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:1337";
const rawViewerOrigin =
  import.meta.env.VITE_VIEWER_ORIGIN ?? window.location.origin;

export const API_URL = rawApiUrl.replace(/\/$/, "");
export const API_URL_WITH_API = `${API_URL}/api`;
export const VIEWER_ORIGIN = rawViewerOrigin.replace(/\/$/, "");
