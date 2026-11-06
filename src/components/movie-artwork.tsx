import { useState, type ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  src?: string | null;
  fallbackSrc?: string | null;
};

/** Try the title's alternate artwork before a bundled, non-expiring brand image. */
export function MovieArtwork({ src, fallbackSrc, ...props }: Props) {
  const sources = [...new Set([src?.trim(), fallbackSrc?.trim(), "/icon-512.png"].filter((value): value is string => Boolean(value)))];
  return <ArtworkImage key={sources.join("|")} sources={sources} {...props} />;
}

function ArtworkImage({ sources, className, ...props }: Omit<Props, "src" | "fallbackSrc"> & { sources: string[] }) {
  const [index, setIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const branded = sources[index] === "/icon-512.png";
  return (
    <img
      {...props}
      src={exhausted ? undefined : sources[index]}
      className={`${className ?? ""} ${branded ? "!object-contain bg-elevated p-6" : ""} ${exhausted ? "invisible" : ""}`}
      onError={() => {
        if (index < sources.length - 1) setIndex(index + 1);
        else setExhausted(true);
      }}
    />
  );
}