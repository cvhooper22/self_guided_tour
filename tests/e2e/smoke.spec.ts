import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, who: "traveler" | "operator" | "admin") {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(`${who}@example.com`);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

test("direct tour link works logged out and has link-preview metadata", async ({ page }) => {
  await page.goto("/tour/savannah-squares");
  await expect(page.getByRole("heading", { name: "Squares of Savannah" })).toBeVisible();
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Squares of Savannah");
  await page.getByRole("link", { name: /Begin the tour/ }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
});

test("player opens a stop with its sources and tracks progress", async ({ page }) => {
  await page.goto("/play/savannah-squares");
  await page.getByRole("button", { name: /^Next:/ }).click();
  await expect(page.getByRole("heading", { name: "Chippewa Square" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Wikipedia/ })).toHaveAttribute("rel", /noopener/);
  await page.getByRole("button", { name: "Mark visited" }).click();
  await expect(page.getByRole("button", { name: "✓ Visited" })).toBeVisible();
});

test("geolocation near a stop opens it automatically", async ({ browser }) => {
  const ctx = await browser.newContext({ geolocation: { latitude: 32.0735, longitude: -81.0883 }, permissions: ["geolocation"], channel: "chrome" } as never);
  const page = await ctx.newPage();
  await page.goto("http://localhost:3100/play/savannah-squares");
  await page.getByRole("button", { name: /Use my location/ }).click();
  await expect(page.getByRole("heading", { name: "Colonial Park Cemetery" })).toBeVisible();
  await ctx.close();
});

test("each theme preset renders with a distinct look", async ({ page }) => {
  const bg: string[] = [];
  for (const slug of ["savannah-squares", "savannah-after-dark", "midtown-holiday-lights"]) {
    await page.goto(`/tour/${slug}`);
    bg.push(await page.locator(".themed").first().evaluate((e) => getComputedStyle(e).backgroundColor));
  }
  expect(new Set(bg).size).toBe(3);
});

test("role guards: traveler is blocked, drafts are hidden", async ({ page }) => {
  await signIn(page, "traveler");
  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin/);
  await page.goto("/operator");
  await expect(page).not.toHaveURL(/\/operator/);
  const r = await page.goto("/tour/draft-walk");
  expect(r?.status()).toBe(404);
});

/** Create a throwaway tour so edit tests never mutate seeded data. */
async function newTour(page: Page) {
  const res = await page.request.post("/api/operator/tours", { data: { title: `E2E ${Date.now()}` } });
  const { id } = await res.json();
  await page.goto(`/operator/tours/${id}`);
}

test("operator edits a tour and the change persists", async ({ page }) => {
  await signIn(page, "operator");
  await newTour(page);
  const title = `Edited ${Date.now()}`;
  await page.getByLabel("Title").first().fill(title);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
});

test("operator can customise the theme and see it in the preview", async ({ page }) => {
  await signIn(page, "operator");
  await newTour(page);
  await page.getByRole("tab", { name: "Theme" }).click();
  await page.getByLabel("Primary hex").fill("#ff0000");
  const btn = page.getByLabel("Live preview").locator(".t-btn").first();
  await expect(btn).toHaveCSS("background-color", "rgb(255, 0, 0)");
});

test("admin sees all tours incl. drafts, raw view, and can view-as a user", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/tours");
  await expect(page.getByText("Work-in-progress Walk")).toBeVisible();
  await page.getByRole("link", { name: "Raw" }).first().click();
  await expect(page.locator("pre")).toContainText('"stops"');
  await page.goto("/admin/users");
  await page.getByRole("row", { name: /traveler@example.com/ }).getByRole("button", { name: "View as" }).click();
  await expect(page.getByText(/Viewing as/)).toBeVisible();
  await page.getByRole("button", { name: "Stop viewing as" }).click();
  await page.goto("/admin/audit");
  await expect(page.getByText("admin.impersonate.start").first()).toBeVisible();
});
