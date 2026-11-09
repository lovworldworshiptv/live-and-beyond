import type { ServiceKey } from "./channel-services";

/** Complete every write before the editor reports success or closes. */
export async function saveChannelConfiguration(
  services: ServiceKey[],
  radioUrl: string,
  actions: {
    saveChannel: () => Promise<string>;
    saveServices: (id: string, services: ServiceKey[]) => Promise<void>;
    saveRadio: (id: string, patch: { stream_url: string | null; is_enabled: boolean; artwork_url?: string | null }) => Promise<void>;
  },
  radioArtwork?: string | null,
) {
  const id = await actions.saveChannel();
  if (!id) throw new Error("Could not identify the saved channel");
  await actions.saveServices(id, services);
  await actions.saveRadio(id, { stream_url: radioUrl.trim() || null, is_enabled: services.includes("radio"), ...(radioArtwork !== undefined ? { artwork_url: radioArtwork || null } : {}) });
  return id;
}