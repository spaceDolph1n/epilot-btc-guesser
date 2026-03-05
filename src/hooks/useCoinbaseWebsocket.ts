import { useState, useEffect, useRef } from "react";

export function useCoinbaseWebsocket() {
  const [price, setPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<
    "connecting" | "open" | "closed" | "error"
  >("connecting");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to Coinbase Pro WebSocket feed
    ws.current = new WebSocket("wss://ws-feed.exchange.coinbase.com");

    ws.current.onopen = () => {
      setStatus("open");
      // Subscribe to the BTC-USD ticker channel
      ws.current?.send(
        JSON.stringify({
          type: "subscribe",
          product_ids: ["BTC-USD"],
          channels: ["ticker"],
        }),
      );
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Only update state if we receive a valid ticker price update
        if (data.type === "ticker" && data.price) {
          setPrice(parseFloat(data.price));
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus("error");
    };

    ws.current.onclose = () => {
      setStatus("closed");
    };

    // Staff Move: Always clean up connections to prevent zombie sockets on unmount
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  return { price, status };
}
