import { useState, type ImgHTMLAttributes } from "react";
import { channelArtwork } from "@/lib/channel-artwork";
import { channelCutout } from "@/lib/channel-cutouts";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError" | "onLoad"> & {
  channel: { banner?: string; category: string; streamKind?: string };
};

/**
 * Keep uploaded channel artwork, recover missing/failed URLs with fitting editorial art.
 * Every logo and banner fits fully inside its frame, regardless of its proportions.
 */
export function ChannelArtwork({ channel, className, ...props }: Props) {
  const cutout = channelCutout(channel.banner);
  if (cutout) {
    return (
      <span className={`channel-cutout relative isolate block overflow-hidden ${className ?? ""}`} data-artwork-theme={cutout.theme}>
        <img {...props} src={cutout.src} className="absolute inset-0 size-full object-contain p-2" />
      </span>
    );
  }
  const sources = [
    ...new Set(
      [channel.banner?.trim(), channelArtwork(channel.category, channel.streamKind), "/icon-512.png"].filter(
        (value): value is string => Boolean(value)
      )
    ),
  ];
  return <FitImage key={sources.join("|")} sources={sources} className={className} {...props} />;
}

function FitImage({
  sources,
  className,
  ...props
}: Omit<Props, "channel"> & { sources: string[] }) {
  const [index, setIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const src = sources[index];
  const branded = src === "/icon-512.png";

  const img = (
    <img
      {...props}
      src={exhausted ? undefined : src}
      className={`absolute inset-0 size-full object-contain mix-blend-lighten ${branded ? "p-6" : ""} ${exhausted ? "invisible" : ""}`}
      onError={() => {
        if (index < sources.length - 1) {
          setIndex(index + 1);
        } else {
          setExhausted(true);
        }
      }}
    />
  );

  return (
    <span className={`relative isolate block overflow-hidden bg-elevated ${className ?? ""}`}>
      {!exhausted && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          loading={props.loading}
          decoding="async"
          className="pointer-events-none absolute inset-0 size-full object-cover blur-xl scale-125 brightness-75"
        />
      )}
      {img}
    </span>
  );
}
