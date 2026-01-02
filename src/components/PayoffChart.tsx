import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptionLeg, generatePayoffCurve, PayoffPoint } from '@/lib/instruments';

interface PayoffChartProps {
  legs: OptionLeg[];
  currentPrice: number;
  simulatedPrice: number;
}

const ZOOM_LEVELS = [0.05, 0.10, 0.15, 0.20, 0.30, 0.50];

export const PayoffChart = ({ legs, currentPrice, simulatedPrice }: PayoffChartProps) => {
  const [zoomIndex, setZoomIndex] = useState(2); // Default 15%
  const zoomRange = ZOOM_LEVELS[zoomIndex];

  const payoffData = useMemo(() => {
    if (legs.length === 0) return [];
    return generatePayoffCurve(legs, currentPrice, zoomRange);
  }, [legs, currentPrice, zoomRange]);

  const maxPnL = useMemo(() => Math.max(...payoffData.map(d => d.pnl), 0), [payoffData]);
  const minPnL = useMemo(() => Math.min(...payoffData.map(d => d.pnl), 0), [payoffData]);

  const handleZoomIn = () => {
    if (zoomIndex > 0) setZoomIndex(zoomIndex - 1);
  };

  const handleZoomOut = () => {
    if (zoomIndex < ZOOM_LEVELS.length - 1) setZoomIndex(zoomIndex + 1);
  };

  const handleResetZoom = () => {
    setZoomIndex(2);
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

  return (
    <div className="space-y-4">
      {/* Zoom Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomIndex === 0}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            className="h-8 px-2"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          Range: ±{(zoomRange * 100).toFixed(0)}% (${(currentPrice * (1 - zoomRange)).toFixed(0)} - ${(currentPrice * (1 + zoomRange)).toFixed(0)})
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer>
        <AreaChart
          data={payoffData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
          />
          
          <YAxis
            stroke="hsl(215 20% 55%)"
            tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            axisLine={{ stroke: 'hsl(222 30% 18%)' }}
            domain={[minPnL * 1.1, maxPnL * 1.1]}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
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
