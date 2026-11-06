import type { ImgHTMLAttributes } from "react";
import { MovieArtwork } from "@/components/movie-artwork";
import { channelArtwork } from "@/lib/channel-artwork";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  channel: { banner?: string; category: string; streamKind?: string };
};

/** Keep uploaded channel artwork, recover missing/failed URLs with fitting editorial art. */
export function ChannelArtwork({ channel, ...props }: Props) {
  return <MovieArtwork width={1600} height={900} loading="lazy" {...props} src={channel.banner} fallbackSrc={channelArtwork(channel.category, channel.streamKind)} />;
}