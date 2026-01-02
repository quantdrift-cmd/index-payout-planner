import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface PriceSimulatorProps {
  currentPrice: number;
  simulatedPrice: number;
  onSimulatedPriceChange: (price: number) => void;
  onReset: () => void;
}

export const PriceSimulator = ({
  currentPrice,
  simulatedPrice,
  onSimulatedPriceChange,
  onReset,
}: PriceSimulatorProps) => {
  const minPrice = currentPrice * 0.85;
  const maxPrice = currentPrice * 1.15;
  
  const percentChange = ((simulatedPrice - currentPrice) / currentPrice) * 100;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Price Simulator</h3>
          <p className="text-xs text-muted-foreground">Drag to simulate underlying movement</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="h-8">
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Slider
            value={[simulatedPrice]}
            onValueChange={([value]) => onSimulatedPriceChange(value)}
            min={minPrice}
            max={maxPrice}
            step={0.25}
            className="w-full"
          />
        </div>
        <Input
          type="number"
          value={simulatedPrice.toFixed(2)}
          onChange={(e) => onSimulatedPriceChange(parseFloat(e.target.value) || currentPrice)}
          className="w-28 font-mono text-sm"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>-15% (${minPrice.toFixed(2)})</span>
        <span className={percentChange >= 0 ? "text-profit" : "text-loss"}>
          {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
        </span>
        <span>+15% (${maxPrice.toFixed(2)})</span>
      </div>
    </div>
  );
};
