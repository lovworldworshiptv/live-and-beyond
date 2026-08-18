UPDATE public.cms_titles SET kind = 'movie' WHERE kind IN ('concert','event','film');
UPDATE public.cms_titles SET kind = 'movie' WHERE kind NOT IN ('movie','series','podcast','documentary');
ALTER TABLE public.cms_titles ADD CONSTRAINT cms_titles_kind_check CHECK (kind IN ('movie','series','podcast','documentary'));