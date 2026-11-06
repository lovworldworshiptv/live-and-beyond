import {
  Home,
  Tv,
  Film,
  User,
  Search,
  Radio,
  CalendarDays,
  Mic,
  Sparkles,
  List,
  Gamepad2,
  Joystick,
  Dices,
  Trophy,
  Medal,
  Crown,
  Heart,
  Clock,
  Star,
  Flame,
  Gift,
  Coins,
  Wallet,
  Ticket,
  Headphones,
  Video,
  MessagesSquare,
  Bell,
  LayoutGrid,
  Play,
  Globe,
  Clapperboard,
  Cast,
  Zap,
  Compass,
  History,
  Bookmark,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for the icons an admin can pick for the mobile
 * bottom navigation bar. Keys are persisted in the `bottomNav` CMS setting,
 * so a key must never be removed or renamed — old saved configs would lose
 * their icon and fall back to `home`.
 */
export const bottomNavIconComponents: Record<string, LucideIcon> = {
  home: Home,
  tv: Tv,
  film: Film,
  user: User,
  search: Search,
  radio: Radio,
  calendar: CalendarDays,
  mic: Mic,
  sparkles: Sparkles,
  list: List,
  gamepad: Gamepad2,
  joystick: Joystick,
  dice: Dices,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  heart: Heart,
  clock: Clock,
  star: Star,
  flame: Flame,
  gift: Gift,
  coins: Coins,
  wallet: Wallet,
  ticket: Ticket,
  headphones: Headphones,
  video: Video,
  messages: MessagesSquare,
  bell: Bell,
  grid: LayoutGrid,
  play: Play,
  globe: Globe,
  clapperboard: Clapperboard,
  cast: Cast,
  zap: Zap,
  compass: Compass,
  history: History,
  bookmark: Bookmark,
};

/** Icon keys selectable for bottom nav items in the CMS, in picker order. */
export const bottomNavIcons = Object.keys(bottomNavIconComponents);

/** Resolve a persisted icon key, falling back to `home` for unknown keys. */
export function bottomNavIcon(key: string): LucideIcon {
  return bottomNavIconComponents[key] ?? Home;
}
