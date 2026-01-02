import { instruments } from '@/lib/instruments';
import { cn } from '@/lib/utils';

export const MultiplierReference = () => {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Contract Multipliers</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {instruments.map((instrument) => (
          <div
            key={instrument.symbol}
            className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-md"
          >
            <span className="font-mono text-sm font-semibold text-foreground">
              {instrument.symbol}
            </span>
            <span className={cn(
              "text-xs font-mono px-2 py-0.5 rounded",
              instrument.type === 'index' && "bg-primary/20 text-primary",
              instrument.type === 'etf' && "bg-chart-3/20 text-chart-3",
              instrument.type === 'future' && "bg-chart-4/20 text-chart-4",
              instrument.type === 'micro-future' && "bg-chart-5/20 text-chart-5"
            )}>
              ×{instrument.multiplier}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Multiplier determines dollar value per point movement. E.g., 1 SPX option = $100 per point.
      </p>
    </div>
  );
};
