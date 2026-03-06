"use client";

import { useState, useEffect } from "react";
import { useCoinbaseWebsocket } from "@/hooks/useCoinbaseWebsocket";

interface ActiveGuess {
  direction: "up" | "down";
  startPrice: number;
  createdAt: number;
}

interface GameResult {
  win: boolean;
  endPrice: number;
}

export default function Home() {
  const { price, status } = useCoinbaseWebsocket();
  const [score, setScore] = useState<number>(0);
  const [activeGuess, setActiveGuess] = useState<ActiveGuess | null>(null);

  const [guessEndTime, setGuessEndTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const [result, setResult] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuessing, setIsGuessing] = useState<boolean>(false);

  // 1. Initial Hydration (UPDATED TO HANDLE REFRESHES)
  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.score !== undefined) setScore(data.score);

        // If the backend says we have a locked guess, restore the UI!
        if (data.activeGuess) {
          setActiveGuess(data.activeGuess);

          // Calculate how much time has passed since the server locked it
          const elapsedMs = Date.now() - data.activeGuess.createdAt;
          const remainingMs = 60000 - elapsedMs;

          if (remainingMs > 0) {
            // Still pending! Resume the timer.
            setGuessEndTime(Date.now() + remainingMs);
          } else {
            // Time is already up! Trigger resolution immediately.
            setGuessEndTime(Date.now()); // The timer effect will catch this and call resolveGuess
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load user state", err);
        setIsLoading(false);
      });
  }, []);

  // 2. The Bulletproof Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (activeGuess && guessEndTime) {
      timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((guessEndTime - now) / 1000));

        setTimeRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(timer);
          resolveGuess();
        }
      }, 500);
    }

    return () => clearInterval(timer);
  }, [activeGuess, guessEndTime]);

  // 3. Action: Place a Guess
  const handleGuess = async (direction: "up" | "down") => {
    setIsGuessing(true);
    setResult(null);

    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });

      const data = await res.json();

      if (data.success) {
        setActiveGuess(data.guess);
        setGuessEndTime(Date.now() + 60000);
        setTimeRemaining(60);
      } else {
        alert(data.error || "Failed to place guess");
      }
    } catch (error) {
      alert("Network error while placing guess.");
    } finally {
      setIsGuessing(false);
    }
  };

  // 4. Action: Resolve the Guess
  const resolveGuess = async () => {
    try {
      const res = await fetch("/api/resolve", { method: "POST" });
      const data = await res.json();

      if (data.win !== undefined) {
        setResult({ win: data.win, endPrice: data.endPrice });
        setScore(data.newScore);
        setActiveGuess(null);
        setGuessEndTime(null);
      } else if (data.remaining) {
        // Clock skew mitigation
        setGuessEndTime(Date.now() + data.remaining * 1000);
      }
    } catch (error) {
      console.error("Failed to resolve guess", error);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8 text-center">
        {/* Header & Score */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold">BTC Guesser</h1>
          <div className="text-xl font-mono bg-gray-700 px-4 py-1 rounded-full transition-all">
            Score: {score}
          </div>
        </div>

        {/* Live Price Ticker */}
        <div className="space-y-2">
          <p className="text-sm text-gray-400 uppercase tracking-widest">
            Live BTC/USD {status === "connecting" ? "(Connecting...)" : ""}
          </p>
          <div
            className={`text-5xl font-mono transition-colors duration-200 ${status === "open" ? "text-green-400" : "text-red-400"}`}
          >
            {price
              ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              : "---"}
          </div>
        </div>

        {/* Game State UI */}
        <div className="min-h-[150px] flex flex-col justify-center">
          {activeGuess ? (
            <div className="space-y-4">
              <p className="text-lg">
                You guessed{" "}
                <strong
                  className={`uppercase ${activeGuess.direction === "up" ? "text-green-400" : "text-red-400"}`}
                >
                  {activeGuess.direction}
                </strong>
              </p>
              <p className="text-sm text-gray-400">
                Locked at:{" "}
                <span className="font-mono text-white">
                  ${activeGuess.startPrice.toLocaleString()}
                </span>
              </p>
              <div
                data-testid="countdown-timer"
                className="text-4xl font-bold text-yellow-400 tabular-nums"
              >
                {timeRemaining}s
              </div>
              <p className="text-xs text-gray-500 animate-pulse">
                Waiting for resolution...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-300">
                Where will the price be in 60 seconds?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  data-testid="guess-up-button"
                  onClick={() => handleGuess("up")}
                  disabled={!price || isGuessing}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-32"
                >
                  {isGuessing ? "..." : "UP 📈"}
                </button>
                <button
                  data-testid="guess-down-button"
                  onClick={() => handleGuess("down")}
                  disabled={!price || isGuessing}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-32"
                >
                  {isGuessing ? "..." : "DOWN 📉"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Toast */}
        {result && !activeGuess && (
          <div
            className={`p-4 rounded-lg animate-fade-in ${result.win ? "bg-green-900/50 border border-green-500" : "bg-red-900/50 border border-red-500"}`}
          >
            <h3 className="font-bold text-lg">
              {result.win ? "🎉 You Won!" : "💀 You Lost!"}
            </h3>
            <p className="text-sm">
              Settled at ${result.endPrice.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
