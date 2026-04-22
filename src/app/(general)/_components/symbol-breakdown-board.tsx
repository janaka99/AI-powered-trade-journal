"use client";

import { useState } from "react";
import { getSymbolBreakdownAction } from "@/actions/trade/analytics/symbol-breakdown";
import { listTradeSymbolsAction } from "@/actions/trade/list-symbols";
import { useActionSWR } from "@/hooks/use-action-swr";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function plColor(value: number): string {
  if (value > 0) return "text-green-600 dark:text-green-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

function plBg(value: number): string {
  if (value > 0) return "bg-green-500/10 dark:bg-green-500/15";
  if (value < 0) return "bg-red-500/10 dark:bg-red-500/15";
  return "bg-muted/50";
}

type SymbolRow = {
  symbol: string;
  totalPL: number;
  profit: number;
  swap: number;
  commissions: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
};

function WinRateBar({ winRate }: { winRate: number }) {
  const pct = Math.min(Math.max(winRate, 0), 100);
  const barColor =
    pct >= 50
      ? "bg-green-500 dark:bg-green-400"
      : pct >= 30
        ? "bg-yellow-500 dark:bg-yellow-400"
        : "bg-red-500 dark:bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-10 text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function SymbolCard({ row }: { row: SymbolRow }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-shadow hover:shadow-md",
      )}
    >
      {/* Subtle left accent bar */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          row.totalPL > 0
            ? "bg-green-500"
            : row.totalPL < 0
              ? "bg-red-500"
              : "bg-muted-foreground/30",
        )}
      />

      <CardContent className="p-4 pl-5">
        {/* Header: symbol + total P&L */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-wide">
              {row.symbol}
            </span>
            <Badge variant="outline" className="text-xs tabular-nums">
              {row.tradeCount} trade{row.tradeCount !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {row.totalPL > 0 ? (
              <TrendingUp className="size-4 text-green-500" />
            ) : row.totalPL < 0 ? (
              <TrendingDown className="size-4 text-red-500" />
            ) : null}
            <span
              className={cn(
                "text-lg font-bold tabular-nums",
                plColor(row.totalPL),
              )}
            >
              {formatCurrency(row.totalPL)}
            </span>
          </div>
        </div>

        {/* Win rate bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-green-600 dark:text-green-400 font-medium">
                {row.winCount}W
              </span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                {row.lossCount}L
              </span>
            </div>
          </div>
          <WinRateBar winRate={row.winRate} />
        </div>

        <Separator className="mb-3" />

        {/* Breakdown grid */}
        <div className="grid grid-cols-3 gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "rounded-md px-2.5 py-2 text-center",
                    plBg(row.profit),
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    Profit
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      plColor(row.profit),
                    )}
                  >
                    {formatCurrency(row.profit)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Sum of raw profit from trades</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "rounded-md px-2.5 py-2 text-center",
                    plBg(row.swap),
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    Swap
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      plColor(row.swap),
                    )}
                  >
                    {formatCurrency(row.swap)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Overnight swap / financing fees</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "rounded-md px-2.5 py-2 text-center",
                    plBg(row.commissions),
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    Comm.
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      plColor(row.commissions),
                    )}
                  >
                    {formatCurrency(row.commissions)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Trading commissions / fees</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

function TotalsSummary({ data }: { data: SymbolRow[] }) {
  const totals = data.reduce(
    (acc, row) => ({
      totalPL: acc.totalPL + row.totalPL,
      profit: acc.profit + row.profit,
      swap: acc.swap + row.swap,
      commissions: acc.commissions + row.commissions,
      tradeCount: acc.tradeCount + row.tradeCount,
      winCount: acc.winCount + row.winCount,
      lossCount: acc.lossCount + row.lossCount,
    }),
    {
      totalPL: 0,
      profit: 0,
      swap: 0,
      commissions: 0,
      tradeCount: 0,
      winCount: 0,
      lossCount: 0,
    },
  );

  const overallWinRate =
    totals.tradeCount > 0
      ? Math.round((totals.winCount / totals.tradeCount) * 1000) / 10
      : 0;

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Total P&L</p>
            <p
              className={cn(
                "text-xl font-bold tabular-nums",
                plColor(totals.totalPL),
              )}
            >
              {formatCurrency(totals.totalPL)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Profit</p>
            <p
              className={cn(
                "text-xl font-bold tabular-nums",
                plColor(totals.profit),
              )}
            >
              {formatCurrency(totals.profit)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Swap</p>
            <p
              className={cn(
                "text-xl font-bold tabular-nums",
                plColor(totals.swap),
              )}
            >
              {formatCurrency(totals.swap)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Commissions</p>
            <p
              className={cn(
                "text-xl font-bold tabular-nums",
                plColor(totals.commissions),
              )}
            >
              {formatCurrency(totals.commissions)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Trades</p>
            <p className="text-xl font-bold tabular-nums">
              {totals.tradeCount}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
            <div className="flex items-center justify-center gap-1">
              <Trophy className="size-4 text-yellow-500" />
              <p className="text-xl font-bold tabular-nums">
                {overallWinRate}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SymbolBreakdownBoard() {
  const { selectedTradeAccountIds: accountIds } = useTradeAccountContext();
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

  const { data: symbols } = useActionSWR(listTradeSymbolsAction, accountIds);

  const { data, isLoading, error, revalidate } = useActionSWR(
    getSymbolBreakdownAction,
    {
      accountIds,
      symbols: selectedSymbols.length > 0 ? selectedSymbols : undefined,
    },
  );

  const handleToggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol],
    );
  };

  const handleClearSymbols = () => {
    setSelectedSymbols([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="w-full">
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="size-10 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium">Failed to load symbol breakdown</p>
              <p className="text-sm text-muted-foreground">
                There was an error loading the data. Please try again.
              </p>
            </div>
            <Button onClick={revalidate} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) => {
    const aHasEnoughTrades = a.tradeCount > 5;
    const bHasEnoughTrades = b.tradeCount > 5;

    if (aHasEnoughTrades !== bHasEnoughTrades) {
      return aHasEnoughTrades ? -1 : 1;
    }

    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }

    return b.tradeCount - a.tradeCount;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">P&L by Symbol</h2>
        <SymbolFilter
          symbols={symbols ?? []}
          selected={selectedSymbols}
          onToggle={handleToggleSymbol}
          onClear={handleClearSymbols}
        />
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-sm text-muted-foreground">
              No trades found for the selected filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <TotalsSummary data={data} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedData.map((row) => (
              <SymbolCard key={row.symbol} row={row} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ==================== Sub-components ====================

type SymbolFilterProps = {
  symbols: string[];
  selected: string[];
  onToggle: (symbol: string) => void;
  onClear: () => void;
};

function SymbolFilter({
  symbols,
  selected,
  onToggle,
  onClear,
}: SymbolFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 justify-start text-left font-normal",
            selected.length === 0 && "text-muted-foreground",
          )}
        >
          <ChevronsUpDown className="mr-2 size-3.5" />
          {selected.length > 0
            ? `${selected.length} symbol${selected.length > 1 ? "s" : ""}`
            : "All Symbols"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="end">
        <div className="max-h-60 overflow-y-auto p-1">
          {symbols.length === 0 ? (
            <p className="p-2 text-center text-sm text-muted-foreground">
              No symbols found
            </p>
          ) : (
            symbols.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => onToggle(symbol)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <div
                  className={cn(
                    "flex size-4 items-center justify-center rounded-sm border",
                    selected.includes(symbol)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/25",
                  )}
                >
                  {selected.includes(symbol) && <Check className="size-3" />}
                </div>
                {symbol}
              </button>
            ))
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-1">
            <button
              type="button"
              onClick={onClear}
              className="w-full rounded-sm px-2 py-1.5 text-center text-sm hover:bg-accent hover:text-accent-foreground"
            >
              Clear filters
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
