import { expect, playerBar, test } from "./fixtures";

test.describe("Player", () => {
  test("plays a track and keeps playing across navigation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Phát Thủy triều xanh" }).click();

    const bar = playerBar(page);
    await expect(bar).toBeVisible();
    await expect(bar.getByRole("link", { name: "Thủy triều xanh" })).toBeVisible();
    await expect(bar.getByRole("button", { name: "Tạm dừng" })).toBeVisible();

    // Time advances…
    const seek = bar.getByRole("slider", { name: "Vị trí phát" });
    await expect(seek).not.toHaveAttribute("aria-valuetext", /^0:00/, { timeout: 5_000 });

    // …and survives a client-side navigation.
    await bar.getByRole("link", { name: "Linh Hà" }).click();
    await expect(page).toHaveURL(/\/artist\/linhha/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Linh Hà");
    await expect(bar.getByRole("button", { name: "Tạm dừng" })).toBeVisible();
  });

  test("keyboard shortcuts control playback", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Phát Thủy triều xanh" }).click();
    const bar = playerBar(page);
    await expect(bar.getByRole("button", { name: "Tạm dừng" })).toBeVisible();

    await page.locator("body").click({ position: { x: 5, y: 5 } }); // move focus off the button
    await page.keyboard.press("k");
    await expect(bar.getByRole("button", { name: "Phát", exact: true })).toBeVisible();

    await page.keyboard.press("Shift+ArrowRight");
    await expect(bar.getByRole("link", { name: "Mưa trên mái ngói" })).toBeVisible();

    await page.keyboard.press("?");
    await expect(page.getByRole("dialog", { name: "Phím tắt" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Phím tắt" })).toBeHidden();
  });

  test("edits the queue and restores it after a reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Phát tuyển tập" }).click();
    const bar = playerBar(page);
    await expect(bar.getByRole("link", { name: "Thủy triều xanh" })).toBeVisible();

    await bar.getByRole("button", { name: /^Hàng đợi/ }).click();
    const queue = page.getByRole("dialog", { name: "Hàng đợi" });
    await expect(queue).toBeVisible();
    // 5 playable tracks: 1 current + 4 up next (the gated one was skipped).
    await expect(queue.getByRole("listitem")).toHaveCount(4);

    await queue.getByRole("button", { name: "Bỏ Mưa trên mái ngói khỏi hàng đợi" }).click();
    await expect(queue.getByRole("listitem")).toHaveCount(3);

    // Keyboard reorder: move "Ga cuối" (last) up one.
    await queue.getByRole("button", { name: "Ga cuối Minh Đỗ" }).focus();
    await page.keyboard.press("Alt+ArrowUp");
    await expect(queue.getByRole("listitem").nth(1)).toContainText("Ga cuối");

    await page.keyboard.press("Escape");
    await page.reload();
    await expect(bar.getByRole("link", { name: "Thủy triều xanh" })).toBeVisible();
    await expect(bar.getByRole("button", { name: "Phát", exact: true })).toBeVisible(); // restored paused
  });

  test("adds to the queue from a track list", async ({ page }) => {
    await page.goto("/artist/minhdo");
    await page.getByRole("button", { name: "Thêm Sóng ngầm vào hàng đợi" }).first().click();
    await expect(
      page.getByRole("status").filter({ hasText: "Đã thêm 1 bài vào hàng đợi" }),
    ).toBeVisible();
    await expect(playerBar(page).getByRole("link", { name: "Sóng ngầm" })).toBeVisible();
  });
});
