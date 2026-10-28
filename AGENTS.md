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
- Viewing progress is recorded from media playback events, never card navigation, so Continue Watching reflects actual viewing.
- Creator Studio overview reuses the analytics panel rather than simulated statistics, so overview and detailed analytics share one source.
- Profile resolves device-saved IDs against published CMS content and shows only the authenticated account profile; this avoids invented personalization and family accounts.
- Studio workspace status reads persisted channel/input state without changing broadcast lifecycle; transient Starting comes from the existing broadcast action.
- Device personalization writes happen outside React state updater callbacks; synchronous store events must not trigger duplicate toggles during render replay.
- Mobile bottom clearance is CSS-driven by `data-bottom-nav`, `data-radio-player` and `data-site-footer` in styles.css; the footer absorbs nav clearance so pages end flush with no strip below it.
- Account avatars live in `profiles.avatar_url` as a preset key (`preset:male`/`preset:female`) or a signed URL to the private `avatars` bucket (`<user id>/` folder); resolve through `src/lib/account-profile.ts` so header, Profile and Account stay in sync.
- Copy/selection blocking lives in ContentProtection; Studio/Admin routes, form fields and [data-allow-copy] are exempt so creators can copy keys and IDs, and in-app copy buttons use the Clipboard API so they keep working.
