export interface Instrument {
  symbol: string;
  name: string;
  family?: 'SPX' | 'NDX';
  type: 'index' | 'etf' | 'future' | 'micro-future' | 'stock';
  multiplier: number;
  tickSize: number;
  strikeInterval: number; // Strike price interval (e.g., 5 for SPX, 1 for SPY)
}

export const instruments: Instrument[] = [
  // SPX Family
  { symbol: 'SPX', name: 'S&P 500 Index', family: 'SPX', type: 'index', multiplier: 100, tickSize: 0.01, strikeInterval: 5 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', family: 'SPX', type: 'etf', multiplier: 100, tickSize: 0.01, strikeInterval: 1 },
  { symbol: 'XSP', name: 'Mini-SPX Index', family: 'SPX', type: 'index', multiplier: 100, tickSize: 0.01, strikeInterval: 1 },
  { symbol: 'ES', name: 'E-mini S&P 500 Future', family: 'SPX', type: 'future', multiplier: 50, tickSize: 0.25, strikeInterval: 5 },
  { symbol: 'MES', name: 'Micro E-mini S&P 500', family: 'SPX', type: 'micro-future', multiplier: 5, tickSize: 0.25, strikeInterval: 5 },
  
  // NDX Family
  { symbol: 'NDX', name: 'Nasdaq 100 Index', family: 'NDX', type: 'index', multiplier: 100, tickSize: 0.01, strikeInterval: 25 },
  { symbol: 'QQQ', name: 'Invesco QQQ ETF', family: 'NDX', type: 'etf', multiplier: 100, tickSize: 0.01, strikeInterval: 1 },
  { symbol: 'NQ', name: 'E-mini Nasdaq 100 Future', family: 'NDX', type: 'future', multiplier: 20, tickSize: 0.25, strikeInterval: 25 },
  { symbol: 'MNQ', name: 'Micro E-mini Nasdaq 100', family: 'NDX', type: 'micro-future', multiplier: 2, tickSize: 0.25, strikeInterval: 25 },
];

// Calculate strike interval based on underlying price (CBOE standard rules)
export const getStrikeIntervalForPrice = (price: number): number => {
  if (price < 25) return 0.5;
  if (price < 200) return 1;
  if (price < 500) return 2.5;
  if (price < 1000) return 5;
  if (price < 5000) return 10;
  return 25;
};

// Round strike to nearest valid strike based on interval
export const roundToStrike = (price: number, strikeInterval: number): number => {
  return Math.round(price / strikeInterval) * strikeInterval;
};

// Generate nearby strikes for a given price
export const generateNearbyStrikes = (
  currentPrice: number, 
  strikeInterval: number, 
  count: number = 10
): number[] => {
  const atm = roundToStrike(currentPrice, strikeInterval);
  const strikes: number[] = [];
  
  for (let i = -count; i <= count; i++) {
    strikes.push(atm + (i * strikeInterval));
  }
  
  return strikes.filter(s => s > 0);
};

export const getInstrumentBySymbol = (symbol: string): Instrument | undefined => {
  return instruments.find(i => i.symbol === symbol);
};

export const getInstrumentsByFamily = (family: 'SPX' | 'NDX'): Instrument[] => {
  return instruments.filter(i => i.family === family);
};

export type OptionType = 'call' | 'put';
export type PositionSide = 'long' | 'short';

export interface OptionLeg {
  id: string;
  instrument: Instrument;
  optionType: OptionType;
  side: PositionSide;
  strike: number;
  premium: number;
  quantity: number;
  expiration?: string;
}

export interface PayoffPoint {
  price: number;
  pnl: number;
}

export const calculateLegPayoff = (leg: OptionLeg, underlyingPrice: number): number => {
  const { optionType, side, strike, premium, quantity, instrument } = leg;
  const multiplier = instrument.multiplier;
  
  let intrinsicValue = 0;
  
  if (optionType === 'call') {
    intrinsicValue = Math.max(0, underlyingPrice - strike);
  } else {
    intrinsicValue = Math.max(0, strike - underlyingPrice);
  }
  
  const optionValue = intrinsicValue - premium;
  const positionPnL = side === 'long' ? optionValue : -optionValue;
  
  return positionPnL * quantity * multiplier;
};

export const calculateTotalPayoff = (legs: OptionLeg[], underlyingPrice: number): number => {
  return legs.reduce((total, leg) => total + calculateLegPayoff(leg, underlyingPrice), 0);
};

export const generatePayoffCurve = (legs: OptionLeg[], currentPrice: number, range: number = 0.15): PayoffPoint[] => {
  const points: PayoffPoint[] = [];
  const minPrice = currentPrice * (1 - range);
  const maxPrice = currentPrice * (1 + range);
  const step = (maxPrice - minPrice) / 100;
  
  for (let price = minPrice; price <= maxPrice; price += step) {
    points.push({
      price: Math.round(price * 100) / 100,
      pnl: Math.round(calculateTotalPayoff(legs, price) * 100) / 100,
    });
  }
  
  return points;
};

export const calculateBreakevens = (legs: OptionLeg[], currentPrice: number): number[] => {
  const payoffCurve = generatePayoffCurve(legs, currentPrice, 0.3);
  const breakevens: number[] = [];
  
  for (let i = 1; i < payoffCurve.length; i++) {
    const prev = payoffCurve[i - 1];
    const curr = payoffCurve[i];
    
    if ((prev.pnl < 0 && curr.pnl >= 0) || (prev.pnl >= 0 && curr.pnl < 0)) {
      // Linear interpolation to find exact breakeven
      const ratio = Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(curr.pnl));
      const breakeven = prev.price + ratio * (curr.price - prev.price);
      breakevens.push(Math.round(breakeven * 100) / 100);
    }
  }
  
  return breakevens;
};

