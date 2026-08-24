/**
 * Live media plane abstraction.
 *
 * The control plane (Lettflix) never talks to a specific vendor directly — it
 * talks to a LiveProvider. Cloudflare Stream is the first implementation; a
 * "manual" provider keeps everything working when no credentials are set
 * (creators simply paste an existing RTMP/HLS source).
 */

export type ProviderInput = {
  providerInputId: string | null;
  rtmpsUrl: string | null;
  rtmpsStreamKey: string | null;
  srtUrl: string | null;
  webrtcUrl: string | null;
  playbackHlsUrl: string | null;
  playbackDashUrl: string | null;
  meta?: Record<string, unknown>;
};

export type ProviderStatus = {
  status: "idle" | "connected" | "live" | "errored" | "disabled";
  lastConnectedAt: string | null;
};

export interface LiveProvider {
  readonly name: string;
  readonly configured: boolean;
  createInput(opts: { name: string; recording: boolean }): Promise<ProviderInput>;
  deleteInput(providerInputId: string): Promise<void>;
  getStatus(providerInputId: string): Promise<ProviderStatus>;
}

const CF_API = "https://api.cloudflare.com/client/v4";

type CfResponse<T> = { success: boolean; errors?: { message: string }[]; result: T };

class CloudflareStreamProvider implements LiveProvider {
  readonly name = "cloudflare";
  constructor(
    private accountId: string,
    private token: string,
    private customerSubdomain: string | null,
  ) {}
  get configured() {
    return Boolean(this.accountId && this.token);
  }

  private async call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${CF_API}/accounts/${this.accountId}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const body = (await res.json()) as CfResponse<T>;
    if (!res.ok || !body.success) {
      const msg = body?.errors?.map((e) => e.message).join(", ") || `Cloudflare Stream error (${res.status})`;
      throw new Error(msg);
    }
    return body.result;
  }

  private playback(uid: string) {
    if (!this.customerSubdomain) return { hls: null, dash: null };
    const base = `https://${this.customerSubdomain}/${uid}`;
    return { hls: `${base}/manifest/video.m3u8`, dash: `${base}/manifest/video.mpd` };
  }

  async createInput({ name, recording }: { name: string; recording: boolean }): Promise<ProviderInput> {
    type Result = {
      uid: string;
      rtmps?: { url: string; streamKey: string };
      srt?: { url: string; streamId: string; passphrase: string };
      webRTC?: { url: string };
    };
    const r = await this.call<Result>("/stream/live_inputs", {
      method: "POST",
      body: JSON.stringify({
        meta: { name },
        recording: { mode: recording ? "automatic" : "off" },
      }),
    });
    const pb = this.playback(r.uid);
    return {
      providerInputId: r.uid,
      rtmpsUrl: r.rtmps?.url ?? null,
      rtmpsStreamKey: r.rtmps?.streamKey ?? null,
      srtUrl: r.srt?.url ? `${r.srt.url}?streamid=${r.srt.streamId}` : null,
      webrtcUrl: r.webRTC?.url ?? null,
      playbackHlsUrl: pb.hls,
      playbackDashUrl: pb.dash,
      meta: { srtPassphrase: r.srt?.passphrase ?? null },
    };
  }

  async deleteInput(providerInputId: string) {
    await this.call(`/stream/live_inputs/${providerInputId}`, { method: "DELETE" });
  }

  async getStatus(providerInputId: string): Promise<ProviderStatus> {
    type Result = { status?: { current?: { state?: string; statusEnteredAt?: string } } };
    const r = await this.call<Result>(`/stream/live_inputs/${providerInputId}`);
    const state = r.status?.current?.state ?? "";
    const status: ProviderStatus["status"] =
      state === "connected" || state === "live_input_connected"
        ? "live"
        : state.includes("error")
          ? "errored"
          : "idle";
    return { status, lastConnectedAt: r.status?.current?.statusEnteredAt ?? null };
  }
}

class ManualProvider implements LiveProvider {
  readonly name = "manual";
  readonly configured = true;
  async createInput(): Promise<ProviderInput> {
    return {
      providerInputId: null,
      rtmpsUrl: null,
      rtmpsStreamKey: null,
      srtUrl: null,
      webrtcUrl: null,
      playbackHlsUrl: null,
      playbackDashUrl: null,
    };
  }
  async deleteInput() {}
  async getStatus(): Promise<ProviderStatus> {
    return { status: "idle", lastConnectedAt: null };
  }
}

/** Resolve the active provider. Call this inside a server handler only. */
export function getLiveProvider(): LiveProvider {
  const accountId = process.env["CLOUDFLARE_ACCOUNT_ID"];
  const token = process.env["CLOUDFLARE_STREAM_API_TOKEN"];
  const subdomain = process.env["CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN"] ?? null;
  if (accountId && token) {
    return new CloudflareStreamProvider(accountId, token, subdomain);
  }
  return new ManualProvider();
}
