ALTER TABLE public.channel_follows ADD COLUMN IF NOT EXISTS notify boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Users update own follows" ON public.channel_follows;
CREATE POLICY "Users update own follows" ON public.channel_follows FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT UPDATE ON public.channel_follows TO authenticated;

CREATE OR REPLACE FUNCTION public.channel_follower_count(_channel_id uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*) FROM public.channel_follows WHERE channel_id = _channel_id;
$$;
GRANT EXECUTE ON FUNCTION public.channel_follower_count(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_channel_followers(_channel_id uuid, _kind text, _title text, _body text, _link text, _image text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, kind, title, body, link, image_url)
  SELECT f.user_id, _kind, _title, _body, _link, _image
  FROM public.channel_follows f WHERE f.channel_id = _channel_id AND f.notify;
$$;
REVOKE ALL ON FUNCTION public.notify_channel_followers(uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_notify_new_upload()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ch record;
BEGIN
  IF NEW.channel_id IS NULL OR NOT NEW.is_published OR NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_published AND OLD.channel_id IS NOT DISTINCT FROM NEW.channel_id THEN RETURN NEW; END IF;
  SELECT name, slug, logo_url INTO ch FROM public.cms_channels WHERE id = NEW.channel_id AND is_published AND deleted_at IS NULL;
  IF NOT FOUND THEN RETURN NEW; END IF;
  PERFORM public.notify_channel_followers(NEW.channel_id, 'upload', 'New on ' || ch.name,
    NEW.title || ' is now available to watch.', '/title/' || NEW.slug, COALESCE(NEW.backdrop_url, NEW.poster_url, ch.logo_url));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notify_new_upload ON public.cms_titles;
CREATE TRIGGER notify_new_upload AFTER INSERT OR UPDATE OF is_published, channel_id ON public.cms_titles
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_new_upload();

CREATE OR REPLACE FUNCTION public.trg_notify_new_programme()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  t := NULLIF(trim(NEW.now_playing->>'title'), '');
  IF t IS NULL OR NOT NEW.is_published OR NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
  IF t IS NOT DISTINCT FROM NULLIF(trim(OLD.now_playing->>'title'), '') THEN RETURN NEW; END IF;
  PERFORM public.notify_channel_followers(NEW.id, 'programme', NEW.name || ': new programme',
    t || ' has just started.', '/channels/' || NEW.slug, NEW.logo_url);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notify_new_programme ON public.cms_channels;
CREATE TRIGGER notify_new_programme AFTER UPDATE OF now_playing ON public.cms_channels
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_new_programme();