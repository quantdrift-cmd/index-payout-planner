export interface Stock {
  symbol: string;
  name: string;
  type: 'stock';
  multiplier: number;
  tickSize: number;
}

export interface StockGroup {
  id: string;
  name: string;
  stocks: Stock[];
}

// Popular stocks to show initially
export const popularStocks: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', multiplier: 100, tickSize: 0.01 },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', multiplier: 100, tickSize: 0.01 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', multiplier: 100, tickSize: 0.01 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', multiplier: 100, tickSize: 0.01 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', multiplier: 100, tickSize: 0.01 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', multiplier: 100, tickSize: 0.01 },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', multiplier: 100, tickSize: 0.01 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', multiplier: 100, tickSize: 0.01 },
];

// Preset stock groups
export const defaultStockGroups: StockGroup[] = [
  {
    id: 'tech',
    name: 'Tech Giants',
    stocks: [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', multiplier: 100, tickSize: 0.01 },
    ],
  },
  {
    id: 'ev',
    name: 'EV & Auto',
    stocks: [
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'RIVN', name: 'Rivian Automotive', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'F', name: 'Ford Motor Co.', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'GM', name: 'General Motors', type: 'stock', multiplier: 100, tickSize: 0.01 },
    ],
  },
  {
    id: 'semiconductors',
    name: 'Semiconductors',
    stocks: [
      { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'INTC', name: 'Intel Corp.', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'TSM', name: 'Taiwan Semiconductor', type: 'stock', multiplier: 100, tickSize: 0.01 },
    ],
  },
  {
    id: 'finance',
    name: 'Financials',
    stocks: [
      { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'BAC', name: 'Bank of America', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'GS', name: 'Goldman Sachs', type: 'stock', multiplier: 100, tickSize: 0.01 },
      { symbol: 'MS', name: 'Morgan Stanley', type: 'stock', multiplier: 100, tickSize: 0.01 },
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

export const createStock = (symbol: string, name: string): Stock => ({
  symbol: symbol.toUpperCase(),
  name,
  type: 'stock',
  multiplier: 100,
  tickSize: 0.01,
});
