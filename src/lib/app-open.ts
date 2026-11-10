import type { AppLinks } from "./share-link.functions";

/** Deep link the Android app handles: <scheme>://open/<type>/<id>. */
export function appDeepLink(links: AppLinks, type: string, id: string) {
  return `${links.appScheme}://open/${type}/${id}`;
}

/** Android intent URL: opens the installed app, else falls back to the store (or web). */
export function androidIntentUrl(links: AppLinks, type: string, id: string, fallback: string) {
  const fb = links.playStoreUrl || fallback;
  return `intent://open/${type}/${id}#Intent;scheme=${links.appScheme};package=${links.androidPackage};S.browser_fallback_url=${encodeURIComponent(fb)};end`;
}
