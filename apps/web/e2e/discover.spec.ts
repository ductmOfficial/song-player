import { expect, expectAccessible, test } from "./fixtures";

test.describe("Discover", () => {
  test("shows trending tracks from Audius", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("nghe trọn vẹn");
    const grid = page.getByRole("list", { name: "Đang nổi trên Audius" });
    await expect(grid.getByRole("article")).toHaveCount(6);
    // Gated tracks are listed but not playable.
    await expect(grid.getByRole("button", { name: "Phát Bản nháp chưa phát hành" })).toHaveCount(0);
  });

  test("filters by mood through the URL", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ngày mưa" }).click();
    await expect(page).toHaveURL(/\?mood=rain/);
    await expect(page.getByRole("button", { name: "Ngày mưa" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const grid = page.getByRole("list", { name: "Đang nổi trên Audius" });
    await expect(grid.getByRole("article")).toHaveCount(1);
    await expect(grid).toContainText("Mưa trên mái ngói");
  });

  test("filters trending by time window", async ({ page }) => {
    await page.goto("/?mood=rain");
    await page.getByRole("button", { name: "Mọi thời đại" }).click();
    await expect(page).toHaveURL(/mood=rain/);
    await expect(page).toHaveURL(/time=allTime/);
    await expect(page.getByRole("button", { name: "Mọi thời đại" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: "Tuần này" }).click();
    await expect(page).not.toHaveURL(/time=/); // the default stays out of the URL
  });

  test("shows the Deezer chart as 30-second previews", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByRole("list", { name: "Bảng xếp hạng thế giới" });
    await expect(chart.getByRole("listitem")).toHaveCount(3);
    await expect(chart.getByText("Nghe thử 30s").first()).toBeVisible();
    // Titles link out to Deezer; we have no track page for them.
    await expect(chart.getByRole("link", { name: /Midnight Ferry/ })).toHaveAttribute(
      "href",
      "https://www.deezer.com/track/102",
    );
    // A chart entry without a preview isn't playable.
    await expect(chart.getByRole("button", { name: "Phát Không có bản nghe thử" })).toHaveCount(0);

    await chart.getByRole("button", { name: "Phát Ánh đèn thành phố", exact: true }).click();
    const bar = page.getByRole("region", { name: "Trình phát nhạc" });
    await expect(bar.getByText("Ánh đèn thành phố")).toBeVisible();
    await expect(bar.getByRole("button", { name: "Tạm dừng" })).toBeVisible();
    await expect(bar.getByRole("slider", { name: "Vị trí phát" })).not.toHaveAttribute(
      "aria-valuetext",
      /^0:00/,
      { timeout: 5_000 },
    );
  });

  test("switches language and theme", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("heard in full");

    await page.getByText("Light", { exact: true }).click({ force: true });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("is accessible in both themes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("list", { name: "Đang nổi trên Audius" }).waitFor();
    await expectAccessible(page);
    await page.getByRole("radio", { name: "Sáng" }).check({ force: true });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expectAccessible(page);
  });
});
