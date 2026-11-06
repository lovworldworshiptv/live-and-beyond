/** "CAUGHT UP 1" / "night of bliss" -> "Caught Up 1" / "Night Of Bliss" (initial capital on every word). */
export function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s\-—(/"'])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
}
