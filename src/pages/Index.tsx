import { useState, useCallback } from 'react';
import { BarChart3, Layers, Calculator } from 'lucide-react';
import { Instrument, OptionLeg, getInstrumentBySymbol } from '@/lib/instruments';
import { InstrumentSelector } from '@/components/InstrumentSelector';
import { PositionBuilder } from '@/components/PositionBuilder';
import { PayoffChart } from '@/components/PayoffChart';
import { PositionSummary } from '@/components/PositionSummary';
import { PriceSimulator } from '@/components/PriceSimulator';
import { MultiplierReference } from '@/components/MultiplierReference';

const DEFAULT_PRICES: Record<string, number> = {
  SPX: 5850,
  SPY: 585,
  XSP: 585,
  ES: 5850,
  MES: 5850,
  NDX: 20500,
  QQQ: 505,
  NQ: 20500,
  MNQ: 20500,
};

const Index = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(
    getInstrumentBySymbol('SPX') || null
  );
  const [legs, setLegs] = useState<OptionLeg[]>([]);
  const [currentPrice, setCurrentPrice] = useState(DEFAULT_PRICES['SPX']);
  const [simulatedPrice, setSimulatedPrice] = useState(DEFAULT_PRICES['SPX']);

  const handleInstrumentSelect = useCallback((instrument: Instrument) => {
    setSelectedInstrument(instrument);
    const defaultPrice = DEFAULT_PRICES[instrument.symbol] || 100;
    setCurrentPrice(defaultPrice);
    setSimulatedPrice(defaultPrice);
  }, []);

  const handleAddLeg = useCallback((leg: OptionLeg) => {
    setLegs((prev) => [...prev, leg]);
  }, []);

  const handleRemoveLeg = useCallback((id: string) => {
    setLegs((prev) => prev.filter((leg) => leg.id !== id));
  }, []);

  const handleResetSimulation = useCallback(() => {
    setSimulatedPrice(currentPrice);
  }, [currentPrice]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 terminal-glow">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Options Payoff Calculator</h1>
                <p className="text-xs text-muted-foreground">Multi-leg index options strategy analyzer</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Active Legs</p>
                <p className="font-mono font-bold text-foreground">{legs.length}</p>
              </div>
              {selectedInstrument && (
                <div className="px-3 py-2 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground">Selected</p>
                  <p className="font-mono font-bold text-primary">{selectedInstrument.symbol}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Instrument Selection */}
        <section className="bg-card border border-border rounded-xl p-6 animate-slide-in">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Select Instrument</h2>
          </div>
          <InstrumentSelector
            selectedInstrument={selectedInstrument}
            onSelect={handleInstrumentSelect}
          />
        </section>

        {/* Multiplier Reference */}
        <MultiplierReference />

        {/* Position Builder */}
        {selectedInstrument && (
          <section className="bg-card border border-border rounded-xl p-6 animate-slide-in">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Position Builder</h2>
              <span className="text-xs text-muted-foreground ml-2">
                ({selectedInstrument.symbol} × {selectedInstrument.multiplier})
              </span>
            </div>
            <PositionBuilder
              instrument={selectedInstrument}
              legs={legs}
              onAddLeg={handleAddLeg}
              onRemoveLeg={handleRemoveLeg}
              currentPrice={currentPrice}
            />
          </section>
        )}

        {/* Price Simulator */}
        <PriceSimulator
          currentPrice={currentPrice}
          simulatedPrice={simulatedPrice}
          onSimulatedPriceChange={setSimulatedPrice}
          onReset={handleResetSimulation}
        />

        {/* Position Summary */}
        <PositionSummary
          legs={legs}
          currentPrice={currentPrice}
          simulatedPrice={simulatedPrice}
        />

        {/* Payoff Chart */}
        <section className="bg-card border border-border rounded-xl p-6 animate-slide-in">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Payoff Diagram</h2>
          </div>
          <PayoffChart
            legs={legs}
            currentPrice={currentPrice}
            simulatedPrice={simulatedPrice}
          />
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Options trading involves significant risk. This calculator is for educational purposes only.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
