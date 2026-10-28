# Lettflix Roadmap

## Done
- [x] Homepage, channels, guide, movies/series/documentaries/podcasts, radio
- [x] Auth (email, Google, Apple, KingsChat), profile, account settings, MFA
- [x] Admin CMS (channels, titles, schedule, events, sponsors, homepage, nav)
- [x] Creator Studio: live ingest, external source, automated TV, team, analytics
- [x] Adaptive quality streaming with Quality menu and protected stream links
- [x] Netflix-style landing page, legal pages
- [x] Landing page hover effects and entrance/scroll animations

## UI/UX polish
- [x] Profile: natural greeting, saved activity navigation, honest account profiles, mobile layout
- [x] Studio: persistent real broadcast status, task groups, dated metrics, guided setup, mobile controls
- [x] Authenticated desktop/mobile checks: activity tabs, real movie save/remove readback, Edit profile, Studio sections, setup wizard, checklist navigation, status refresh, analytics periods; no overflow
- [x] Landing account/plans buttons, truthful supporting copy, and next-section arrow
- [x] Landing hero headline shimmer sweep; account and plans buttons grouped closely
- [x] Touch cards navigate directly; hover previews limited to fine pointers and real streams
- [x] Mobile bottom spacing and feedback placement above navigation
- [x] Swipe-snap rows with edge fades
- [x] Sticky mobile channel player during playback
- [x] Published programme Guide with Now / Next / Schedule views
- [x] Radio lock-screen controls and mini-player positioned above mobile/tablet navigation
- [x] Studio quick live/off-air status and real analytics; broadcast controls remain unchanged
- [x] Mobile account section navigation and working sign-out
- [x] Clear filter recovery across channels, movies, catalogue hubs and radio
- [x] Reminder feedback accurately says it is saved on this device
- [x] Viewing history uses playback events; removed sample previews, episodes, ratings and catalogue counts
- [x] Desktop and phone checks: landing links/arrow, filter reset, Guide views, account sections, Studio broadcast controls; no runtime errors or horizontal overflow
- [x] Footer runs to the bottom of the screen on all pages; 2-up mobile footer, legal links, dead buttons/placeholder links hidden
- [x] Modern profile header with avatar choice (male / female presets or uploaded photo), shown in the top bar and account settings
- [x] Legal pages styled with site header/footer; consistent 24px phone margins; Pricing stray divider removed
- [ ] Verify successful published movie playback and Continue Watching readback — blocked by current movie source failing playback (media error 4)
- [ ] Verify live radio playback and device lock-screen controls — blocked by no published radio stations

## Platform protection
- [x] Block right-click, image/video dragging and save/print/view-source shortcuts
- [x] Hide video when the window loses focus or a screenshot key is pressed
- [x] Stronger screenshot/recording blocking: black video on capture shortcuts (PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5, Win+Alt+R) and in-page screen sharing, warning message, no picture-in-picture or casting, traceable account watermark on playing video (kept in fullscreen)
- [x] Right-click and long-press menus blocked across the whole site (text fields excepted)
- [ ] True screenshot/recording blocking needs DRM (Widevine/FairPlay) through the video provider — browsers cannot stop OS capture on their own

## Lettflix Games and Earn (from uploaded brief)
- [ ] Phase 1 Foundation: game colours/fonts, ticket stub, /games hub, earnings bar, nav entries
- [ ] Phase 2 Quick plays: shared stage, Trivia Blitz, LettWord, Poster Flip, Reel Runner, Tune Drop, server scoring
- [ ] Phase 3 Predict & Win: contests, slips, slip drawer, /admin/games with two-step settlement, audit log
- [ ] Phase 4 Referrals & earnings: codes/links, attribution, payment webhook, 2% commission, refunds, /earn and /earn/referrals — needs Paystack or Flutterwave
- [ ] Phase 5 Watch & earn, payouts: watch coins, tickets/draws, hold period, bank verification, withdrawals
- [ ] Phase 6 Live & social: player overlay, party rooms, leaderboards, share cards
- [ ] Phase 7 Safety: 18+ check, play limits, fraud panel, paid_entry_enabled flag (off) — needs legal sign-off

## Assets
- [x] Lettflix logo with transparent background (Files)
- [ ] Netflix logo file — declined: it is Netflix's trademark
