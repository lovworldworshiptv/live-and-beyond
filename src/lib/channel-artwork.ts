import worship from "@/assets/channels/worship.jpg";
import news from "@/assets/channels/news.jpg";
import academy from "@/assets/channels/academy.jpg";
import family from "@/assets/channels/family.jpg";
import cinema from "@/assets/channels/cinema.jpg";
import radio from "@/assets/channels/radio.jpg";
import sports from "@/assets/channels/sports.jpg";

/** Editorial artwork is illustrative, not a claim about a currently airing programme. */
export function channelArtwork(category: string, kind?: string, slug?: string) {
  if (slug === "loveworld-animation-academy") return family;
  if (kind === "radio" || category === "Radio") return radio;
  if (category === "News") return news;
  if (category === "Education") return academy;
  if (category === "Kids & Family") return family;
  if (category === "Sports") return sports;
  if (category === "LoveWorld" || category === "Music") return worship;
  return cinema;
}