// Server-only KingsChat OAuth2 helpers. Never import from client code.
const KC_LOGIN_BASE = "https://accounts.kingschat.online/log-in";
const KC_API_BASE = "https://connect.kingsch.at/developer/api";

export type KingsChatTokens = {
  access_token: string;
  refresh_token: string;
  expires_in_millis: number;
};

export type KingsChatProfile = {
  kingschatUserId: string;
  username: string | null;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export function getClientId(): string {
  const clientId = process.env["KINGSCHAT_CLIENT_ID"];
  if (!clientId) {
    throw new Error(
      "KINGSCHAT_CLIENT_ID is not configured. Add it in project settings before using KingsChat login.",
    );
  }
  return clientId;
}

export function buildLoginUrl(opts: { origin?: string; forceLogin?: boolean }): string {
  const url = new URL(KC_LOGIN_BASE);
  url.searchParams.set("clientId", getClientId());
  if (opts.origin) url.searchParams.set("origin", opts.origin);
  if (opts.forceLogin) url.searchParams.set("forceLogin", "true");
  return url.toString();
}

async function tokenRequest(body: Record<string, string>): Promise<KingsChatTokens> {
  const res = await fetch(`${KC_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[KingsChat] token request failed [${res.status}]: ${text}`);
    throw new Error(`KingsChat token request failed [${res.status}]: ${text}`);
  }
  return JSON.parse(text) as KingsChatTokens;
}

export function exchangeCodeForTokens(code: string): Promise<KingsChatTokens> {
  return tokenRequest({ grant_type: "code", client_id: getClientId(), code });
}

export function refreshAccessToken(refreshToken: string): Promise<KingsChatTokens> {
  return tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
}

export async function fetchProfile(accessToken: string): Promise<KingsChatProfile> {
  const res = await fetch(`${KC_API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[KingsChat] profile request failed [${res.status}]: ${text}`);
    throw new Error(`KingsChat profile request failed [${res.status}]: ${text}`);
  }
  const json = JSON.parse(text) as Record<string, unknown>;
  const container = (json["profile"] ?? json) as Record<string, unknown>;
  const user = ((container["user"] ?? container) ?? {}) as Record<string, unknown>;

  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  return {
    kingschatUserId:
      str(user["user_id"]) ?? str(user["id"]) ?? str(user["username"]) ?? "",
    username: str(user["username"]),
    name: str(user["name"]) ?? str(user["display_name"]),
    email: str(user["email"]),
    avatarUrl: str(user["avatar"]) ?? str(user["avatar_url"]) ?? str(user["profile_picture"]),
  };
}

/** Fallback address for KingsChat accounts that expose no email. */
export function syntheticEmail(profile: KingsChatProfile): string {
  const handle = (profile.username ?? profile.kingschatUserId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${handle || "user"}@kingschat.lettflix.app`;
}

/** `origin` is untrusted input — only allow same-site relative paths. */
export function safeRelativePath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
