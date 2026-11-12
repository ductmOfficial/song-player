import { expect, test } from "./fixtures";

test.use({ serviceWorkers: "allow" });
// Service-worker install is timing-sensitive under load; keep this file on one worker.
test.describe.configure({ mode: "serial" });

test("installs a service worker and falls back to the offline page", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  // Controlled by the worker, with the offline page precached.
  await page.waitForFunction(async () => {
    if (!navigator.serviceWorker.controller) return false;
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      if ((await cache.keys()).some((r) => new URL(r.url).pathname === "/~offline")) return true;
    }
    return false;
  });

  await context.setOffline(true);
  // Never visited, so not in any cache. Retried: under load the worker can still be settling.
  await expect(async () => {
    await page.goto("/track/t3");
    await expect(page.getByRole("heading", { name: "Bạn đang ngoại tuyến" })).toBeVisible({
      timeout: 2_000,
    });
  }).toPass({ timeout: 15_000 });
  await context.setOffline(false);
});

test("exposes an installable manifest", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = (await res.json()) as { icons: { purpose?: string }[] };
  expect(manifest).toMatchObject({ name: "Sóng", display: "standalone" });
  expect(manifest.icons.some((i) => i.purpose === "maskable")).toBe(true);
});
