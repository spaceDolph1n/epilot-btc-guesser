# epilot BTC Price Guesser

A real-time, serverless web application that allows users to guess the direction of the Bitcoin (BTC/USD) market price. Built as a technical product spike for epilot.

> ⚠️ **Zero-Config Setup for Reviewers:**
> To ensure a zero-friction evaluation, this repository includes a pre-configured `.env.local` file pointing to a dedicated, sandboxed Upstash Redis instance. No additional cloud credentials are required.

## 🚀 Quick Start

- **Install**: `pnpm install`
- **Run**: `pnpm dev` (App: http://localhost:3000)
- **Test**: `pnpm test` (Unit) | `pnpm test:e2e` (E2E)

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **State/DB**: Upstash Redis (Serverless HTTP)
- **Price Oracle**: Coinbase Pro (REST & WebSocket)
- **Testing**: Vitest (Unit) & Playwright (E2E)

## 🏗️ System Overview (Phases 1-5)

### 1. Identity & Session Persistence

- **Edge-First Identity**: Managed via secure `httpOnly` guest cookies to prevent XSS-based session hijacking.
- **State Hydration**: Logic in `/api/user` restores scores and active game timers on page refresh, ensuring a seamless UX despite client-side resets.

### 2. Real-Time Data Strategy

- **WebSocket Integration**: Low-latency price updates via Coinbase Pro WebSocket for a "live" UI experience.
- **Backend Integrity**: Game resolution uses a direct, non-cached REST fetch to Coinbase to ensure the settlement price is accurate and cannot be manipulated by client-side latency.

### 3. Game Engine & Resolution

- **Pure Logic**: Core win/loss rules are decoupled from the framework for 100% testability via Vitest.
- **Lazy Resolution**: Outcomes are calculated strictly 60s post-bet upon user request, eliminating the need for expensive background workers or scheduled tasks.

### 4. Automated Quality Assurance

- **E2E Testing**: Playwright suite covers the critical user journey: WebSocket initialization, bet placement, and state locking.
- **CI/CD**: GitHub Actions are configured to run the full test suite on every Pull Request to ensure zero regressions.

### 5. Security & Rate Limiting

- **IP-Based Throttling**: A sliding-window rate limiter in the betting route protects Redis resources from bot-driven identity spoofing and resource exhaustion.
