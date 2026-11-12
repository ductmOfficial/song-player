import AxeBuilder from "@axe-core/playwright";
import { type Page, test as base, expect } from "@playwright/test";

/** A quiet sine tone as a WAV, so playback works without the network. */
function wav(seconds = 20, sampleRate = 8000): Buffer {
  const samples = seconds * sampleRate;
  const buf = Buffer.alloc(44 + samples * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) {
    buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 220 * i) / sampleRate) * 800), 44 + i * 2);
  }
  return buf;
}

const audio = wav();

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, provide) => {
    // Streams are requested by the browser straight from Audius; answer them locally.
    const serveAudio = (route: Parameters<Parameters<Page["route"]>[1]>[0]) =>
      route.fulfill({ status: 200, body: audio, contentType: "audio/wav" });
    await page.route("**/v1/tracks/*/stream**", serveAudio);
    // Deezer previews: our /api/preview route redirects here (see src/mocks).
    await page.route("https://cdnt-preview.dzcdn.net/**", serveAudio);
    await provide(page);
  },
});

export { expect };

/** No serious or critical WCAG 2.2 AA violations. */
export async function expectAccessible(page: Page) {
  // Let entrance animations and the accent color transition settle; axe reads computed colors.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) =>
          a.playState !== "running" ||
          a.effect?.getTiming().iterations === Number.POSITIVE_INFINITY,
      ),
  );
  await page.waitForTimeout(700);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`),
  ).toEqual([]);
}

export const playerBar = (page: Page) => page.getByRole("region", { name: "Trình phát nhạc" });
