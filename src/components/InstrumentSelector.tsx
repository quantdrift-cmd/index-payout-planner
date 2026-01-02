import { useState } from 'react';
import { instruments, Instrument } from '@/lib/instruments';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InstrumentSelectorProps {
  selectedInstrument: Instrument | null;
  onSelect: (instrument: Instrument) => void;
}

export const InstrumentSelector = ({ selectedInstrument, onSelect }: InstrumentSelectorProps) => {
  const [activeFamily, setActiveFamily] = useState<'SPX' | 'NDX'>('SPX');
  
  const familyInstruments = instruments.filter(i => i.family === activeFamily);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={activeFamily === 'SPX' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setActiveFamily('SPX')}
          className="font-mono"
        >
          SPX Family
        </Button>
        <Button
          variant={activeFamily === 'NDX' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setActiveFamily('NDX')}
          className="font-mono"
        >
          NDX Family
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {familyInstruments.map((instrument) => (
          <button
            key={instrument.symbol}
            onClick={() => onSelect(instrument)}
            className={cn(
              "p-3 rounded-lg border text-left transition-all duration-200",
              "hover:border-primary/50 hover:bg-accent",
              selectedInstrument?.symbol === instrument.symbol
                ? "border-primary bg-primary/10 terminal-glow"
                : "border-border bg-card"
            )}
          >
            <div className="font-mono font-semibold text-foreground">
              {instrument.symbol}
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {instrument.name}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                instrument.type === 'index' && "bg-primary/20 text-primary",
                instrument.type === 'etf' && "bg-chart-3/20 text-chart-3",
                instrument.type === 'future' && "bg-chart-4/20 text-chart-4",
                instrument.type === 'micro-future' && "bg-chart-5/20 text-chart-5"
              )}>
                {instrument.type.toUpperCase()}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                ×{instrument.multiplier}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
