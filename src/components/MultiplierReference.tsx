import { instruments } from '@/lib/instruments';
import { popularStocks } from '@/lib/stocks';
import { cn } from '@/lib/utils';

interface MultiplierReferenceProps {
  activeTab: 'indices' | 'stocks';
}

export const MultiplierReference = ({ activeTab }: MultiplierReferenceProps) => {
  const displayItems = activeTab === 'stocks' ? popularStocks : instruments;
  
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Contract Multipliers</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {displayItems.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-md"
          >
            <span className="font-mono text-sm font-semibold text-foreground">
              {item.symbol}
            </span>
            <span className={cn(
              "text-xs font-mono px-2 py-0.5 rounded",
              item.type === 'index' && "bg-primary/20 text-primary",
              item.type === 'etf' && "bg-chart-3/20 text-chart-3",
              item.type === 'future' && "bg-chart-4/20 text-chart-4",
              item.type === 'micro-future' && "bg-chart-5/20 text-chart-5",
              item.type === 'stock' && "bg-chart-2/20 text-chart-2"
            )}>
              ×{item.multiplier}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        {activeTab === 'stocks' 
          ? "All stock options have a standard multiplier of 100 (1 contract = 100 shares)."
          : "Multiplier determines dollar value per point movement. E.g., 1 SPX option = $100 per point."}
      </p>
    </div>
  );
};
