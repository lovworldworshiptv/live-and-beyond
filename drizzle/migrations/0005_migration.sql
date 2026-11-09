CREATE OR REPLACE FUNCTION public.trg_notify_new_upload()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ch record;
BEGIN
  IF NEW.channel_id IS NULL OR NOT NEW.is_published OR NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_published AND OLD.channel_id IS NOT DISTINCT FROM NEW.channel_id THEN RETURN NEW; END IF;
  SELECT name, slug, logo_url INTO ch FROM public.cms_channels WHERE id = NEW.channel_id AND is_published AND deleted_at IS NULL;
  IF NOT FOUND THEN RETURN NEW; END IF;
  PERFORM public.notify_channel_followers(NEW.channel_id, 'upload', 'New on ' || ch.name,
    NEW.title || ' is now available to watch.', '/movies/' || NEW.slug, COALESCE(NEW.backdrop_url, NEW.poster_url, ch.logo_url));
  RETURN NEW;
END $$;