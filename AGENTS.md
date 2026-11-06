<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Public discovery lists must use published CMS rows and published schedule entries, never seed catalog fallbacks, so empty catalogues stay honest.
- Movie artwork uses MovieArtwork to try the same title's alternate image then a bundled brand fallback; never substitute another title's artwork when a URL fails.
- Viewing progress is recorded from media playback events, never card navigation, so Continue Watching reflects actual viewing.
- Creator Studio overview reuses the analytics panel rather than simulated statistics, so overview and detailed analytics share one source.
- Profile resolves device-saved IDs against published CMS content and shows only the authenticated account profile; this avoids invented personalization and family accounts.
- Studio workspace status reads persisted channel/input state without changing broadcast lifecycle; transient Starting comes from the existing broadcast action.
- Device personalization writes happen outside React state updater callbacks; synchronous store events must not trigger duplicate toggles during render replay.
- Mobile bottom clearance is CSS-driven by `data-bottom-nav`, `data-radio-player` and `data-site-footer` in styles.css; the footer absorbs nav clearance so pages end flush with no strip below it.
- Account avatars live in `profiles.avatar_url` as a preset key (`preset:male`/`preset:female`) or a signed URL to the private `avatars` bucket (`<user id>/` folder); resolve through `src/lib/account-profile.ts` so header, Profile and Account stay in sync.
- Copy/selection blocking lives in ContentProtection; Studio/Admin routes, form fields and [data-allow-copy] are exempt so creators can copy keys and IDs, and in-app copy buttons use the Clipboard API so they keep working.
- Browser/app icons (favicon, apple-touch-icon, manifest icons) are static files in `public/` derived from the `lettflix-icon` asset, so tabs, home-screen installs and lock-screen artwork share one brand mark; regenerate them together when the logo changes.
- Video players expose only the browser's native fullscreen button (beside volume), by user choice; no custom overlay button and no forced redirect to the frame, which caused fullscreen drop-outs. Double-click still uses `usePlayerFullscreen` on the frame.
- Video frames share viewport-constrained 16:9 sizing through data-video-player; contain playback without cropping, while audio frames retain their own proportions.
- Live provider operations must call the existing channel-management permission function before external side effects; preserve owner, team and admin access and fail closed on lookup errors.
- Account security actions use verified Auth requests; unavailable payments, community rooms and account deletion must never display simulated success.
- Channel thumbnails preserve uploaded artwork and recover missing or failed URLs with bundled, category-matched editorial artwork; generated images must not imply a real current programme.
- Channel overview shelves and libraries share the published CMS library fetch, combining channel_id uploads with curated slug links and deduplicating titles, so creator-published movies appear without manual linking.
- The VIDAA TV app in `public/tv/` is a self-contained static app: never edit, lint or bundle it; `src/server.ts` short-circuits `/tv` paths before any app route, and TV-only sign-in behaviour (short `/k/` links, phone result pages, CORS allow-list) is opt-in via `device: "tv"`, and KingsChat attempts with a `/tv/` return_path (the TV on-screen sign-in) return to that path after the callback, so web and Android flows stay unchanged.
- Admins open any creator's Studio via /studio?channel=<id>; edits keep the channel's original creator_id so ownership never transfers to the admin.
