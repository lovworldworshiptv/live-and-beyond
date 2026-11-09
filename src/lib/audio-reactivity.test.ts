import { expect, it } from "vitest";
import { audioLevel } from "./audio-reactivity";

it("leaves the microphone still for silence", () => {
  expect(audioLevel(new Uint8Array([128, 128, 128]))).toBe(0);
});
it("increases the microphone pulse with actual sound energy", () => {
  expect(audioLevel(new Uint8Array([160, 96]))).toBe(0.75);
  expect(audioLevel(new Uint8Array([255, 0]))).toBe(1);
});