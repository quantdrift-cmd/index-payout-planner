import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Instrument, OptionLeg, OptionType, PositionSide } from '@/lib/instruments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PositionBuilderProps {
  instrument: Instrument;
  legs: OptionLeg[];
  onAddLeg: (leg: OptionLeg) => void;
  onRemoveLeg: (id: string) => void;
  currentPrice: number;
}

export const PositionBuilder = ({ 
  instrument, 
  legs, 
  onAddLeg, 
  onRemoveLeg,
  currentPrice 
}: PositionBuilderProps) => {
  const [optionType, setOptionType] = useState<OptionType>('call');
  const [side, setSide] = useState<PositionSide>('long');
  const [strike, setStrike] = useState<string>(currentPrice.toString());
  const [premium, setPremium] = useState<string>('5.00');
  const [quantity, setQuantity] = useState<string>('1');

  const handleAddLeg = () => {
    const newLeg: OptionLeg = {
      id: `leg-${Date.now()}`,
      instrument,
      optionType,
      side,
      strike: parseFloat(strike),
      premium: parseFloat(premium),
      quantity: parseInt(quantity),
    };
    onAddLeg(newLeg);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Option Type */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={optionType === 'call' ? 'default' : 'secondary'}
              onClick={() => setOptionType('call')}
              className={cn(
                "flex-1 font-mono text-xs",
                optionType === 'call' && "bg-call hover:bg-call/90"
              )}
            >
              CALL
            </Button>
            <Button
              size="sm"
              variant={optionType === 'put' ? 'default' : 'secondary'}
              onClick={() => setOptionType('put')}
              className={cn(
                "flex-1 font-mono text-xs",
                optionType === 'put' && "bg-put hover:bg-put/90"
              )}
            >
              PUT
            </Button>
          </div>
        </div>

        {/* Side */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Side</Label>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={side === 'long' ? 'default' : 'secondary'}
              onClick={() => setSide('long')}
              className={cn(
                "flex-1 font-mono text-xs",
                side === 'long' && "bg-profit hover:bg-profit/90"
              )}
            >
              LONG
            </Button>
            <Button
              size="sm"
              variant={side === 'short' ? 'default' : 'secondary'}
              onClick={() => setSide('short')}
              className={cn(
                "flex-1 font-mono text-xs",
                side === 'short' && "bg-loss hover:bg-loss/90"
              )}
            >
              SHORT
            </Button>
          </div>
        </div>

        {/* Strike */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Strike</Label>
          <Input
            type="number"
            value={strike}
            onChange={(e) => setStrike(e.target.value)}
            className="font-mono text-sm h-9"
          />
        </div>

        {/* Premium */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Premium</Label>
          <Input
            type="number"
            step="0.01"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
            className="font-mono text-sm h-9"
          />
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Qty</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="font-mono text-sm h-9"
            />
            <Button size="sm" onClick={handleAddLeg} className="h-9 px-3">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legs Table */}
      {legs.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-muted-foreground text-xs">
                <th className="data-cell text-left">Symbol</th>
                <th className="data-cell text-left">Type</th>
                <th className="data-cell text-left">Side</th>
                <th className="data-cell text-right">Strike</th>
                <th className="data-cell text-right">Premium</th>
                <th className="data-cell text-right">Qty</th>
                <th className="data-cell text-right">Mult</th>
                <th className="data-cell text-right">Cost/Credit</th>
                <th className="data-cell text-center"></th>
              </tr>
            </thead>
            <tbody>
              {legs.map((leg) => {
                const totalCost = leg.premium * leg.quantity * leg.instrument.multiplier;
                const isCredit = leg.side === 'short';
                
                return (
                  <tr key={leg.id} className="border-t border-border hover:bg-accent/30 transition-colors">
                    <td className="data-cell font-semibold">{leg.instrument.symbol}</td>
                    <td className={cn(
                      "data-cell font-semibold",
                      leg.optionType === 'call' ? "text-call" : "text-put"
                    )}>
                      {leg.optionType.toUpperCase()}
                    </td>
                    <td className={cn(
                      "data-cell",
                      leg.side === 'long' ? "text-profit" : "text-loss"
                    )}>
                      {leg.side.toUpperCase()}
                    </td>
                    <td className="data-cell text-right">${leg.strike.toFixed(2)}</td>
                    <td className="data-cell text-right">${leg.premium.toFixed(2)}</td>
                    <td className="data-cell text-right">{leg.quantity}</td>
                    <td className="data-cell text-right text-muted-foreground">×{leg.instrument.multiplier}</td>
                    <td className={cn(
                      "data-cell text-right font-semibold",
                      isCredit ? "text-profit" : "text-loss"
                    )}>
                      {isCredit ? '+' : '-'}${totalCost.toLocaleString()}
                    </td>
                    <td className="data-cell text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveLeg(leg.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-loss"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
