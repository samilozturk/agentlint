import { expect, test } from "@playwright/test";

test.describe("Diff Viewer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows placeholder text before analysis", async ({ page }) => {
    await expect(
      page.getByText("Analyze content to see before/after diff"),
    ).toBeVisible();
  });

  test("populates diff after analysis", async ({ page }) => {
    await page.getByRole("button", { name: "Analyze" }).click();
    await expect(page.getByTestId("artifact-output")).toContainText("Refined Artifact", {
      timeout: 15_000,
    });

    await expect(
      page.getByText("Analyze content to see before/after diff"),
    ).not.toBeVisible();

    const diffSection = page.locator("text=Diff View").locator("..");
    await expect(diffSection).toBeVisible();
  });

  test("shows added/removed line count badges", async ({ page }) => {
    await page.getByRole("button", { name: "Analyze" }).click();
    await expect(page.getByTestId("artifact-output")).toContainText("Refined Artifact", {
      timeout: 15_000,
    });

    const addedBadge = page.locator(".bg-emerald-500\\/15").first();
    const removedBadge = page.locator(".bg-rose-500\\/15").first();
    await expect(addedBadge).toBeVisible();
    await expect(removedBadge).toBeVisible();
  });
});
