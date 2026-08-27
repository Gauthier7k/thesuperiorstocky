export interface StockMeta {
  symbol: string
  name: string
  emoji: string
  /** neon accent used for the card glow + confetti tint */
  accent: string
  /** fallback price when no live quote is available */
  mockBasePrice: number
  /** annualized volatility — shapes each stock's chart personality */
  mockVolatility: number
  /** annualized drift of the synthetic series */
  mockDrift: number
}

export const STOCKS: StockMeta[] = [
  { symbol: 'AAPL', name: 'Apple', emoji: '🍎', accent: '#B8C4FF', mockBasePrice: 255, mockVolatility: 0.22, mockDrift: 0.1 },
  { symbol: 'MSFT', name: 'Microsoft', emoji: '🪟', accent: '#00C8FF', mockBasePrice: 505, mockVolatility: 0.18, mockDrift: 0.12 },
  { symbol: 'NVDA', name: 'NVIDIA', emoji: '🚀', accent: '#2CFF9E', mockBasePrice: 182, mockVolatility: 0.45, mockDrift: 0.3 },
  { symbol: 'TSLA', name: 'Tesla', emoji: '⚡', accent: '#FF5C7A', mockBasePrice: 335, mockVolatility: 0.55, mockDrift: 0.15 },
  { symbol: 'AMZN', name: 'Amazon', emoji: '📦', accent: '#FFB020', mockBasePrice: 228, mockVolatility: 0.28, mockDrift: 0.12 },
  { symbol: 'GOOGL', name: 'Alphabet', emoji: '🔎', accent: '#7C5CFF', mockBasePrice: 202, mockVolatility: 0.25, mockDrift: 0.1 },
  { symbol: 'META', name: 'Meta', emoji: '🌀', accent: '#4D9FFF', mockBasePrice: 715, mockVolatility: 0.32, mockDrift: 0.18 },
  { symbol: 'NFLX', name: 'Netflix', emoji: '🍿', accent: '#FF4D6D', mockBasePrice: 1095, mockVolatility: 0.3, mockDrift: 0.15 },
  { symbol: 'AMD', name: 'AMD', emoji: '🔥', accent: '#FF8A5C', mockBasePrice: 168, mockVolatility: 0.45, mockDrift: 0.18 },
  { symbol: 'DIS', name: 'Disney', emoji: '🏰', accent: '#6EE7FF', mockBasePrice: 112, mockVolatility: 0.2, mockDrift: 0.04 },
  { symbol: 'COIN', name: 'Coinbase', emoji: '🪙', accent: '#F7C948', mockBasePrice: 305, mockVolatility: 0.7, mockDrift: 0.2 },
  { symbol: 'GME', name: 'GameStop', emoji: '🎮', accent: '#A3FF6E', mockBasePrice: 24, mockVolatility: 0.9, mockDrift: 0.05 },
]

const STOCK_MAP = new Map(STOCKS.map((s) => [s.symbol, s]))

export function stockMeta(symbol: string): StockMeta {
  return (
    STOCK_MAP.get(symbol) ?? {
      symbol,
      name: symbol,
      emoji: '📈',
      accent: '#7C5CFF',
      mockBasePrice: 100,
      mockVolatility: 0.3,
      mockDrift: 0.08,
    }
  )
}
