export interface NewsTemplate {
  headline: string
  sentiment: 'bullish' | 'watch'
}

/** {name} and {symbol} are replaced with the stock's values. */
export const NEWS_TEMPLATES: NewsTemplate[] = [
  { headline: '{name} crushes earnings expectations as revenue tops forecasts', sentiment: 'bullish' },
  { headline: 'Analysts turn bullish on {symbol} after product roadmap reveal', sentiment: 'bullish' },
  { headline: '{name} announces expanded buyback program, shares react', sentiment: 'bullish' },
  { headline: 'Institutional buyers quietly add to {symbol} positions, filings show', sentiment: 'bullish' },
  { headline: '{name} unveils AI push that could reshape its core business', sentiment: 'bullish' },
  { headline: 'Retail traders pile into {symbol} as momentum builds', sentiment: 'bullish' },
  { headline: '{name} lands major partnership, analysts raise price targets', sentiment: 'bullish' },
  { headline: 'Options activity in {symbol} hits a monthly high', sentiment: 'watch' },
  { headline: '{name} CEO teases "biggest launch yet" at annual event', sentiment: 'bullish' },
  { headline: 'What Wall Street is watching in {symbol} this week', sentiment: 'watch' },
  { headline: '{name} margins in focus ahead of next earnings call', sentiment: 'watch' },
  { headline: 'Supply chain update: what it means for {name}', sentiment: 'watch' },
  { headline: '{symbol} added to two momentum-focused index funds', sentiment: 'bullish' },
  { headline: 'Insiders hold steady as {name} volatility picks up', sentiment: 'watch' },
  { headline: '{name} expands into new markets with international rollout', sentiment: 'bullish' },
  { headline: 'The bull case for {symbol}, in three charts', sentiment: 'bullish' },
  { headline: 'Regulators circle sector as {name} stays confident', sentiment: 'watch' },
  { headline: '{name} beats on subscribers, guidance steady', sentiment: 'bullish' },
  { headline: 'Fund managers debate whether {symbol} rally has room to run', sentiment: 'watch' },
  { headline: '{name} doubles down on developer ecosystem', sentiment: 'bullish' },
]

export const NEWS_SOURCES = [
  'MarketWatch',
  'Bloomberg',
  'Reuters',
  'TheStreet',
  'Benzinga',
  "Barron's",
  'CNBC',
  'Seeking Alpha',
]
