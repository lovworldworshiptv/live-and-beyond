
-- 1. Schema additions
ALTER TABLE public.cms_channels
  ADD COLUMN IF NOT EXISTS stream_url text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS viewers text,
  ADD COLUMN IF NOT EXISTS popularity int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_trending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS now_playing jsonb,
  ADD COLUMN IF NOT EXISTS video_library text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS podcast_library text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured_content text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.cms_titles
  ADD COLUMN IF NOT EXISTS rating text,
  ADD COLUMN IF NOT EXISTS cast_list text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS duration_label text,
  ADD COLUMN IF NOT EXISTS episodes int,
  ADD COLUMN IF NOT EXISTS seasons int,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stream_url text,
  ADD COLUMN IF NOT EXISTS trailer_url text;

-- 2. Seed channels (banner/logo left null — frontend maps by slug to bundled art)
INSERT INTO public.cms_channels (slug, name, kind, category, language, country, region, viewers, popularity, is_trending, tagline, description, now_playing, video_library, podcast_library, featured_content, is_live, is_published)
VALUES
 ('loveworld-plus','LoveWorld Plus','tv','LoveWorld','English','Nigeria','Global','28.1K',98,true,'Premium faith & lifestyle broadcasting, 24/7.','The flagship LoveWorld network channel, streaming live services, teachings, worship and lifestyle programming to a global audience of over 140 nations.','{"title":"Healing School Service","startsAt":"10:00","endsAt":"12:00","description":"A live global healing service broadcast to 140 nations, featuring worship, teaching and testimonies."}',ARRAY['healing-streams','your-loveworld-specials'],ARRAY['founders-unfiltered'],ARRAY['your-loveworld-specials','healing-streams'],true,true),
 ('worship-live','Worship Live','tv','Music','English','Nigeria','Global','12.4K',82,true,'Non-stop worship, concerts and live sessions.','24-hour worship channel featuring live concerts, studio sessions and premieres from the world''s top gospel artists.','{"title":"Hallelujah Live Concert — Lagos","startsAt":"09:30","endsAt":"11:45","description":"Live from Eko Convention Centre."}',ARRAY['night-of-bliss-lagos','praise-night-atlanta'],ARRAY[]::text[],ARRAY['night-of-bliss-lagos'],true,true),
 ('stadium-plus','Stadium+','tv','Sports','English','United Kingdom','Global','61.9K',95,true,'Live football, replays and highlights from every league.','The home of live sport on Lettflix — football, athletics, boxing, motorsport and studio analysis around the clock.','{"title":"Premier Cup — Matchday 4","startsAt":"15:00","endsAt":"17:00","description":"Live coverage from the semifinal clash."}',ARRAY['champions-final-2026','africa-cup-opening'],ARRAY[]::text[],ARRAY['champions-final-2026'],true,true),
 ('global-news-24','Global News 24','tv','News','English','United States','International','4.7K',74,false,'Around-the-clock news from around the world.','Breaking news, business coverage and long-form journalism from a global newsroom.','{"title":"World Briefing","startsAt":"11:00","endsAt":"12:00","description":"Top stories, analysis and market updates."}',ARRAY['inside-africa-today','world-briefing-weekly','state-of-the-world'],ARRAY[]::text[],ARRAY['state-of-the-world'],true,true),
 ('studio-late','Studio Late','tv','Entertainment','English','Nigeria','Global','2.3K',61,false,'Long-form podcasts with the world''s most interesting minds.','Nightly conversations, culture and commentary from the Studio Late team.','{"title":"Founders Unfiltered — Ep. 41","startsAt":"—","endsAt":"—","description":"The next generation of African founders."}',ARRAY[]::text[],ARRAY['founders-unfiltered','builders-podcast'],ARRAY['founders-unfiltered'],false,true),
 ('hot-100-fm','Hot 100 FM','radio','Radio','English','United States','Global','1.9K',68,false,'Global hits, live DJs, all day, everywhere.','The Lettflix flagship radio station — live DJs, exclusive premieres and listener call-ins around the clock.','{"title":"On Air with DJ Solo","startsAt":"10:00","endsAt":"13:00","description":"Three hours of new music and listener call-ins."}',ARRAY[]::text[],ARRAY['sunday-drive-sessions'],ARRAY['sunday-drive-sessions'],true,true),
 ('rhapsody-radio','Rhapsody Radio','radio','LoveWorld','English','Nigeria','Global','5.2K',79,false,'The devotional soundtrack for your day.','24-hour devotional radio featuring Rhapsody of Realities readings and prayer sessions.','{"title":"Rhapsody Today","startsAt":"13:30","endsAt":"14:00","description":"Today''s Rhapsody devotional read live."}',ARRAY[]::text[],ARRAY[]::text[],ARRAY[]::text[],true,true),
 ('scholar-tv','Scholar TV','tv','Education','English','United Kingdom','Global','3.4K',58,false,'Learn something new every hour.','Documentaries, masterclasses and lectures from leading universities.','{"title":"The Science of Sleep","startsAt":"11:00","endsAt":"12:00","description":"A one-hour masterclass on sleep neuroscience."}',ARRAY[]::text[],ARRAY[]::text[],ARRAY[]::text[],true,true),
 ('vitality-network','Vitality Network','tv','Lifestyle','English','United States','Global','6.1K',71,true,'Wellness, food and design for modern living.','A premium lifestyle channel with cooking, wellness, travel and design programming.','{"title":"Weekend Kitchen","startsAt":"10:30","endsAt":"11:30","description":"Signature brunch recipes from three continents."}',ARRAY[]::text[],ARRAY[]::text[],ARRAY[]::text[],true,true),
 ('little-lights','Little Lights','tv','Kids & Family','English','Canada','Global','7.8K',66,false,'Safe, joyful stories for every child.','Kids programming for ages 3-11 with parental controls built in.','{"title":"Adventures of Little Zoe","startsAt":"10:00","endsAt":"10:30","description":"Little Zoe explores the seven wonders."}',ARRAY[]::text[],ARRAY[]::text[],ARRAY[]::text[],true,true),
 ('prime-cinema','Prime Cinema','tv','Entertainment','English','United States','Global','18.9K',88,true,'Blockbusters, indie gems and premieres.','A round-the-clock entertainment channel featuring blockbuster films and premieres.','{"title":"Kings of the Coast","startsAt":"14:00","endsAt":"16:30","description":"Season finale of the acclaimed epic drama."}',ARRAY[]::text[],ARRAY[]::text[],ARRAY[]::text[],true,true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Seed titles
INSERT INTO public.cms_titles (slug, title, kind, genre, year, rating, duration_label, seasons, episodes, is_featured, cast_list, synopsis, is_published)
VALUES
 ('night-of-bliss-lagos','Night of Bliss — Lagos','concert','Music',2026,'PG','2h 14m',NULL,NULL,true,ARRAY['Sinach','Frank Edwards','Ada Ehi'],'A full-length recording of the historic Night of Bliss concert in Lagos, featuring gospel artists from across Africa in a stadium filled with 60,000 worshippers.',true),
 ('healing-streams','The Healing Streams','series','Christian Living',2025,'TV-PG','12 x 42m',2,12,true,ARRAY[]::text[],'An intimate documentary series following the global healing streams movement, its miracles, testimonies and impact across five continents.',true),
 ('inside-africa-today','Inside Africa Today','documentary','News',2026,'TV-14','48m',NULL,NULL,false,ARRAY[]::text[],'Award-winning long-form journalism from the world''s fastest-growing continent.',true),
 ('champions-final-2026','Champions Final 2026','event','Sports',2026,'TV-PG','3h 20m',NULL,NULL,false,ARRAY[]::text[],'Full-match replay of the 2026 Champions Final with pre-match analysis and tactical breakdowns.',true),
 ('founders-unfiltered','Founders Unfiltered','podcast','Podcasts',2026,'TV-14','41 episodes',NULL,41,false,ARRAY[]::text[],'The weekly podcast where the world''s boldest founders talk openly about failure, faith, funding and the future they''re building.',true),
 ('sunday-drive-sessions','Sunday Drive Sessions','podcast','Music',2026,'TV-G','1h 30m',NULL,NULL,false,ARRAY[]::text[],'Curated Sunday afternoon mixes recorded live from studios around the world.',true),
 ('your-loveworld-specials','Your LoveWorld Specials','series','Christian Living',2026,'TV-PG','Season 9',9,120,true,ARRAY[]::text[],'The landmark broadcast series that has reached over 3 billion viewers globally.',true),
 ('world-briefing-weekly','World Briefing Weekly','series','News',2026,'TV-14','28m',NULL,NULL,false,ARRAY[]::text[],'A weekly digest of the stories, ideas and market moves that shaped the world.',true),
 ('praise-night-atlanta','Praise Night Atlanta','concert','Music',2025,'PG','1h 48m',NULL,NULL,false,ARRAY[]::text[],'Full concert recording from State Farm Arena. A night of pure worship.',true),
 ('africa-cup-opening','Africa Cup Opening Ceremony','event','Sports',2026,'TV-PG','2h 05m',NULL,NULL,false,ARRAY[]::text[],'The full opening ceremony broadcast with performances from Africa''s biggest stars.',true),
 ('builders-podcast','The Builders Podcast','podcast','Podcasts',2026,'TV-14','18 episodes',NULL,18,false,ARRAY[]::text[],'Deep conversations with people building the next generation of institutions.',true),
 ('state-of-the-world','State of the World 2026','event','News',2026,'TV-14','1h 15m',NULL,NULL,false,ARRAY[]::text[],'Annual televised address surveying the geopolitical and economic landscape.',true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Seed curated collections
INSERT INTO public.cms_collections (slug, name, description, is_featured, is_published)
VALUES
 ('faith-and-family','Faith & Family','The programming that brings the whole household together.',true,true),
 ('live-concerts-2026','Live Concerts 2026','Front-row seats to the biggest worship and music nights of the year.',true,true),
 ('africa-rising','Africa Rising','Documentaries, journalism and events shaping the continent''s story.',true,true),
 ('founders-and-builders','Founders & Builders','Deep conversations with the people building what''s next.',false,true),
 ('matchday-central','Matchday Central','Every kick-off, every replay, every highlight — all in one place.',true,true),
 ('the-nightly-encore','The Nightly Encore','Wind-down watching — concerts, sessions and long-form after dark.',false,true)
ON CONFLICT (slug) DO NOTHING;
