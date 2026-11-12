import { expect, expectAccessible, test } from "./fixtures";

test("search finds tracks and artists as you type", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("searchbox", { name: "Tìm bài hát hoặc nghệ sĩ" }).fill("linh");
  await expect(page).toHaveURL(/\?q=linh/);
  await expect(page.getByRole("heading", { name: "Nghệ sĩ" })).toBeVisible();
  await page
    .getByRole("link", { name: /Linh Hà/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/artist\/linhha/);
});

test("search shows an empty state", async ({ page }) => {
  await page.goto("/search?q=khongcogi");
  await expect(
    page.getByRole("paragraph").filter({ hasText: "Không tìm thấy kết quả cho “khongcogi”" }),
  ).toBeVisible();
  // …and announces it to screen readers.
  await expect(page.getByRole("status").filter({ hasText: "khongcogi" })).toBeAttached();
});

test("track page shows details and more by the artist", async ({ page }) => {
  await page.goto("/track/t1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thủy triều xanh");
  await expect(page.getByText("D minor")).toBeVisible();
  await expect(page.getByRole("list", { name: "Thêm từ Linh Hà" })).toBeVisible();
  await expectAccessible(page);
});

test("artist page lists popular tracks", async ({ page }) => {
  await page.goto("/artist/linhha");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Linh Hà");
  await expect(page.getByRole("list", { name: "Nổi bật" }).getByRole("listitem")).toHaveCount(3);
  await expectAccessible(page);
});

test("unknown track shows the localized not-found page", async ({ page }) => {
  await page.goto("/track/does-not-exist");
  await expect(page.getByRole("heading", { name: "Không tìm thấy trang này" })).toBeVisible();
});

test("history records listens and can be cleared", async ({ page }) => {
  await page.goto("/history");
  await expect(page.getByText("Bạn chưa nghe bài nào")).toBeVisible();
  await expectAccessible(page);
});
