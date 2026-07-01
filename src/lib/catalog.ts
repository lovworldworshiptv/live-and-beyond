import ch1 from "@/assets/channel-1.jpg";
import ch2 from "@/assets/channel-2.jpg";
import ch3 from "@/assets/channel-3.jpg";
import ch4 from "@/assets/channel-4.jpg";
import ch5 from "@/assets/channel-5.jpg";
import ch6 from "@/assets/channel-6.jpg";
import hero from "@/assets/hero-broadcast.jpg";

export const images = { ch1, ch2, ch3, ch4, ch5, ch6, hero };

export type Channel = {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  category: string;
  language: string;
  country: string;
  region: string;
  viewers: string;
  popularity: number; // 0-100
  trending?: boolean;
  addedAt: string; // ISO date
  streamKind: "video" | "radio";
  isLive: boolean;
  logoImg: string;
  banner: string;
  videoLibrary?: string[]; // title ids
  podcastLibrary?: string[]; // title ids
  featuredContent?: string[]; // title ids
  nowPlaying: { title: string; startsAt: string; endsAt: string; description: string };
  schedule: { time: string; title: string; kind: string; live?: boolean }[];
};

export const channels: Channel[] = [
  {
    id: "loveworld-plus",
    name: "LoveWorld Plus",
    tagline: "Premium faith & lifestyle broadcasting, 24/7.",
    category: "Christian Living",
    language: "English",
    region: "Global",
    viewers: "28.1K",
    isLive: true,
    logoImg: ch5,
    banner: ch5,
    nowPlaying: {
      title: "Healing School Service",
      startsAt: "10:00",
      endsAt: "12:00",
      description:
        "A live global healing service broadcast to 140 nations, featuring worship, teaching and testimonies.",
    },
    schedule: [
      { time: "10:00", title: "Healing School Service", kind: "Live Service", live: true },
      { time: "12:00", title: "Your LoveWorld Specials", kind: "Series" },
      { time: "13:30", title: "Rhapsody Today", kind: "Devotional" },
      { time: "14:00", title: "Global Impact Report", kind: "News" },
      { time: "15:00", title: "Praise Night Encore", kind: "Concert" },
      { time: "17:00", title: "Youth Aglow", kind: "Series" },
      { time: "18:00", title: "Evening Worship Live", kind: "Live Music", live: true },
    ],
  },
  {
    id: "worship-live",
    name: "Worship Live",
    tagline: "Non-stop worship, concerts and live sessions.",
    category: "Music",
    language: "English",
    region: "Global",
    viewers: "12.4K",
    isLive: true,
    logoImg: ch1,
    banner: ch1,
    nowPlaying: {
      title: "Hallelujah Live Concert — Lagos",
      startsAt: "09:30",
      endsAt: "11:45",
      description: "Live from Eko Convention Centre. A night of praise with global worship leaders.",
    },
    schedule: [
      { time: "09:30", title: "Hallelujah Live Concert", kind: "Concert", live: true },
      { time: "12:00", title: "Studio Sessions", kind: "Music" },
      { time: "13:00", title: "Worship Anthems 2026", kind: "Playlist" },
      { time: "14:30", title: "Behind the Song", kind: "Documentary" },
      { time: "16:00", title: "Praise Night Atlanta", kind: "Concert" },
      { time: "19:00", title: "Night of Bliss Encore", kind: "Concert" },
    ],
  },
  {
    id: "stadium-plus",
    name: "Stadium+",
    tagline: "Live football, replays and highlights from every league.",
    category: "Sports",
    language: "English",
    region: "Global",
    viewers: "61.9K",
    isLive: true,
    logoImg: ch4,
    banner: ch4,
    nowPlaying: {
      title: "Premier Cup — Matchday 4",
      startsAt: "15:00",
      endsAt: "17:00",
      description: "Live coverage from the semifinal clash. Studio analysis by our expert panel.",
    },
    schedule: [
      { time: "15:00", title: "Premier Cup Semifinal", kind: "Live Match", live: true },
      { time: "17:15", title: "Post-match Analysis", kind: "Studio" },
      { time: "18:00", title: "Africa Cup Preview", kind: "Show" },
      { time: "19:30", title: "Champions Final Replay", kind: "Replay" },
      { time: "22:00", title: "Top 10 Goals of the Week", kind: "Highlights" },
    ],
  },
  {
    id: "global-news-24",
    name: "Global News 24",
    tagline: "Around-the-clock news from around the world.",
    category: "News",
    language: "English",
    region: "International",
    viewers: "4.7K",
    isLive: true,
    logoImg: ch3,
    banner: ch3,
    nowPlaying: {
      title: "World Briefing",
      startsAt: "11:00",
      endsAt: "12:00",
      description: "Top stories, analysis and market updates from correspondents on six continents.",
    },
    schedule: [
      { time: "11:00", title: "World Briefing", kind: "News", live: true },
      { time: "12:00", title: "Business Now", kind: "Business" },
      { time: "13:00", title: "Inside Africa Today", kind: "Documentary" },
      { time: "14:00", title: "The Interview", kind: "Talk" },
      { time: "15:00", title: "Afternoon Brief", kind: "News" },
      { time: "18:00", title: "State of the World", kind: "News" },
    ],
  },
  {
    id: "studio-late",
    name: "Studio Late",
    tagline: "Long-form podcasts with the world's most interesting minds.",
    category: "Podcasts",
    language: "English",
    region: "Global",
    viewers: "2.3K",
    isLive: false,
    logoImg: ch2,
    banner: ch2,
    nowPlaying: {
      title: "Founders Unfiltered — Ep. 41",
      startsAt: "—",
      endsAt: "—",
      description: "The next generation of African founders on scale, faith and endurance.",
    },
    schedule: [
      { time: "Ep. 41", title: "Founders Unfiltered", kind: "Podcast" },
      { time: "Ep. 40", title: "The Builders Podcast", kind: "Podcast" },
      { time: "Ep. 39", title: "Late Night with Ada", kind: "Podcast" },
      { time: "Ep. 38", title: "Culture Notes", kind: "Podcast" },
    ],
  },
  {
    id: "hot-100-fm",
    name: "Hot 100 FM",
    tagline: "Global hits, live DJs, all day, everywhere.",
    category: "Radio",
    language: "English",
    region: "Global",
    viewers: "1.9K",
    isLive: true,
    logoImg: ch6,
    banner: ch6,
    nowPlaying: {
      title: "On Air with DJ Solo",
      startsAt: "10:00",
      endsAt: "13:00",
      description: "Three hours of new music, exclusives and listener call-ins from around the world.",
    },
    schedule: [
      { time: "10:00", title: "On Air with DJ Solo", kind: "Live Show", live: true },
      { time: "13:00", title: "The Lunch Mix", kind: "Mix" },
      { time: "15:00", title: "Drive Time", kind: "Live Show", live: true },
      { time: "19:00", title: "Sunset Sessions", kind: "Mix" },
      { time: "22:00", title: "Late Night Grooves", kind: "Mix" },
    ],
  },
];

