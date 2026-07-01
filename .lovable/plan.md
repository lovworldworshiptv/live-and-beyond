# Lettflix Expansion Plan

Big scope — breaking it into focused workstreams. I'll research the reference site (epouranic-movies) for hover-preview and card-action patterns, then build out the rest per your PRD.

## 1. Research reference site
- Log in to https://epouranic-movies.lovable.app with the provided test creds via Playwright
- Capture screenshots + DOM of movie cards (hover preview) and channel cards (reminder / EPG / share actions)
- Extract the interaction patterns (timing, layout, overlay style) to imitate — not copy code

## 2. Enhance /on-demand
- **HoverPreviewCard**: shared component with a delayed video/still preview, expanded metadata panel, quick actions (Play, +My List, Info, Share)
- **Featured Collections**: curated bundles (e.g. "Faith & Family", "Live Concerts 2026", "Africa Rising", "Founders & Builders") — hero-styled collection cards linking to a filtered library view
- **Continue Watching**: reads progress from Lovable Cloud per authenticated user; visible only when signed in, falls back to marketing prompt otherwise
- **Pagination**: library grid switches from "show everything" to paginated (e.g. 24 per page) with page controls + result count

## 3. Replicate card interactions on /channels
- Channel cards get hover preview (live still + now-playing overlay)
- Action buttons on hover: **Remind me**, **EPG (mini schedule popover)**, **Share**
- Same HoverPreviewCard primitive reused across channels + on-demand for consistency

## 4. Guide page (`/guide`)
- Full Electronic Program Guide: time-grid across all channels
- Sticky channel column, horizontally scrolling timeline (now → +12h)
- Click a slot → detail popover with Remind / Watch Live
- Filters: category, language, live-only

## 5. Creator & Channel Portal (`/portal`)
- Dashboard shell for creators: performance metrics (views, watch-time, revenue share), content library, upload/schedule CTA, audience insights
- Read-only mocked data for now (no backend writes) — realistic charts + tables
- Sub-routes: `/portal` (overview), `/portal/content`, `/portal/analytics`, `/portal/revenue`

## 6. User Profile experience (`/profile`)
- Personalized landing: avatar, display name, "My List", Continue Watching, Recently Watched, Favorite Channels, Following (creators)
- Backed by Cloud (auth + tables) so it's real, not mock

## 7. Account Settings (`/account`)
- Sections: Profile, Subscription & Billing, Playback & Language, Notifications, Devices, Privacy & Data, Sign Out
- Real profile edit wired to Cloud; other sections realistic UI-only

## 8. Community features (`/community`)
- Global feed of reactions/comments on live events
- Watch Parties (create/join), Fan Clubs per channel, Leaderboard of top viewers/supporters
- UI-first with a small Cloud-backed comment table for the live feed

## 9. Enterprise services (`/enterprise`)
- Marketing page for LoveWorld Enterprise: broadcast distribution, church campus streaming, ad partnerships, white-label channel hosting, API access
- Tiered plans, contact-sales form (writes to a `leads` table in Cloud), case studies, logos

## 10. Backend (Lovable Cloud)
Enable Cloud and add:
- `profiles` (id, display_name, avatar_url, created_at) + trigger on signup
- `watch_progress` (user_id, title_id, position_seconds, duration_seconds, updated_at)
- `my_list` (user_id, title_id, kind, added_at)
- `reminders` (user_id, channel_id, program_time, program_title)
- `community_posts` (user_id, channel_id, body, created_at)
- `enterprise_leads` (name, org, email, plan, message, created_at)
- Email/password + Google auth; RLS on everything

## Technical notes
- New shared components: `hover-preview-card.tsx`, `channel-card.tsx`, `title-card.tsx` (replaces inline `TitleCard`), `pagination.tsx`, `epg-grid.tsx`, `share-menu.tsx`, `remind-button.tsx`
- New routes: `guide.tsx`, `profile.tsx`, `account.tsx`, `community.tsx`, `enterprise.tsx`, `portal.tsx` (+ nested), `collections.$collectionId.tsx`
- Site header gets: Guide, Portal, Profile menu (auth-aware)
- All new tables via a single migration with GRANTs + RLS
- Auth: email/password + Google, `/auth` and `/reset-password` routes

## Scale note
This is ~5-8 hours of buildout and will consume significant credits. Confirm you want the full scope in one go, or I can ship it in phases (suggested: Phase A = research + on-demand upgrades + hover-preview + guide; Phase B = auth + profile + portal + settings; Phase C = community + enterprise).