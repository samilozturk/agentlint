import { expect, test } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test.describe("Analyze flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("analyze button is disabled when input is empty", async ({ page }) => {
    const input = page.getByTestId("artifact-input");
    await input.clear();

    const analyzeBtn = page.getByRole("button", { name: "Analyze" });
    await expect(analyzeBtn).toBeDisabled();
  });

  test("shows loading state during analysis", async ({ page }) => {
    await page.getByRole("button", { name: "Analyze" }).click();
    await expect(page.getByText("Judge is thinking")).toBeVisible();
  });

  test("analysis produces output, score, and diff", async ({ page }) => {
    await page.getByRole("button", { name: "Analyze" }).click();

    await expect(page.getByTestId("artifact-output")).toContainText("Refined Artifact", {
      timeout: 15_000,
    });

    await expect(page.locator("[data-slot='progress']").first()).toBeVisible();

    await expect(page.locator(".bg-emerald-500\\/15").first()).toBeVisible();
  });

  test("apply fix replaces input with output", async ({ page }) => {
    await page.getByRole("button", { name: "Analyze" }).click();
    await expect(page.getByTestId("artifact-output")).toContainText("Refined Artifact", {
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Apply Fix" }).click();
    const input = page.getByTestId("artifact-input");
    await expect(input).toHaveValue(/Refined Artifact/);
  });

  test("copy button copies output to clipboard", async ({ page }) => {
    await page.getByRole("button", { name: "Analyze" }).click();
    await expect(page.getByTestId("artifact-output")).toContainText("Refined Artifact", {
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Copy" }).click();
    await expect(page.getByText("Copied!")).toBeVisible();

    const clipboard = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clipboard).toContain("Refined Artifact");
  });

  test("export button triggers download", async ({ page }) => {
    await page.getByRole("button", { name: "Analyze" }).click();
    await expect(page.getByTestId("artifact-output")).toContainText("Refined Artifact", {
      timeout: 15_000,
    });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/agents-refined\.md/);
  });

  test("action buttons are disabled before analysis", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Apply Fix" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Copy" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Export" })).toBeDisabled();
  });
});