export function getChannel(id: string) {
  return channels.find((c) => c.id === id);
}

export type Title = {
  id: string;
  title: string;
  synopsis: string;
  cover: string;
  hero: string;
  category: string;
  kind: "Series" | "Film" | "Documentary" | "Concert" | "Podcast" | "Event";
  year: number;
  rating: string;
  duration: string;
  seasons?: number;
  episodes?: number;
  featured?: boolean;
  cast?: string[];
};

export const titles: Title[] = [
  {
    id: "night-of-bliss-lagos",
    title: "Night of Bliss — Lagos",
    synopsis:
      "A full-length recording of the historic Night of Bliss concert in Lagos, featuring gospel artists from across Africa in a stadium filled with 60,000 worshippers.",
    cover: ch1,
    hero: ch1,
    category: "Music",
    kind: "Concert",
    year: 2026,
    rating: "PG",
    duration: "2h 14m",
    featured: true,
    cast: ["Sinach", "Frank Edwards", "Ada Ehi"],
  },
  {
    id: "healing-streams",
    title: "The Healing Streams",
    synopsis:
      "An intimate documentary series following the global healing streams movement, its miracles, testimonies and impact across five continents.",
    cover: ch5,
    hero: ch5,
    category: "Christian Living",
    kind: "Series",
    year: 2025,
    rating: "TV-PG",
    duration: "12 x 42m",
    seasons: 2,
    episodes: 12,
    featured: true,
  },
  {
    id: "inside-africa-today",
    title: "Inside Africa Today",
    synopsis:
      "Award-winning long-form journalism from the world's fastest-growing continent. Business, culture, tech and the people rewriting Africa's future.",
    cover: ch3,
    hero: ch3,
    category: "News",
    kind: "Documentary",
    year: 2026,
    rating: "TV-14",
    duration: "48m",
  },
  {
    id: "champions-final-2026",
    title: "Champions Final 2026",
    synopsis:
      "Full-match replay of the 2026 Champions Final with pre-match analysis, tactical breakdowns and dressing-room interviews.",
    cover: ch4,
    hero: ch4,
    category: "Sports",
    kind: "Event",
    year: 2026,
    rating: "TV-PG",
    duration: "3h 20m",
  },
  {
    id: "founders-unfiltered",
    title: "Founders Unfiltered",
    synopsis:
      "The weekly podcast where the world's boldest founders talk openly about failure, faith, funding and the future they're building.",
    cover: ch2,
    hero: ch2,
    category: "Podcasts",
    kind: "Podcast",
    year: 2026,
    rating: "TV-14",
    duration: "41 episodes",
    episodes: 41,
  },
  {
    id: "sunday-drive-sessions",
    title: "Sunday Drive Sessions",
    synopsis: "Curated Sunday afternoon mixes recorded live from studios around the world.",
    cover: ch6,
    hero: ch6,
    category: "Music",
    kind: "Podcast",
    year: 2026,
    rating: "TV-G",
    duration: "1h 30m",
  },
  {
    id: "your-loveworld-specials",
    title: "Your LoveWorld Specials",
    synopsis:
      "The landmark broadcast series that has reached over 3 billion viewers globally. Teaching, prayer and prophetic insight for our time.",
    cover: ch5,
    hero: ch5,
    category: "Christian Living",
    kind: "Series",
    year: 2026,
    rating: "TV-PG",
    duration: "Season 9",
    seasons: 9,
    episodes: 120,
    featured: true,
  },
  {
    id: "world-briefing-weekly",
    title: "World Briefing Weekly",
    synopsis: "A weekly digest of the stories, ideas and market moves that shaped the world.",
    cover: ch3,
    hero: ch3,
    category: "News",
    kind: "Series",
    year: 2026,
    rating: "TV-14",
    duration: "28m",
  },
  {
    id: "praise-night-atlanta",
    title: "Praise Night Atlanta",
    synopsis: "Full concert recording from State Farm Arena. A night of pure worship.",
    cover: ch1,
    hero: ch1,
    category: "Music",
    kind: "Concert",
    year: 2025,
    rating: "PG",
    duration: "1h 48m",
  },
  {
    id: "africa-cup-opening",
    title: "Africa Cup Opening Ceremony",
    synopsis: "The full opening ceremony broadcast with performances from Africa's biggest stars.",
    cover: ch4,
    hero: ch4,
    category: "Sports",
    kind: "Event",
    year: 2026,
    rating: "TV-PG",
    duration: "2h 05m",
  },
  {
    id: "builders-podcast",
    title: "The Builders Podcast",
    synopsis: "Deep conversations with people building the next generation of institutions.",
    cover: ch2,
    hero: ch2,
    category: "Podcasts",
    kind: "Podcast",
    year: 2026,
    rating: "TV-14",
    duration: "18 episodes",
  },
  {
    id: "state-of-the-world",
    title: "State of the World 2026",
    synopsis: "Annual televised address surveying the geopolitical and economic landscape.",
    cover: ch3,
    hero: ch3,
    category: "News",
    kind: "Event",
    year: 2026,
    rating: "TV-14",
    duration: "1h 15m",
  },
];

export function getTitle(id: string) {
  return titles.find((t) => t.id === id);
}

export const genres = [
  "All",
  "Christian Living",
  "Music",
  "Sports",
  "News",
  "Podcasts",
  "Documentary",
];
