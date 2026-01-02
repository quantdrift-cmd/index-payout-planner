import { useMemo, useState, useRef, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, ReferenceArea } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptionLeg, generatePayoffCurve, PayoffPoint } from '@/lib/instruments';
import { cn } from '@/lib/utils';

interface PayoffChartProps {
  legs: OptionLeg[];
  currentPrice: number;
  simulatedPrice: number;
}

interface ZoomState {
  minPrice: number;
  maxPrice: number;
}

export const PayoffChart = ({ legs, currentPrice, simulatedPrice }: PayoffChartProps) => {
  const [zoomState, setZoomState] = useState<ZoomState | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const zoomHistory = useRef<ZoomState[]>([]);

  // Generate data for the full range or current zoom
  const payoffData = useMemo(() => {
    if (legs.length === 0) return [];
    
    if (zoomState) {
      const range = (zoomState.maxPrice - zoomState.minPrice) / 2;
      const center = (zoomState.maxPrice + zoomState.minPrice) / 2;
      const rangePercent = range / center;
      
      const points: PayoffPoint[] = [];
      const step = (zoomState.maxPrice - zoomState.minPrice) / 100;
      
      for (let price = zoomState.minPrice; price <= zoomState.maxPrice; price += step) {
        const pnl = legs.reduce((total, leg) => {
          const { optionType, side, strike, premium, quantity, instrument } = leg;
          const multiplier = instrument.multiplier;
          
          let intrinsicValue = 0;
          if (optionType === 'call') {
            intrinsicValue = Math.max(0, price - strike);
          } else {
            intrinsicValue = Math.max(0, strike - price);
          }
          
          const optionValue = intrinsicValue - premium;
          const positionPnL = side === 'long' ? optionValue : -optionValue;
          
          return total + positionPnL * quantity * multiplier;
        }, 0);
        
        points.push({
          price: Math.round(price * 100) / 100,
          pnl: Math.round(pnl * 100) / 100,
        });
      }
      
      return points;
    }
    
    return generatePayoffCurve(legs, currentPrice, 0.15);
  }, [legs, currentPrice, zoomState]);

  const maxPnL = useMemo(() => Math.max(...payoffData.map(d => d.pnl), 0), [payoffData]);
  const minPnL = useMemo(() => Math.min(...payoffData.map(d => d.pnl), 0), [payoffData]);

  const handleMouseDown = useCallback((e: any) => {
    if (e && e.activeLabel) {
      setSelectionStart(e.activeLabel);
      setSelectionEnd(e.activeLabel);
      setIsSelecting(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: any) => {
    if (isSelecting && e && e.activeLabel) {
      setSelectionEnd(e.activeLabel);
    }
  }, [isSelecting]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      
      // Only zoom if selection is meaningful (at least 1% of current range)
      const currentRange = payoffData.length > 0 
        ? payoffData[payoffData.length - 1].price - payoffData[0].price 
        : currentPrice * 0.3;
      
      if (end - start > currentRange * 0.01) {
        // Save current state to history for back navigation
        if (zoomState) {
          zoomHistory.current.push(zoomState);
        } else if (payoffData.length > 0) {
          zoomHistory.current.push({
            minPrice: payoffData[0].price,
            maxPrice: payoffData[payoffData.length - 1].price,
          });
        }
        
        setZoomState({ minPrice: start, maxPrice: end });
      }
    }
    
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, [isSelecting, selectionStart, selectionEnd, payoffData, currentPrice, zoomState]);

  const handleZoomIn = () => {
    const data = payoffData;
    if (data.length === 0) return;
    
    const currentMin = data[0].price;
    const currentMax = data[data.length - 1].price;
    const range = currentMax - currentMin;
    const center = (currentMax + currentMin) / 2;
    
    // Save current state
    zoomHistory.current.push({ minPrice: currentMin, maxPrice: currentMax });
    
    // Zoom in by 50%
    setZoomState({
      minPrice: center - range * 0.25,
      maxPrice: center + range * 0.25,
    });
  };

  const handleZoomOut = () => {
    const data = payoffData;
    if (data.length === 0) return;
    
    const currentMin = data[0].price;
    const currentMax = data[data.length - 1].price;
    const range = currentMax - currentMin;
    const center = (currentMax + currentMin) / 2;
    
    // Save current state
    zoomHistory.current.push({ minPrice: currentMin, maxPrice: currentMax });
    
    // Zoom out by 100%
    setZoomState({
      minPrice: Math.max(0, center - range),
      maxPrice: center + range,
    });
  };

  const handleResetZoom = () => {
    zoomHistory.current = [];
    setZoomState(null);
  };

  const handleZoomBack = () => {
    if (zoomHistory.current.length > 0) {
      const previousState = zoomHistory.current.pop();
      if (previousState) {
        // Check if it's the original state
        const defaultMin = currentPrice * 0.85;
        const defaultMax = currentPrice * 1.15;
        
        if (Math.abs(previousState.minPrice - defaultMin) < 1 && 
            Math.abs(previousState.maxPrice - defaultMax) < 1) {
          setZoomState(null);
        } else {
          setZoomState(previousState);
        }
      }
    } else {
      setZoomState(null);
    }
  };

  if (legs.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center border border-dashed border-border rounded-lg bg-card/50">
        <p className="text-muted-foreground text-sm">Add option legs to see payoff chart</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PayoffPoint;
      const isProfitable = data.pnl >= 0;
      
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-1">Price</p>
          <p className="font-mono font-semibold text-foreground">${data.price.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2 mb-1">P&L</p>
          <p className={`font-mono font-bold text-lg ${isProfitable ? 'text-profit profit-glow' : 'text-loss loss-glow'}`}>
            {isProfitable ? '+' : ''}${data.pnl.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const currentRange = payoffData.length > 0 
    ? { min: payoffData[0].price, max: payoffData[payoffData.length - 1].price }
    : { min: currentPrice * 0.85, max: currentPrice * 1.15 };

  return (
    <div className="space-y-4">
      {/* Zoom Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomBack}
            disabled={!zoomState && zoomHistory.current.length === 0}
            className="h-8 px-2"
            title="Go Back"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            disabled={!zoomState}
            className="h-8 px-2"
            title="Reset Zoom"
          >
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MousePointer2 className="h-3 w-3" />
            <span>Click & drag to zoom</span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            ${currentRange.min.toFixed(0)} - ${currentRange.max.toFixed(0)}
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full select-none">
        <ResponsiveContainer>
          <AreaChart
            data={payoffData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lossGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="hsl(0 72% 51%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            
            <XAxis
              dataKey="price"
              stroke="hsl(215 20% 55%)"
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              tickFormatter={(value) => `$${value}`}
              axisLine={{ stroke: 'hsl(222 30% 18%)' }}
              allowDataOverflow
            />
            
            <YAxis
              stroke="hsl(215 20% 55%)"
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              axisLine={{ stroke: 'hsl(222 30% 18%)' }}
              domain={[minPnL * 1.1, maxPnL * 1.1]}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Selection highlight */}
            {isSelecting && selectionStart !== null && selectionEnd !== null && (
              <ReferenceArea
                x1={Math.min(selectionStart, selectionEnd)}
                x2={Math.max(selectionStart, selectionEnd)}
                strokeOpacity={0.3}
                fill="hsl(217 91% 60%)"
                fillOpacity={0.2}
                stroke="hsl(217 91% 60%)"
              />
            )}
            
            {/* Zero line */}
            <ReferenceLine
              y={0}
              stroke="hsl(215 20% 55%)"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            
            {/* Current price line */}
            <ReferenceLine
              x={currentPrice}
              stroke="hsl(217 91% 60%)"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `Current: $${currentPrice}`,
                fill: 'hsl(217 91% 60%)',
                fontSize: 11,
                position: 'top',
              }}
            />
            
            {/* Simulated price line */}
            {simulatedPrice !== currentPrice && (
              <ReferenceLine
                x={simulatedPrice}
                stroke="hsl(280 65% 60%)"
                strokeWidth={2}
                label={{
                  value: `Sim: $${simulatedPrice}`,
                  fill: 'hsl(280 65% 60%)',
                  fontSize: 11,
                  position: 'top',
                }}
              />
            )}

            {/* Profit area */}
            <Area
              type="monotone"
              dataKey={(d: PayoffPoint) => d.pnl >= 0 ? d.pnl : 0}
              stroke="hsl(142 71% 45%)"
              strokeWidth={2}
              fill="url(#profitGradient)"
            />
            
            {/* Loss area */}
            <Area
              type="monotone"
              dataKey={(d: PayoffPoint) => d.pnl < 0 ? d.pnl : 0}
              stroke="hsl(0 72% 51%)"
              strokeWidth={2}
              fill="url(#lossGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
