export const PPV_CATEGORY = "Pay-Per-View";

export function ppvCountdownParts(startsAt: string, now: number) {
  const remaining = Math.max(0, Math.ceil((Date.parse(startsAt) - now) / 1000));
  return { days: Math.floor(remaining / 86400), hours: Math.floor(remaining / 3600) % 24, minutes: Math.floor(remaining / 60) % 60, seconds: remaining % 60 };
}

export function matchesPpvSearch(event: { title: string; channel_slug: string; channel_name: string }, query: string, channelSlug?: string) {
  return (!channelSlug || event.channel_slug === channelSlug) && `${event.title} ${event.channel_name} ${PPV_CATEGORY}`.toLowerCase().includes(query.trim().toLowerCase());
}

export function ppvAccountReturn(eventId: string) {
  return `/ppv/${eventId}`;
}