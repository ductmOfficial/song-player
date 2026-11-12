import { expect, playerBar, test } from "./fixtures";

test("compact player opens the full-screen Now playing view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Phát Thủy triều xanh" }).click();
  const bar = playerBar(page);
  await expect(bar.getByRole("button", { name: "Tạm dừng" })).toBeVisible();

  await bar.getByRole("button", { name: "Mở màn hình Đang phát" }).click();
  const sheet = page.getByRole("dialog", { name: "Thủy triều xanh" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("slider", { name: "Vị trí phát" })).toBeVisible();
  await sheet.getByRole("button", { name: "Thu nhỏ màn hình Đang phát" }).click();
  await expect(sheet).toBeHidden();
});
