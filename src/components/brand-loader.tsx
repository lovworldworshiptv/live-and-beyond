import mark from "@/assets/lettflix-mark.png";
import wordmark from "@/assets/lettflix-wordmark.png";

type BrandLoaderProps = {
  /** `full` covers the screen, `section` fills a content block, `inline` sits in a row. */
  variant?: "full" | "section" | "inline";
  /** Short status line shown under the logo. Pass `null` to hide it. */
  label?: string | null;
  className?: string;
};

/**
 * The Lettflix emblem under a slow halo, an orbiting brand ring and a light
 * sweep, with the wordmark and a quiet progress pass underneath.
 */
export function BrandLoader({ variant = "full", label = "Tuning in", className }: BrandLoaderProps) {
  const showWordmark = variant === "full";
  const showProgress = variant !== "inline";

  return (
    <div
      className={className}
      data-brand-loader
      data-variant={variant}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <div className="brand-stage">
        <span className="brand-halo" aria-hidden="true" />
        <span className="brand-ring" aria-hidden="true" />
        <img className="brand-mark" src={mark} alt="" draggable={false} />
        <span
          className="brand-sheen"
          aria-hidden="true"
          style={{
            WebkitMaskImage: `url(${mark})`,
            maskImage: `url(${mark})`,
          }}
        />
      </div>

      {showWordmark && <img className="brand-wordmark" src={wordmark} alt="Lettflix" draggable={false} />}

      {showProgress && (
        <span className="brand-progress" aria-hidden="true">
          <span className="brand-progress-bar" />
        </span>
      )}

      {label && (
        <span className="brand-label">
          {label}
          <span className="brand-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </span>
      )}
    </div>
  );
}

/** Thin brand progress pass shown while the app is between pages. */
export function RouteProgress({ active }: { active: boolean }) {
  return (
    <span
      className="brand-route-progress"
      data-active={active ? "true" : "false"}
      aria-hidden="true"
    >
      <span className="brand-route-progress-bar" />
    </span>
  );
}
