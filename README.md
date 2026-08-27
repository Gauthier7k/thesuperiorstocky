# STOCKY 🚀

**keep up · always up · be up**

A boring, everyday stock app reinvented as an arcade celebration — built for a hackathon.

**Live demo:** https://gauthier7k.github.io/thesuperiorstocky/

## What it does

- **Click a stock** → it pops up with springy animations, hype copy ("NVDA is COOKING 🔥"), and a confetti burst when it's up
- **Morphing chart** — switching stocks or timeframes liquid-morphs the SVG line (120-point lerp engine), never a hard swap
- **Adjustable timeframe** — 1D / 1W / 1M / 3M / 1Y, chart goes green or red with the period
- **🙃 DEPRESSION INVERTER** — when a stock is down, the chart flips upside down so it only ever points up. Honest about it (INVERTED badge), but gravity is a suggestion
- **Your Bag** — enter shares you own @ a price or @ a date → live P/L with tiered celebrations (big gains = double side-cannons)
- **The Buzz** — latest news in Today / This Week / This Month tabs
- **Hype toasts** — the app cheers you on like a supportive friend

## Data

Live quotes + company news from Finnhub (free tier), with a deterministic seeded
simulation as automatic fallback — the demo never breaks, even fully offline.
Chart history is synthesized per-symbol (seeded geometric Brownian motion) and
anchored to end exactly at the real live price. Optional Twelve Data key adds
real historical candles.

## Run it

```bash
npm install
cp .env.example .env   # optionally add your keys — zero keys = full sim mode
npm run dev
```

Built with Vite + React 19 + TypeScript, framer-motion, canvas-confetti, d3-shape.
