/** RMS loudness normalized to a subtle microphone pulse, never simulated beats. */
export function audioLevel(samples: Uint8Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
  return Math.min(1, Math.sqrt(sum / samples.length) * 3);
}