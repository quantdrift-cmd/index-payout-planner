import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Plus, X, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Stock, StockGroup, searchStocks, popularStocks, defaultStockGroups } from '@/lib/stocks';

interface StockSearchProps {
  selectedStock: Stock | null;
  onSelectStock: (stock: Stock) => void;
  stockGroups: StockGroup[];
  onUpdateGroups: (groups: StockGroup[]) => void;
  activeGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
}

export const StockSearch = ({
  selectedStock,
  onSelectStock,
  stockGroups,
  onUpdateGroups,
  activeGroupId,
  onSelectGroup,
}: StockSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchStocks(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStock = useCallback((stock: Stock) => {
    onSelectStock(stock);
    setSearchQuery('');
    setShowResults(false);
    onSelectGroup(null); // Deselect group when picking individual stock
  }, [onSelectStock, onSelectGroup]);

  const handleAddToGroup = useCallback((stock: Stock, groupId: string) => {
    const updatedGroups = stockGroups.map(g => {
      if (g.id === groupId && !g.stocks.find(s => s.symbol === stock.symbol)) {
        return { ...g, stocks: [...g.stocks, stock] };
      }
      return g;
    });
    onUpdateGroups(updatedGroups);
  }, [stockGroups, onUpdateGroups]);

  const handleRemoveFromGroup = useCallback((symbol: string, groupId: string) => {
    const updatedGroups = stockGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, stocks: g.stocks.filter(s => s.symbol !== symbol) };
      }
      return g;
    });
    onUpdateGroups(updatedGroups);
  }, [stockGroups, onUpdateGroups]);

  const activeGroup = stockGroups.find(g => g.id === activeGroupId);

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search stocks by symbol or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 font-mono"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer border-b border-border last:border-0"
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => handleSelectStock(stock)}
                >
                  <span className="font-mono font-semibold text-foreground">{stock.symbol}</span>
                  <span className="text-sm text-muted-foreground ml-2">{stock.name}</span>
                </button>
                <div className="flex gap-1">
                  {stockGroups.map(g => (
                    <Button
                      key={g.id}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToGroup(stock, g.id);
                      }}
                      disabled={g.stocks.some(s => s.symbol === stock.symbol)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {g.name.slice(0, 8)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock Groups */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Stock Groups</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {stockGroups.map((group) => (
            <Button
              key={group.id}
              variant={activeGroupId === group.id ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onSelectGroup(activeGroupId === group.id ? null : group.id)}
              className="font-mono"
            >
              {group.name}
              <Badge variant="outline" className="ml-2 text-xs">
                {group.stocks.length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Active Group Stocks */}
        {activeGroup && (
          <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{activeGroup.name}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {activeGroup.stocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className={cn(
                    "relative p-2 rounded-lg border text-left transition-all duration-200 cursor-pointer",
                    "hover:border-primary/50 hover:bg-accent",
                    selectedStock?.symbol === stock.symbol
                      ? "border-primary bg-primary/10 terminal-glow"
                      : "border-border bg-card"
                  )}
                  onClick={() => onSelectStock(stock)}
                >
                  <button
                    className="absolute top-1 right-1 p-0.5 rounded hover:bg-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromGroup(stock.symbol, activeGroup.id);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                  <div className="font-mono font-semibold text-foreground text-sm">
                    {stock.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {stock.name}
                  </div>
                </div>
              ))}
              {activeGroup.stocks.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground text-center py-4">
                  No stocks in group. Search and add stocks above.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Popular Stocks (when no group selected) */}
      {!activeGroupId && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Popular Stocks</span>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {popularStocks.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleSelectStock(stock)}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all duration-200",
                  "hover:border-primary/50 hover:bg-accent",
                  selectedStock?.symbol === stock.symbol
                    ? "border-primary bg-primary/10 terminal-glow"
                    : "border-border bg-card"
                )}
              >
                <div className="font-mono font-semibold text-foreground text-sm">
                  {stock.symbol}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {stock.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
