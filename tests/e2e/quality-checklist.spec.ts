import { expect, test } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test.describe("Quality analyzer panel", () => {
  test("shows missing/checklist/metrics and prompt pack", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Analyze" }).click();
    await expect(page.getByText("Judge is thinking")).not.toBeVisible({ timeout: 45_000 });

    await expect(page.getByRole("tab", { name: "Missing" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Checklist" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Metrics" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Examples" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Prompt Pack" })).toBeVisible();

    await page.getByRole("tab", { name: "Metrics" }).click();
    await expect(page.getByRole("button", { name: /Clarity/i })).toBeVisible();

    await page.getByRole("tab", { name: "Prompt Pack" }).click();
    await expect(page.getByRole("button", { name: /Copy Prompt|Copied/i })).toBeVisible();
    await page.getByRole("button", { name: /Copy Prompt|Copied/i }).click();
  });
});
