import joycall from "@/assets/channel-cutouts/joycall-tv.png";
import lxp from "@/assets/channels/lxp-wide.jpg";
import healing from "@/assets/channel-cutouts/healing-streams-tv.png";
import rhapsody from "@/assets/channel-cutouts/rhapsodytv.png";

const cutouts = [
  { original: "b44b17a1-80cb-4ba4-b6fa-d3b77dd42467", src: joycall, theme: "joycall" },
  { original: "e37fa535-a86f-41c7-9f2a-ea7f31124a40", src: lxp, theme: "lxp" },
  { original: "7987409c-f107-4d66-8728-f9d68d1139e6", src: healing, theme: "healing" },
  { original: "ANd9GcRIsdi08fsNCCXUi9-fssXu6MlqtdHwvtVamm7tPbXWLNFgbc5QAvxVEA-1", src: rhapsody, theme: "rhapsody" },
];

/** Only replace the edited originals; later CMS uploads remain authoritative. */
export function channelCutout(banner?: string) {
  return banner ? cutouts.find((artwork) => banner.includes(artwork.original)) : undefined;
}