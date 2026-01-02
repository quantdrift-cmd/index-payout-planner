export interface Instrument {
  symbol: string;
  name: string;
  family: 'SPX' | 'NDX';
  type: 'index' | 'etf' | 'future' | 'micro-future';
  multiplier: number;
  tickSize: number;
}

export const instruments: Instrument[] = [
  // SPX Family
  { symbol: 'SPX', name: 'S&P 500 Index', family: 'SPX', type: 'index', multiplier: 100, tickSize: 0.01 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', family: 'SPX', type: 'etf', multiplier: 100, tickSize: 0.01 },
  { symbol: 'XSP', name: 'Mini-SPX Index', family: 'SPX', type: 'index', multiplier: 100, tickSize: 0.01 },
  { symbol: 'ES', name: 'E-mini S&P 500 Future', family: 'SPX', type: 'future', multiplier: 50, tickSize: 0.25 },
  { symbol: 'MES', name: 'Micro E-mini S&P 500', family: 'SPX', type: 'micro-future', multiplier: 5, tickSize: 0.25 },
  
  // NDX Family
  { symbol: 'NDX', name: 'Nasdaq 100 Index', family: 'NDX', type: 'index', multiplier: 100, tickSize: 0.01 },
  { symbol: 'QQQ', name: 'Invesco QQQ ETF', family: 'NDX', type: 'etf', multiplier: 100, tickSize: 0.01 },
  { symbol: 'NQ', name: 'E-mini Nasdaq 100 Future', family: 'NDX', type: 'future', multiplier: 20, tickSize: 0.25 },
  { symbol: 'MNQ', name: 'Micro E-mini Nasdaq 100', family: 'NDX', type: 'micro-future', multiplier: 2, tickSize: 0.25 },
];

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
