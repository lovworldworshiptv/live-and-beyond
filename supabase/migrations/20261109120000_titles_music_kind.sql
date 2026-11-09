ALTER TABLE public.cms_titles DROP CONSTRAINT IF EXISTS cms_titles_kind_check;
ALTER TABLE public.cms_titles ADD CONSTRAINT cms_titles_kind_check CHECK (kind IN ('movie','series','podcast','documentary','music'));