export const calculateMaxProfit = (legs: OptionLeg[], currentPrice: number): number | 'unlimited' => {
  const payoffCurve = generatePayoffCurve(legs, currentPrice, 0.5);
  const maxPnL = Math.max(...payoffCurve.map(p => p.pnl));
  
  // Check if profit continues to increase at edges
  const lastPoints = payoffCurve.slice(-5);
  const isIncreasing = lastPoints.every((p, i) => i === 0 || p.pnl >= lastPoints[i - 1].pnl);
  
  if (isIncreasing && maxPnL > 0) {
    return 'unlimited';
  }
  
  return maxPnL;
};

export const calculateMaxLoss = (legs: OptionLeg[], currentPrice: number): number | 'unlimited' => {
  const payoffCurve = generatePayoffCurve(legs, currentPrice, 0.5);
  const minPnL = Math.min(...payoffCurve.map(p => p.pnl));
  
  // Check if loss continues to increase at edges
  const firstPoints = payoffCurve.slice(0, 5);
  const isDecreasing = firstPoints.every((p, i) => i === 0 || p.pnl <= firstPoints[i - 1].pnl);
  
  if (isDecreasing && minPnL < 0) {
    return 'unlimited';
  }
  
  return minPnL;
};

// Margin calculation for options positions
// Uses standard Reg-T margin rules as approximation
export const calculateMarginRequirement = (legs: OptionLeg[], currentPrice: number): { 
  margin: number; 
  marginType: 'cash-secured' | 'spread' | 'naked' | 'long-only';
  breakdown: { description: string; amount: number }[];
} => {
  if (legs.length === 0) {
    return { margin: 0, marginType: 'long-only', breakdown: [] };
  }

  const breakdown: { description: string; amount: number }[] = [];
  let totalMargin = 0;
  let marginType: 'cash-secured' | 'spread' | 'naked' | 'long-only' = 'long-only';

  const shortLegs = legs.filter(l => l.side === 'short');
  const longLegs = legs.filter(l => l.side === 'long');

  // If all legs are long, margin = total premium paid
  if (shortLegs.length === 0) {
    const longPremium = longLegs.reduce((sum, leg) => {
      return sum + (leg.premium * leg.quantity * leg.instrument.multiplier);
    }, 0);
    breakdown.push({ description: 'Long options (premium paid)', amount: longPremium });
    return { margin: longPremium, marginType: 'long-only', breakdown };
  }

  // Check for spreads (matched short + long at same quantity)
  const processedShorts = new Set<string>();
  const processedLongs = new Set<string>();

  // Try to pair spreads
  for (const shortLeg of shortLegs) {
    if (processedShorts.has(shortLeg.id)) continue;

    // Find matching long leg (same type, instrument family)
    const matchingLong = longLegs.find(l => 
      !processedLongs.has(l.id) &&
      l.optionType === shortLeg.optionType &&
      l.instrument.family === shortLeg.instrument.family &&
      l.quantity === shortLeg.quantity
    );

    if (matchingLong) {
      // Vertical spread - margin = width of strikes
      const strikeWidth = Math.abs(shortLeg.strike - matchingLong.strike);
      const spreadMargin = strikeWidth * shortLeg.quantity * shortLeg.instrument.multiplier;
      
      breakdown.push({ 
        description: `${shortLeg.optionType.toUpperCase()} spread (${shortLeg.strike}/${matchingLong.strike})`, 
        amount: spreadMargin 
      });
      totalMargin += spreadMargin;
      marginType = 'spread';
      
      processedShorts.add(shortLeg.id);
      processedLongs.add(matchingLong.id);
    }
  }

  // Process remaining naked shorts
  for (const shortLeg of shortLegs) {
    if (processedShorts.has(shortLeg.id)) continue;

    const { instrument, optionType, strike, premium, quantity } = shortLeg;
    const multiplier = instrument.multiplier;

    // Naked option margin formula (simplified Reg-T):
    // Max of: (20% of underlying + premium - OTM amount) or (10% of strike + premium)
    const underlyingValue = currentPrice * multiplier * quantity;
    const premiumValue = premium * multiplier * quantity;
    
    let otmAmount = 0;
    if (optionType === 'call' && strike > currentPrice) {
      otmAmount = (strike - currentPrice) * multiplier * quantity;
    } else if (optionType === 'put' && strike < currentPrice) {
      otmAmount = (currentPrice - strike) * multiplier * quantity;
    }

    const method1 = (underlyingValue * 0.20) + premiumValue - otmAmount;
    const method2 = (strike * multiplier * quantity * 0.10) + premiumValue;
    const nakedMargin = Math.max(method1, method2);

    breakdown.push({ 
      description: `Naked ${optionType} ${instrument.symbol} ${strike}`, 
      amount: nakedMargin 
    });
    totalMargin += nakedMargin;
    marginType = 'naked';
  }

  // Add remaining long positions (just premium)
  for (const longLeg of longLegs) {
    if (processedLongs.has(longLeg.id)) continue;

    const longPremium = longLeg.premium * longLeg.quantity * longLeg.instrument.multiplier;
    breakdown.push({ 
      description: `Long ${longLeg.optionType} ${longLeg.instrument.symbol} ${longLeg.strike}`, 
      amount: longPremium 
    });
    totalMargin += longPremium;
  }

  return { margin: Math.round(totalMargin * 100) / 100, marginType, breakdown };
};
