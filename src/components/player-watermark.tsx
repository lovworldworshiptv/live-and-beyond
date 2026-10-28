import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const SPOTS = [
  "top-[14%] left-[8%]",
  "top-[22%] right-[10%]",
  "top-[48%] left-[30%]",
  "bottom-[26%] right-[18%]",
  "bottom-[20%] left-[12%]",
  "top-[36%] right-[34%]",
];

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}•••@${domain}`;
}

/** Faint, drifting account mark over playing video so leaked captures can be traced. */
export function PlayerWatermark() {
  const { user } = useAuth();
  const [spot, setSpot] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSpot((s) => (s + 1) % SPOTS.length), 12000);
    return () => window.clearInterval(id);
  }, []);

  const label = user
    ? `${user.email ? maskEmail(user.email) : "Lettflix viewer"} · ${user.id.slice(0, 8)}`
    : "Lettflix";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none">
      <span
        className={`player-watermark absolute ${SPOTS[spot]} font-mono text-[10px] sm:text-xs tracking-wider text-foreground/20 transition-all duration-[2000ms]`}
      >
        {label}
      </span>
    </div>
  );
}
