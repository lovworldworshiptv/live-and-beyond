
-- Allow public read of homepage-facing settings keys
CREATE POLICY "settings public read" ON public.cms_settings
  FOR SELECT
  TO anon, authenticated
  USING (key IN ('nav', 'hero', 'footer'));

GRANT SELECT ON public.cms_settings TO anon, authenticated;

-- Seed default homepage config
INSERT INTO public.cms_settings (key, value) VALUES
  ('nav', '{"items":[{"label":"Home","to":"/"},{"label":"Channels","to":"/channels"},{"label":"Guide","to":"/guide"},{"label":"On Demand","to":"/on-demand"},{"label":"Pricing","to":"/pricing"}]}'::jsonb),
  ('hero', '{"badge":"LIVE NOW","badgeMeta":"184 channels broadcasting","title":"The future of broadcasting,","titleAccent":"streaming together.","description":"Live television, radio, podcasts, events and premium on-demand — discover everything from broadcasters, ministries and creators worldwide. One subscription. One ecosystem.","primaryCta":{"label":"Watch Live","to":"/channels"},"secondaryCta":{"label":"Browse Channels","to":"/channels"},"tertiaryCta":{"label":"Open Live Guide","to":"/guide"},"stats":[{"k":"184","v":"Live channels"},{"k":"12K+","v":"On-demand titles"},{"k":"320","v":"Radio stations"}]}'::jsonb),
  ('footer', '{"tagline":"The future of digital broadcasting. Live channels, radio, podcasts and on-demand entertainment — one subscription, one ecosystem.","copyright":"LoveWorld Entertainment Flix. All rights reserved.","note":"Made for a borderless broadcast future.","columns":[{"title":"Platform","items":[{"label":"Channels","href":"/channels"},{"label":"On Demand","href":"/on-demand"},{"label":"Radio","href":"/channels"},{"label":"Podcasts","href":"/on-demand"},{"label":"Live Guide","href":"/guide"}]},{"title":"Creators","items":[{"label":"Become a Partner","href":"/auth"},{"label":"Creator Portal","href":"/portal"},{"label":"Channel Portal","href":"/portal"},{"label":"Analytics","href":"/portal"}]},{"title":"Company","items":[{"label":"About","href":"#"},{"label":"Careers","href":"#"},{"label":"Press","href":"#"},{"label":"Contact","href":"#"},{"label":"Privacy","href":"#"}]}]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
