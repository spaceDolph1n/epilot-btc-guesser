import { test, expect } from "@playwright/test";

test.describe("BTC Price Guesser - Core Game Flow", () => {
  test("should successfully complete a betting cycle", async ({ page }) => {
    await test.step("1. Navigate to app and verify initial state", async () => {
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "BTC Guesser" }),
      ).toBeVisible();
      await expect(page.getByText(/Score: \d+/)).toBeVisible();
    });

    await test.step("2. Wait for WebSocket price feed to initialize", async () => {
      // Use the testid for a stable hook
      const upButton = page.getByTestId("guess-up-button");
      // Verify initial label is correct before clicking
      await expect(upButton).toHaveText("UP 📈");
      await expect(upButton).toBeEnabled({ timeout: 15000 });
    });

    await test.step("3. Place a directional guess and verify loading state", async () => {
      const upButton = page.getByTestId("guess-up-button");

      await upButton.click();

      // Because we use data-testid, this assertion works even though the text changed
      await expect(upButton).toHaveText("...");
      await expect(upButton).toBeDisabled();
    });

    await test.step("4. Verify backend lock and active game UI", async () => {
      await expect(page.getByText("You guessed")).toBeVisible();
      await expect(page.getByText(/Locked at: \$/)).toBeVisible();
    });

    await test.step("5. Verify countdown timer is active", async () => {
      const timer = page.getByTestId("countdown-timer");
      await expect(timer).toBeVisible();
      await expect(timer).toContainText(/^[0-9]+s$/);
    });
  });
});
