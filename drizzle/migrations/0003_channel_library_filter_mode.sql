ALTER TABLE public.cms_channels ADD COLUMN library_filter_mode text NOT NULL DEFAULT 'categories';
ALTER TABLE public.cms_channels ADD CONSTRAINT cms_channels_library_filter_mode_check CHECK (library_filter_mode IN ('categories', 'genres'));
COMMENT ON COLUMN public.cms_channels.library_filter_mode IS 'Creator-selected channel library browsing mode: content categories or music genres.';