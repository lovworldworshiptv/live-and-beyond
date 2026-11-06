/* Lettflix TV (VIDAA) configuration. The key is the public "publishable" key the website ships. */
window.LETT_CONFIG = {
  SUPABASE_URL: "https://ojjcfsuqdvfgqydgtdoj.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qamNmc3VxZHZmZ3F5ZGd0ZG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMDc2NjgsImV4cCI6MjA5ODU4MzY2OH0.k9V7Fxp3DaMSkJJjaKuKorFTCZZDxdPyTKr04QCipCo",
  // Same-origin when served from lettflix.com/tv/ (KingsChat sign-in needs that: its API sends no CORS headers).
  API_ORIGIN: /(^|\.)lettflix\.com$/.test(location.hostname) ? "" : "https://lettflix.com",
  WEB_ORIGIN: "https://lettflix.com",
  VERSION: "1.0.0"
};
