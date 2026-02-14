import { expect, test, type Page } from "@playwright/test";

async function waitForAnalysisResult(page: Page) {
  await expect(page.getByText("Judge is thinking")).not.toBeVisible({ timeout: 45_000 });
  const output = page.getByTestId("artifact-output");
  await expect(output).not.toContainText("Run Analyze to generate the perfected artifact.", {
    timeout: 45_000,
  });
}

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
    await waitForAnalysisResult(page);

    await expect(
      page.getByText("Analyze content to see before/after diff"),
    ).not.toBeVisible();

    const diffSection = page.locator("text=Diff View").locator("..");
    await expect(diffSection).toBeVisible();
  });

  test("shows added/removed line count badges", async ({ page }) => {
    await page.getByRole("button", { name: "Analyze" }).click();
    await waitForAnalysisResult(page);

    const addedBadge = page.locator(".bg-emerald-500\\/15").first();
    const removedBadge = page.locator(".bg-rose-500\\/15").first();
    await expect(addedBadge).toBeVisible();
    await expect(removedBadge).toBeVisible();
  });

  test("applies selected diff segment", async ({ page }) => {
    const input = page.getByTestId("artifact-input");
    const originalValue = await input.inputValue();

    await page.getByRole("button", { name: "Analyze" }).click();
    await waitForAnalysisResult(page);

    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.check();

    await page.getByRole("button", { name: "Apply Selected" }).click();

    const updatedValue = await input.inputValue();
    expect(updatedValue).not.toBe(originalValue);
    expect(updatedValue).toContain("Refined Artifact");
  });
});
