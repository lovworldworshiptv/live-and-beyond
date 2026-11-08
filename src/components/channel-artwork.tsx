import { useState, type ImgHTMLAttributes } from "react";
import { channelArtwork } from "@/lib/channel-artwork";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError" | "onLoad"> & {
  channel: { banner?: string; category: string; streamKind?: string };
};

/**
 * Keep uploaded channel artwork, recover missing/failed URLs with fitting editorial art.
 * Logo-shaped images (taller than ~16:10) fit fully inside the frame over a soft
 * blurred fill of the same image, so channel logos are never cropped.
 */
export function ChannelArtwork({ channel, className, ...props }: Props) {
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
  const [contain, setContain] = useState(false);
  const src = sources[index];
  const branded = src === "/icon-512.png";
  const fitted = contain || branded;

  const img = (
    <img
      {...props}
      src={exhausted ? undefined : src}
      className={
        fitted
          ? `absolute inset-0 size-full object-contain ${branded ? "bg-elevated p-6" : "p-2"} ${exhausted ? "invisible" : ""}`
          : `${className ?? ""} ${exhausted ? "invisible" : ""}`
      }
      onLoad={(e) => {
        const el = e.currentTarget;
        if (el.naturalWidth && el.naturalHeight && el.naturalWidth / el.naturalHeight < 1.6) {
          setContain(true);
        }
      }}
      onError={() => {
        if (index < sources.length - 1) {
          setIndex(index + 1);
          setContain(false);
        } else {
          setExhausted(true);
        }
      }}
    />
  );

  if (!fitted) return img;

  return (
    <span className={`relative block overflow-hidden ${className ?? ""}`}>
      {!exhausted && (
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover scale-125 blur-2xl opacity-60"
        />
      )}
      {img}
    </span>
  );
}
