export type GuessDirection = "up" | "down";

export interface GameResult {
  win: boolean;
  priceChange: number;
}

export function calculateGameResult(
  startPrice: number,
  endPrice: number,
  direction: GuessDirection,
): GameResult {
  const priceChange = endPrice - startPrice;

  // A win is defined as the price moving in the predicted direction.
  // Note: "No change" (0) defaults to a loss
  const win = direction === "up" ? priceChange > 0 : priceChange < 0;

  return { win, priceChange };
}
