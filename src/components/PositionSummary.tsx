import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { 
  OptionLeg, 
  calculateTotalPayoff, 
  calculateBreakevens,
  calculateMaxProfit,
  calculateMaxLoss 
} from '@/lib/instruments';
import { cn } from '@/lib/utils';

interface PositionSummaryProps {
  legs: OptionLeg[];
  currentPrice: number;
  simulatedPrice: number;
}

export const PositionSummary = ({ legs, currentPrice, simulatedPrice }: PositionSummaryProps) => {
  const stats = useMemo(() => {
    if (legs.length === 0) return null;

    const currentPnL = calculateTotalPayoff(legs, currentPrice);
    const simulatedPnL = calculateTotalPayoff(legs, simulatedPrice);
    const breakevens = calculateBreakevens(legs, currentPrice);
    const maxProfit = calculateMaxProfit(legs, currentPrice);
    const maxLoss = calculateMaxLoss(legs, currentPrice);

    // Calculate total cost/credit
    const totalPremium = legs.reduce((sum, leg) => {
      const legCost = leg.premium * leg.quantity * leg.instrument.multiplier;
      return sum + (leg.side === 'long' ? -legCost : legCost);
    }, 0);

    return {
      currentPnL,
      simulatedPnL,
      breakevens,
      maxProfit,
      maxLoss,
      totalPremium,
    };
  }, [legs, currentPrice, simulatedPrice]);

  if (!stats || legs.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <div className="h-16 flex items-center justify-center text-muted-foreground text-sm">
              No position
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatValue = (value: number | 'unlimited') => {
    if (value === 'unlimited') return '∞';
    return `$${Math.abs(value).toLocaleString()}`;
  };

  const priceChange = simulatedPrice - currentPrice;
  const priceChangePercent = ((priceChange / currentPrice) * 100).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Price Movement Indicator */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Simulated Price Movement</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-foreground">
                ${simulatedPrice.toFixed(2)}
              </span>
              <span className={cn(
                "font-mono text-sm px-2 py-1 rounded",
                priceChange >= 0 ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"
              )}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent}%)
              </span>
            </div>
          </div>
          <div className={cn(
            "text-4xl font-mono font-bold",
            stats.simulatedPnL >= 0 ? "text-profit profit-glow" : "text-loss loss-glow"
          )}>
            {stats.simulatedPnL >= 0 ? '+' : ''}${stats.simulatedPnL.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Max Profit */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4 text-profit" />
            <span className="text-xs">Max Profit</span>
          </div>
          <p className={cn(
            "font-mono text-xl font-bold",
            stats.maxProfit === 'unlimited' || stats.maxProfit > 0 ? "text-profit" : "text-muted-foreground"
          )}>
            {stats.maxProfit === 'unlimited' ? (
              <span className="flex items-center gap-1">
                <span>Unlimited</span>
                <TrendingUp className="h-4 w-4" />
              </span>
            ) : (
              formatValue(stats.maxProfit)
            )}
          </p>
        </div>

        {/* Max Loss */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingDown className="h-4 w-4 text-loss" />
            <span className="text-xs">Max Loss</span>
          </div>
          <p className={cn(
            "font-mono text-xl font-bold",
            stats.maxLoss === 'unlimited' ? "text-loss" : "text-loss"
          )}>
            {stats.maxLoss === 'unlimited' ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Unlimited</span>
              </span>
            ) : (
              `-${formatValue(stats.maxLoss)}`
            )}
          </p>
        </div>

        {/* Breakeven(s) */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs">Breakeven{stats.breakevens.length > 1 ? 's' : ''}</span>
          </div>
          <div className="font-mono text-xl font-bold text-foreground">
            {stats.breakevens.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.breakevens.map((be, i) => (
                  <span key={i}>${be.toFixed(2)}</span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {/* Net Premium */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <span className="text-xs">Net Premium</span>
          </div>
          <p className={cn(
            "font-mono text-xl font-bold",
            stats.totalPremium >= 0 ? "text-profit" : "text-loss"
          )}>
            {stats.totalPremium >= 0 ? '+' : ''}${stats.totalPremium.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalPremium >= 0 ? 'Credit received' : 'Debit paid'}
          </p>
        </div>
      </div>
    </div>
  );
};
