# Lettflix Android app — shared links handoff

Every channel and creator account has a unique share link (also encoded in the share-card QR code):

- Channel: `https://lettflix.com/open/channel/<channel uuid or slug>`
- Creator: `https://lettflix.com/open/creator/<creator user uuid>`

## What the web page does
1. Opened inside the app (user agent contains `LettflixApp`): shows content, no redirect.
2. Android browser: immediately fires
   `intent://open/<type>/<id>#Intent;scheme=lettflix;package=com.lettflix.app;S.browser_fallback_url=<Play Store URL>;end`
   - App installed -> Android opens the app with `lettflix://open/<type>/<id>`.
   - App missing -> browser goes to the Play Store link.
3. Buttons: Open in app, Google Play, Loveworld AppStore, Continue on web.

Scheme, package ID and store links are editable in Admin -> Audience -> Phone app links (stored in `cms_settings` key `appLinks`).

## Android app tasks
1. Add an intent filter for `lettflix://open/...` (scheme `lettflix`, host `open`) and route:
   - `/channel/<id>` -> channel screen (id may be a uuid or slug).
   - `/creator/<id>` -> creator screen (list their published channels).
2. Recommended: Android App Links for `https://lettflix.com/open/*` (`autoVerify`). Then provide the package name and the release SHA-256 signing fingerprint so the website can publish `/.well-known/assetlinks.json`.
3. Append `LettflixApp` to the WebView / HTTP user agent so the site knows it is inside the app.
4. Analytics parity: call the same events as the web (`audience_events` via the site's `recordAudienceEvent` server function, kinds `visit`, `click`, `stream`, `share_open`; services `tv`, `radio`, `vod`, `podcast`). Location is filled in server-side.
5. Make sure the package ID matches the value in Admin (default `com.lettflix.app`).
