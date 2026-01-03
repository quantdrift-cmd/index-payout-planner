import { getStrikeIntervalForPrice } from './instruments';

export interface Stock {
  symbol: string;
  name: string;
  type: 'stock';
  multiplier: number;
  tickSize: number;
  strikeInterval: number;
  price?: number; // Approximate price for strike interval calculation
}

export interface StockGroup {
  id: string;
  name: string;
  stocks: Stock[];
}

// Known strike intervals for popular stocks (based on typical trading prices)
const knownStrikeIntervals: Record<string, number> = {
  'AAPL': 2.5,    // ~$175-200
  'TSLA': 2.5,   // ~$200-300
  'GOOGL': 2.5,  // ~$140-180
  'MSFT': 2.5,   // ~$400
  'AMZN': 2.5,   // ~$180-200
  'NVDA': 2.5,   // ~$500+
  'META': 2.5,   // ~$500+
  'AMD': 1,      // ~$120-150
  'INTC': 0.5,   // ~$20-30
  'F': 0.5,      // ~$10-15
  'GM': 0.5,     // ~$35-45
  'RIVN': 0.5,   // ~$10-15
  'JPM': 1,      // ~$200
  'BAC': 0.5,    // ~$35-45
  'GS': 2.5,     // ~$400-500
  'MS': 1,       // ~$90-100
  'TSM': 2.5,    // ~$150-180
};

// Get strike interval for a stock
export const getStockStrikeInterval = (symbol: string, price?: number): number => {
  // Use known interval if available
  if (knownStrikeIntervals[symbol]) {
    return knownStrikeIntervals[symbol];
  }
  // Otherwise calculate based on price
  return getStrikeIntervalForPrice(price || 100);
};

// Popular stocks to show initially
export const popularStocks: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 1 },
];

// Preset stock groups
export const defaultStockGroups: StockGroup[] = [
  {
    id: 'tech',
    name: 'Tech Giants',
    stocks: [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
    ],
  },
  {
    id: 'ev',
    name: 'EV & Auto',
    stocks: [
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
      { symbol: 'RIVN', name: 'Rivian Automotive', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 0.5 },
      { symbol: 'F', name: 'Ford Motor Co.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 0.5 },
      { symbol: 'GM', name: 'General Motors', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 0.5 },
    ],
  },
  {
    id: 'semiconductors',
    name: 'Semiconductors',
    stocks: [
      { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
      { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 1 },
      { symbol: 'INTC', name: 'Intel Corp.', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 0.5 },
      { symbol: 'TSM', name: 'Taiwan Semiconductor', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
    ],
  },
  {
    id: 'finance',
    name: 'Financials',
    stocks: [
      { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 1 },
      { symbol: 'BAC', name: 'Bank of America', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 0.5 },
      { symbol: 'GS', name: 'Goldman Sachs', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 2.5 },
      { symbol: 'MS', name: 'Morgan Stanley', type: 'stock', multiplier: 100, tickSize: 0.01, strikeInterval: 1 },
    ],
  },
];

// Stock search function using a public API
export const searchStocks = async (query: string): Promise<Stock[]> => {
  if (!query || query.length < 1) return [];
  
  try {
    // Using Yahoo Finance autocomplete API (public, no key required)
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`
    );
    
    if (!response.ok) {
      // Fallback to filtered popular stocks
      return popularStocks.filter(
        s => s.symbol.toLowerCase().includes(query.toLowerCase()) ||
             s.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    const data = await response.json();
    const quotes = data.quotes || [];
    
    return quotes
      .filter((q: any) => q.quoteType === 'EQUITY' && q.symbol && q.shortname)
      .slice(0, 10)
      .map((q: any): Stock => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: 'stock',
        multiplier: 100,
        tickSize: 0.01,
        strikeInterval: getStockStrikeInterval(q.symbol),
      }));
  } catch (error) {
    console.error('Stock search error:', error);
    // Fallback to filtered popular stocks
    return popularStocks.filter(
      s => s.symbol.toLowerCase().includes(query.toLowerCase()) ||
           s.name.toLowerCase().includes(query.toLowerCase())
    );
  }
};

export const createStock = (symbol: string, name: string, price?: number): Stock => ({
  symbol: symbol.toUpperCase(),
  name,
  type: 'stock',
  multiplier: 100,
  tickSize: 0.01,
  strikeInterval: getStockStrikeInterval(symbol, price),
});
