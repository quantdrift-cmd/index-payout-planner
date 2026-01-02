import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { OptionLeg, generatePayoffCurve, PayoffPoint } from '@/lib/instruments';

interface PayoffChartProps {
  legs: OptionLeg[];
  currentPrice: number;
  simulatedPrice: number;
}

export const PayoffChart = ({ legs, currentPrice, simulatedPrice }: PayoffChartProps) => {
  const payoffData = useMemo(() => {
    if (legs.length === 0) return [];
    return generatePayoffCurve(legs, currentPrice, 0.15);
  }, [legs, currentPrice]);

  const maxPnL = useMemo(() => Math.max(...payoffData.map(d => d.pnl), 0), [payoffData]);
  const minPnL = useMemo(() => Math.min(...payoffData.map(d => d.pnl), 0), [payoffData]);

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
  );
};
