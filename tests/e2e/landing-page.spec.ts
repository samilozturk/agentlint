import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("renders hero section with correct heading", async ({ page }) => {
    await page.goto("/landing");
    await expect(
      page.getByRole("heading", { name: /coding agent/i }),
    ).toBeVisible();
  });

  test("renders all 4 feature cards", async ({ page }) => {
    await page.goto("/landing");
    await expect(page.getByText("5 Artifact Types")).toBeVisible();
    await expect(page.getByText("Judge & Score")).toBeVisible();
    await expect(page.getByText("Diff Viewer")).toBeVisible();
    await expect(page.getByText("Security Gate")).toBeVisible();
  });

  test("renders 3-step workflow section", async ({ page }) => {
    await page.goto("/landing");
    await expect(page.getByText("Select")).toBeVisible();
    await expect(page.getByText("Analyze", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Perfect", exact: true })).toBeVisible();
  });

  test("Open Dashboard navigates to main page", async ({ page }) => {
    await page.goto("/landing");
    await page.getByRole("link", { name: "Open Dashboard" }).click();
    await page.waitForURL("/");
    await expect(page.getByTestId("artifact-input")).toBeVisible();
  });

  test("Get Started CTA navigates to main page", async ({ page }) => {
    await page.goto("/landing");
    await page.getByRole("link", { name: "Get Started" }).click();
    await page.waitForURL("/");
    await expect(page.getByTestId("artifact-input")).toBeVisible();
  });
});
