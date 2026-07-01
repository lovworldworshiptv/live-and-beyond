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
    description:
      "The flagship LoveWorld network channel, streaming live services, teachings, worship and lifestyle programming to a global audience of over 140 nations.",
    category: "LoveWorld",
    language: "English",
    country: "Nigeria",
    region: "Global",
    viewers: "28.1K",
    popularity: 98,
    trending: true,
    addedAt: "2024-11-01",
    streamKind: "video",
    isLive: true,
    logoImg: ch5,
    banner: ch5,
    videoLibrary: ["healing-streams", "your-loveworld-specials"],
    podcastLibrary: ["founders-unfiltered"],
    featuredContent: ["your-loveworld-specials", "healing-streams"],
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
    description: "24-hour worship channel featuring live concerts, studio sessions and premieres from the world's top gospel artists.",
    category: "Music",
    language: "English",
    country: "Nigeria",
    region: "Global",
    viewers: "12.4K",
    popularity: 82,
    trending: true,
    addedAt: "2025-01-14",
    streamKind: "video",
    isLive: true,
    logoImg: ch1,
    banner: ch1,
    videoLibrary: ["night-of-bliss-lagos", "praise-night-atlanta"],
    featuredContent: ["night-of-bliss-lagos"],
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
    description: "The home of live sport on Lettflix — football, athletics, boxing, motorsport and studio analysis around the clock.",
    category: "Sports",
    language: "English",
    country: "United Kingdom",
    region: "Global",
    viewers: "61.9K",
    popularity: 95,
    trending: true,
    addedAt: "2024-08-20",
    streamKind: "video",
    isLive: true,
    logoImg: ch4,
    banner: ch4,
    videoLibrary: ["champions-final-2026", "africa-cup-opening"],
    featuredContent: ["champions-final-2026"],
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
    description: "Breaking news, business coverage and long-form journalism from a global newsroom broadcasting on six continents.",
    category: "News",
    language: "English",
    country: "United States",
    region: "International",
    viewers: "4.7K",
    popularity: 74,
    addedAt: "2024-05-10",
    streamKind: "video",
    isLive: true,
    logoImg: ch3,
    banner: ch3,
    videoLibrary: ["inside-africa-today", "world-briefing-weekly", "state-of-the-world"],
    featuredContent: ["state-of-the-world"],
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
    description: "Nightly conversations, culture and commentary from the Studio Late team and a rotating cast of guest hosts.",
    category: "Entertainment",
    language: "English",
    country: "Nigeria",
    region: "Global",
    viewers: "2.3K",
    popularity: 61,
    addedAt: "2025-06-04",
    streamKind: "video",
    isLive: false,
    logoImg: ch2,
    banner: ch2,
    podcastLibrary: ["founders-unfiltered", "builders-podcast"],
    featuredContent: ["founders-unfiltered"],
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
    description: "The Lettflix flagship radio station — live DJs, exclusive premieres and listener call-ins around the clock.",
    category: "Radio",
    language: "English",
    country: "United States",
    region: "Global",
    viewers: "1.9K",
    popularity: 68,
    addedAt: "2024-09-30",
    streamKind: "radio",
    isLive: true,
    logoImg: ch6,
    banner: ch6,
    podcastLibrary: ["sunday-drive-sessions"],
    featuredContent: ["sunday-drive-sessions"],
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
  {
    id: "rhapsody-radio",
    name: "Rhapsody Radio",
    tagline: "The devotional soundtrack for your day.",
    description: "24-hour devotional radio featuring Rhapsody of Realities readings, prayer sessions and inspirational music.",
    category: "LoveWorld",
    language: "English",
    country: "Nigeria",
    region: "Global",
    viewers: "5.2K",
    popularity: 79,
    addedAt: "2025-03-18",
    streamKind: "radio",
    isLive: true,
    logoImg: ch5,
    banner: ch5,
    nowPlaying: {
      title: "Rhapsody Today",
      startsAt: "13:30",
      endsAt: "14:00",
      description: "Today's Rhapsody devotional read live with prayer and reflection.",
    },
    schedule: [
      { time: "12:00", title: "Morning Prayer", kind: "Prayer" },
      { time: "13:30", title: "Rhapsody Today", kind: "Devotional", live: true },
      { time: "15:00", title: "Testimonies Live", kind: "Talk" },
      { time: "18:00", title: "Word Bank", kind: "Teaching" },
    ],
  },
  {
    id: "scholar-tv",
    name: "Scholar TV",
    tagline: "Learn something new every hour.",
    description: "Documentaries, masterclasses and lectures from leading universities and independent educators worldwide.",
    category: "Education",
    language: "English",
    country: "United Kingdom",
    region: "Global",
    viewers: "3.4K",
    popularity: 58,
    addedAt: "2025-04-22",
    streamKind: "video",
    isLive: true,
    logoImg: ch3,
    banner: ch3,
    nowPlaying: {
      title: "The Science of Sleep",
      startsAt: "11:00",
      endsAt: "12:00",
      description: "A one-hour masterclass on the neuroscience behind restful sleep.",
    },
    schedule: [
      { time: "11:00", title: "The Science of Sleep", kind: "Masterclass", live: true },
      { time: "12:30", title: "Origins of the Universe", kind: "Documentary" },
      { time: "14:00", title: "Coding for Everyone", kind: "Series" },
      { time: "16:00", title: "The Business of Africa", kind: "Lecture" },
    ],
  },
  {
    id: "vitality-network",
    name: "Vitality Network",
    tagline: "Wellness, food and design for modern living.",
    description: "A premium lifestyle channel with cooking, wellness, travel and design programming curated for a global audience.",
    category: "Lifestyle",
    language: "English",
    country: "United States",
    region: "Global",
    viewers: "6.1K",
    popularity: 71,
    trending: true,
    addedAt: "2025-05-08",
    streamKind: "video",
    isLive: true,
    logoImg: ch2,
    banner: ch2,
    nowPlaying: {
      title: "Weekend Kitchen",
      startsAt: "10:30",
      endsAt: "11:30",
      description: "Signature brunch recipes from three continents.",
    },
    schedule: [
      { time: "10:30", title: "Weekend Kitchen", kind: "Cooking", live: true },
      { time: "12:00", title: "Home Made", kind: "Design" },
      { time: "14:00", title: "Wanderers", kind: "Travel" },
      { time: "16:00", title: "The Mindful Hour", kind: "Wellness" },
    ],
  },
  {
    id: "little-lights",
    name: "Little Lights",
    tagline: "Safe, joyful stories for every child.",
    description: "Kids programming for ages 3-11 — animated adventures, learning shows and family movies with parental controls built in.",
    category: "Kids & Family",
    language: "English",
    country: "Canada",
    region: "Global",
    viewers: "7.8K",
    popularity: 66,
    addedAt: "2025-02-11",
    streamKind: "video",
    isLive: true,
    logoImg: ch6,
    banner: ch6,
    nowPlaying: {
      title: "Adventures of Little Zoe",
      startsAt: "10:00",
      endsAt: "10:30",
      description: "Little Zoe explores the seven wonders of the world.",
    },
    schedule: [
      { time: "10:00", title: "Adventures of Little Zoe", kind: "Animation", live: true },
      { time: "10:30", title: "Storytime with Miss B", kind: "Kids" },
      { time: "11:00", title: "Learn & Sing", kind: "Educational" },
      { time: "12:00", title: "Family Movie Hour", kind: "Movie" },
    ],
  },
  {
    id: "prime-cinema",
    name: "Prime Cinema",
    tagline: "Blockbusters, indie gems and premieres.",
    description: "A round-the-clock entertainment channel featuring blockbuster films, indie premieres and behind-the-scenes specials.",
    category: "Entertainment",
    language: "English",
    country: "United States",
    region: "Global",
    viewers: "18.9K",
    popularity: 88,
    trending: true,
    addedAt: "2025-07-01",
    streamKind: "video",
    isLive: true,
    logoImg: ch4,
    banner: ch4,
    nowPlaying: {
      title: "Kings of the Coast",
      startsAt: "14:00",
      endsAt: "16:30",
      description: "Season finale of the acclaimed epic drama.",
    },
    schedule: [
      { time: "14:00", title: "Kings of the Coast", kind: "Series", live: true },
      { time: "16:30", title: "Making the Kings", kind: "Behind the Scenes" },
      { time: "18:00", title: "Saturday Night Movie", kind: "Movie" },
      { time: "21:00", title: "Late Show Premiere", kind: "Premiere" },
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
  "Sports",
  "News",
  "Entertainment",
  "Christian Living",
  "Music",
  "LoveWorld",
  "Radio",
  "Education",
  "Lifestyle",
  "Kids & Family",
];

export const channelLanguages = ["All", "English", "French", "Spanish", "Portuguese"];
export const channelCountries = [
  "All",
  "Nigeria",
  "United States",
  "United Kingdom",
  "Canada",
  "South Africa",
];
export const channelSorts = [
  { id: "popularity", label: "Popularity" },
  { id: "trending", label: "Trending" },
  { id: "recent", label: "Recently Added" },
] as const;
export type ChannelSortId = (typeof channelSorts)[number]["id"];
