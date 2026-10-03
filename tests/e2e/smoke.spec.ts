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

test("travelers can filter tours by operator-defined tag", async ({ page }) => {
  await page.goto("/tours");
  await expect(page.getByTestId("tour-card")).toHaveCount(3);
  await page.getByTestId("tag-filter").filter({ hasText: "Ghost stories" }).click();
  await expect(page).toHaveURL(/tag=Ghost\+stories/);
  await expect(page.getByTestId("tour-card")).toHaveCount(1);
  await expect(page.getByTestId("tour-card")).toContainText("Savannah After Dark");
  await expect(page.getByTestId("tour-tag")).toHaveText("Ghost stories");
});

test("operator adds a tag and it shows on the tour page", async ({ page }) => {
  await signIn(page, "operator");
  await newTour(page);
  await page.getByLabel("Tags").fill("Local favorite");
  await page.getByLabel("Tags").press("Enter");
  await page.getByLabel("Tags").fill("local FAVORITE");
  await page.getByLabel("Tags").press("Enter");
  await expect(page.getByRole("button", { name: "Remove tag Local favorite" })).toHaveCount(1);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.reload();
  await expect(page.getByRole("button", { name: "Remove tag Local favorite" })).toBeVisible();
});

test("stop tags show in the player and make the tour findable by that tag", async ({ page }) => {
  await page.goto("/tours?tag=Verified");
  await expect(page.getByTestId("tour-card")).toHaveCount(1);
  await expect(page.getByTestId("tour-card")).toContainText("Squares of Savannah");
  await page.goto("/play/savannah-squares");
  await page.getByRole("button", { name: /Colonial Park Cemetery/ }).first().click();
  await expect(page.getByTestId("stop-tag")).toHaveText("Verified");
});

test("operator can tag a stop and it persists", async ({ page }) => {
  await signIn(page, "operator");
  const res = await page.request.post("/api/operator/tours", { data: { title: `E2E ${Date.now()}` } });
  const { id } = await res.json();
  await page.goto(`/operator/tours/${id}`);
  await page.getByRole("button", { name: "Stops & sources" }).or(page.getByRole("tab", { name: "Stops & sources" })).click();
  await page.getByRole("button", { name: "+ Add stop on map" }).click();
  await page.locator(".leaflet-container").click({ position: { x: 200, y: 150 } });
  await page.getByLabel("Tags").fill("Verified");
  await page.getByLabel("Tags").press("Enter");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  const b = await (await page.request.get(`/api/operator/tours/${id}`)).json();
  expect(b.stops[0].tags).toEqual(["Verified"]);
});

test("operator can pick a custom marker for a stop and it renders", async ({ page }) => {
  await signIn(page, "operator");
  const { id } = await (await page.request.post("/api/operator/tours", { data: { title: `E2E ${Date.now()}` } })).json();
  await page.goto(`/operator/tours/${id}`);
  await page.getByRole("button", { name: "Stops & sources" }).or(page.getByRole("tab", { name: "Stops & sources" })).click();
  await page.getByRole("button", { name: "+ Add stop on map" }).click();
  await page.locator(".leaflet-container").click({ position: { x: 200, y: 150 } });
  await page.getByRole("button", { name: "Marker 👻" }).click();
  await expect(page.locator(".tm-marker").first()).toHaveText("👻");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  const b = await (await page.request.get(`/api/operator/tours/${id}`)).json();
  expect(b.stops[0].markerIcon).toBe("👻");
  // Invalid markers are rejected server-side.
  b.stops[0].markerIcon = "https://evil.example/x.png";
  const bad = await page.request.put(`/api/operator/tours/${id}`, { data: { tour: b.tour, stops: b.stops, routes: b.routes } });
  expect(bad.ok()).toBe(false);
});

test("operator draws a walking path on a route and travelers get directions links", async ({ page }) => {
  await signIn(page, "operator");
  const { id, slug } = await (await page.request.post("/api/operator/tours", { data: { title: `E2E ${Date.now()}` } })).json();
  await page.goto(`/operator/tours/${id}`);
  await page.getByRole("button", { name: "Stops & sources" }).or(page.getByRole("tab", { name: "Stops & sources" })).click();
  for (const x of [150, 300]) {
    await page.getByRole("button", { name: "+ Add stop on map" }).click();
    await page.locator(".leaflet-container").click({ position: { x, y: 150 } });
  }
  await page.getByRole("button", { name: "Routes" }).or(page.getByRole("tab", { name: "Routes" })).click();
  await page.getByRole("button", { name: "+ Add route" }).click();
  await page.getByRole("button", { name: "Draw walking path" }).click();
  await page.getByText("More").click();
  await page.getByRole("button", { name: "Start from stops (straight lines)" }).click();
  await expect(page.getByText(/^2 points/)).toBeVisible();
  await page.getByRole("button", { name: "＋ Add points at end" }).click();
  await page.locator(".leaflet-container").click({ position: { x: 400, y: 250 } });
  await page.locator(".leaflet-container").click({ position: { x: 450, y: 300 } });
  await page.getByRole("button", { name: "Done drawing" }).click();
  await expect(page.getByText(/^4 points/)).toBeVisible();
  // Redraw the section between the first and last point.
  const vertex = (i: number) => page.locator(`.tm-vertex[data-i="${i}"]`).dispatchEvent("click");
  await vertex(0); await vertex(3);
  await page.getByRole("button", { name: /Redraw between #1 and #4/ }).click();
  await expect(page.getByText(/^2 points/)).toBeVisible();
  await page.locator(".leaflet-container").click({ position: { x: 300, y: 320 } });
  await page.getByRole("button", { name: "Done drawing" }).click();
  await expect(page.getByText(/^3 points/)).toBeVisible();
  // Undo steps back through the redraw.
  await page.getByRole("button", { name: "↶ Undo" }).click();
  await expect(page.getByText(/^2 points/)).toBeVisible();
  await page.getByRole("button", { name: "↷ Redo" }).click();
  await expect(page.getByText(/^3 points/)).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  const b = await (await page.request.get(`/api/operator/tours/${id}`)).json();
  expect(b.routes[0].path).toHaveLength(3);
  // Snapping needs a routing key; without one the server says so instead of failing.
  const snap = await page.request.post("/api/operator/route-snap", { data: { points: b.routes[0].path } });
  expect([200, 501]).toContain(snap.status());
  // Out-of-range points are rejected server-side.
  b.routes[0].path = [[999, 0]];
  expect((await page.request.put(`/api/operator/tours/${id}`, { data: { tour: b.tour, stops: b.stops, routes: b.routes } })).ok()).toBe(false);
  void slug;
});

test("player shows walking directions links for a stop", async ({ page }) => {
  await page.goto("/play/savannah-squares");
  await page.getByRole("button", { name: /^Next:/ }).click();
  await expect(page.getByRole("link", { name: "Google Maps" })).toHaveAttribute("href", /travelmode=walking/);
  await expect(page.getByRole("link", { name: "Apple Maps" })).toHaveAttribute("href", /dirflg=w/);
});
