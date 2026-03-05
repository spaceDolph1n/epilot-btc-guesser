export async function getBtcSpotPrice(): Promise<number> {
  try {
    // Next.js specific: { cache: 'no-store' } ensures we bypass the CDN cache.
    // We need the live price at the exact millisecond the user clicks "Guess".
    const response = await fetch(
      "https://api.coinbase.com/v2/prices/BTC-USD/spot",
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Coinbase API Error: ${response.status}`);
    }

    const json = await response.json();
    const price = parseFloat(json.data.amount);

    if (isNaN(price)) {
      throw new Error("Invalid price data received from Coinbase");
    }

    return price;
  } catch (error) {
    console.error(
      "BTC Price Fetch Failed:",
      error instanceof Error ? error.message : error,
    );

    throw new Error(
      "We are having trouble getting the latest BTC price. Please try again in a moment.",
    );
  }
}
