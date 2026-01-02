import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
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
  onUpdateLeg: (id: string, updates: Partial<OptionLeg>) => void;
  currentPrice: number;
}

export const PositionBuilder = ({ 
  instrument, 
  legs, 
  onAddLeg, 
  onRemoveLeg,
  onUpdateLeg,
  currentPrice 
}: PositionBuilderProps) => {
  const [optionType, setOptionType] = useState<OptionType>('call');
  const [side, setSide] = useState<PositionSide>('long');
  const [strike, setStrike] = useState<string>(currentPrice.toString());
  const [premium, setPremium] = useState<string>('5.00');
  const [quantity, setQuantity] = useState<string>('1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    strike: string;
    premium: string;
    quantity: string;
    optionType: OptionType;
    side: PositionSide;
  } | null>(null);

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

  const startEditing = (leg: OptionLeg) => {
    setEditingId(leg.id);
    setEditValues({
      strike: leg.strike.toString(),
      premium: leg.premium.toString(),
      quantity: leg.quantity.toString(),
      optionType: leg.optionType,
      side: leg.side,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const saveEditing = (id: string) => {
    if (editValues) {
      onUpdateLeg(id, {
        strike: parseFloat(editValues.strike),
        premium: parseFloat(editValues.premium),
        quantity: parseInt(editValues.quantity),
        optionType: editValues.optionType,
        side: editValues.side,
      });
    }
    setEditingId(null);
    setEditValues(null);
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
                <th className="data-cell text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {legs.map((leg) => {
                const isEditing = editingId === leg.id;
                const totalCost = leg.premium * leg.quantity * leg.instrument.multiplier;
                const isCredit = leg.side === 'short';
                
                if (isEditing && editValues) {
                  return (
                    <tr key={leg.id} className="border-t border-border bg-accent/30">
                      <td className="data-cell font-semibold">{leg.instrument.symbol}</td>
                      <td className="data-cell">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditValues({ ...editValues, optionType: 'call' })}
                            className={cn(
                              "px-2 py-0.5 text-xs rounded font-mono transition-colors",
                              editValues.optionType === 'call' 
                                ? "bg-call text-call-foreground" 
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            )}
                          >
                            C
                          </button>
                          <button
                            onClick={() => setEditValues({ ...editValues, optionType: 'put' })}
                            className={cn(
                              "px-2 py-0.5 text-xs rounded font-mono transition-colors",
                              editValues.optionType === 'put' 
                                ? "bg-put text-put-foreground" 
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            )}
                          >
                            P
                          </button>
                        </div>
                      </td>
                      <td className="data-cell">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditValues({ ...editValues, side: 'long' })}
                            className={cn(
                              "px-2 py-0.5 text-xs rounded font-mono transition-colors",
                              editValues.side === 'long' 
                                ? "bg-profit text-white" 
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            )}
                          >
                            L
                          </button>
                          <button
                            onClick={() => setEditValues({ ...editValues, side: 'short' })}
                            className={cn(
                              "px-2 py-0.5 text-xs rounded font-mono transition-colors",
                              editValues.side === 'short' 
                                ? "bg-loss text-white" 
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            )}
                          >
                            S
                          </button>
                        </div>
                      </td>
                      <td className="data-cell text-right">
                        <Input
                          type="number"
                          value={editValues.strike}
                          onChange={(e) => setEditValues({ ...editValues, strike: e.target.value })}
                          className="h-7 w-20 font-mono text-xs text-right ml-auto"
                        />
                      </td>
                      <td className="data-cell text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={editValues.premium}
                          onChange={(e) => setEditValues({ ...editValues, premium: e.target.value })}
                          className="h-7 w-16 font-mono text-xs text-right ml-auto"
                        />
                      </td>
                      <td className="data-cell text-right">
                        <Input
                          type="number"
                          min="1"
                          value={editValues.quantity}
                          onChange={(e) => setEditValues({ ...editValues, quantity: e.target.value })}
                          className="h-7 w-14 font-mono text-xs text-right ml-auto"
                        />
                      </td>
                      <td className="data-cell text-right text-muted-foreground">×{leg.instrument.multiplier}</td>
                      <td className="data-cell text-right text-muted-foreground">—</td>
                      <td className="data-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => saveEditing(leg.id)}
                            className="h-6 w-6 p-0 text-profit hover:text-profit hover:bg-profit/20"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-loss hover:bg-loss/20"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                
                return (
                  <tr 
                    key={leg.id} 
                    className="border-t border-border hover:bg-accent/30 transition-colors cursor-pointer group"
                    onDoubleClick={() => startEditing(leg)}
                  >
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
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); startEditing(leg); }}
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); onRemoveLeg(leg.id); }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-loss"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-3 py-2 bg-secondary/30 text-xs text-muted-foreground">
            💡 Double-click a row to edit, or hover for action buttons
          </div>
        </div>
      )}
    </div>
  );
};
