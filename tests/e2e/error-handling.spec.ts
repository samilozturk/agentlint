import { expect, test } from "@playwright/test";

test.describe("Error handling", () => {
  test("shows error and disables analyze for oversized input", async ({ page }) => {
    test.slow();
    await page.goto("/");

    const input = page.getByTestId("artifact-input");
    await input.focus();
    await input.fill("x".repeat(1_000_001));

    await expect(
      page.getByText(/exceeds 1,000,000 character limit/i),
    ).toBeVisible({ timeout: 30_000 });

    const analyzeBtn = page.getByRole("button", { name: "Analyze" });
    await expect(analyzeBtn).toBeDisabled();
  });

  test("re-enables analyze after reducing input below limit", async ({ page }) => {
    test.slow();
    await page.goto("/");

    const input = page.getByTestId("artifact-input");
    await input.focus();
    await input.fill("x".repeat(1_000_001));

    const analyzeBtn = page.getByRole("button", { name: "Analyze" });
    await expect(analyzeBtn).toBeDisabled({ timeout: 30_000 });

    await input.fill("# Valid small input");
    await expect(analyzeBtn).toBeEnabled();
  });
});
