import { describe, it, expect } from "vitest";
import { calculateGameResult } from "./game";

describe("calculateGameResult", () => {
  it("wins when price goes up and user guessed up", () => {
    const result = calculateGameResult(60000, 60100, "up");
    expect(result.win).toBe(true);
    expect(result.priceChange).toBe(100);
  });

  it("loses when price goes down and user guessed up", () => {
    const result = calculateGameResult(60000, 59900, "up");
    expect(result.win).toBe(false);
  });

  it("wins when price goes down and user guessed down", () => {
    const result = calculateGameResult(60000, 59000, "down");
    expect(result.win).toBe(true);
  });

  it("handles exact same price as a loss", () => {
    const result = calculateGameResult(60000, 60000, "up");
    expect(result.win).toBe(false);
  });
});
