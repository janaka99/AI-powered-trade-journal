"use client";

import { useEffect, useMemo, useState } from "react";
import { getSymbolBreakdownAction } from "@/actions/trade/analytics/symbol-breakdown";
import { listTradeSymbolsAction } from "@/actions/trade/list-symbols";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";
import { useActionSWR } from "@/hooks/use-action-swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AlertCircle, Filter, TrendingDown, TrendingUp } from "lucide-react";

const ANALYTICS_SYMBOLS_STORAGE_KEY = "analytics:selected-symbols";

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function colorByNumber(value: number): string {
  if (value > 0) return "text-green-600 dark:text-green-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function surfaceTone(value: number): string {
  if (value > 0) return "bg-green-500/10 dark:bg-green-500/15";
  if (value < 0) return "bg-red-500/10 dark:bg-red-500/15";
  return "bg-muted/50";
}

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
      <span className="w-10 text-right text-xs font-medium tabular-nums">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { selectedTradeAccountIds: accountIds, isLoading: isAccountLoading } =
    useTradeAccountContext();
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [pendingSymbols, setPendingSymbols] = useState<string[]>([]);
  const [hasLoadedStoredSymbols, setHasLoadedStoredSymbols] = useState(false);

  const {
    data: symbolList,
    isLoading: areSymbolsLoading,
    error: symbolsError,
  } = useActionSWR(listTradeSymbolsAction, accountIds);

  const {
    data: breakdown,
    isLoading: isBreakdownLoading,
    error: breakdownError,
    revalidate,
  } = useActionSWR(getSymbolBreakdownAction, {
    accountIds,
    symbols: selectedSymbols.length > 0 ? selectedSymbols : undefined,
  });

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(
        ANALYTICS_SYMBOLS_STORAGE_KEY,
      );

      if (!storedValue) {
        setHasLoadedStoredSymbols(true);
        return;
      }

      const parsedValue = JSON.parse(storedValue);
      const storedSymbols = Array.isArray(parsedValue)
        ? parsedValue.filter(
            (value): value is string =>
              typeof value === "string" && value.length > 0,
          )
        : [];

      setSelectedSymbols(storedSymbols);
      setPendingSymbols(storedSymbols);
    } catch {
      window.localStorage.removeItem(ANALYTICS_SYMBOLS_STORAGE_KEY);
    } finally {
      setHasLoadedStoredSymbols(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredSymbols) {
      return;
    }

    const availableSymbols = new Set(symbolList ?? []);

    setSelectedSymbols((prev) =>
      prev.filter((symbol) => availableSymbols.has(symbol)),
    );
    setPendingSymbols((prev) =>
      prev.filter((symbol) => availableSymbols.has(symbol)),
    );
  }, [hasLoadedStoredSymbols, symbolList]);

  useEffect(() => {
    if (!hasLoadedStoredSymbols) {
      return;
    }

    window.localStorage.setItem(
      ANALYTICS_SYMBOLS_STORAGE_KEY,
      JSON.stringify(selectedSymbols),
    );
  }, [hasLoadedStoredSymbols, selectedSymbols]);

  const rows = breakdown ?? [];

  const totals = useMemo(() => {
    return rows.reduce(
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
  }, [rows]);

  const winRate =
    totals.tradeCount > 0 ? (totals.winCount / totals.tradeCount) * 100 : 0;
  const avgPLPerTrade =
    totals.tradeCount > 0 ? totals.totalPL / totals.tradeCount : 0;

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (b.winRate !== a.winRate) {
          return b.winRate - a.winRate;
        }

        return b.tradeCount - a.tradeCount;
      }),
    [rows],
  );

  const handleToggleSymbol = (symbol: string) => {
    setPendingSymbols((prev) =>
      prev.includes(symbol)
        ? prev.filter((item) => item !== symbol)
        : [...prev, symbol],
    );
  };

  const applySelectedSymbols = () => {
    setSelectedSymbols(pendingSymbols);
  };

  const clearSelectedSymbols = () => {
    setPendingSymbols([]);
    setSelectedSymbols([]);
  };

  const hasPendingChanges = useMemo(() => {
    if (pendingSymbols.length !== selectedSymbols.length) {
      return true;
    }

    const selectedSet = new Set(selectedSymbols);
    return pendingSymbols.some((symbol) => !selectedSet.has(symbol));
  }, [pendingSymbols, selectedSymbols]);

  const isLoading = isAccountLoading || isBreakdownLoading;
  const hasError = Boolean(breakdownError || symbolsError);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (accountIds.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Select at least one trade account to load analytics.
        </CardContent>
      </Card>
    );
  }

  if (hasError) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="size-9 text-destructive" />
            <div>
              <p className="font-medium">Failed to load analytics</p>
              <p className="text-sm text-muted-foreground">
                Please retry. If this continues, check your selected accounts.
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

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div>
          <h1 className="text-2xl font-semibold">Analytics Review</h1>
          <p className="text-sm text-muted-foreground">
            Full metrics for selected accounts and symbols.
          </p>
        </div>
      </div>

      <SymbolFilterCard
        symbols={symbolList ?? []}
        selected={pendingSymbols}
        applied={selectedSymbols}
        onToggle={handleToggleSymbol}
        onApply={applySelectedSymbols}
        onClear={clearSelectedSymbols}
        disabled={areSymbolsLoading}
        hasPendingChanges={hasPendingChanges}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Win Rate" value={`${winRate.toFixed(1)}%`} />
        <MetricCard
          title="Net P&L"
          value={formatCurrency(totals.totalPL)}
          tone={colorByNumber(totals.totalPL)}
        />
        <MetricCard
          title="Profit"
          value={formatCurrency(totals.profit)}
          tone={colorByNumber(totals.profit)}
        />
        <MetricCard title="Trades" value={compactNumber(totals.tradeCount)} />
        <MetricCard
          title="Commissions"
          value={formatCurrency(totals.commissions)}
          tone={colorByNumber(totals.commissions)}
        />
        <MetricCard
          title="Swaps"
          value={formatCurrency(totals.swap)}
          tone={colorByNumber(totals.swap)}
        />
        <MetricCard
          title="Winning Trades"
          value={compactNumber(totals.winCount)}
        />
        <MetricCard
          title="Avg P&L / Trade"
          value={formatCurrency(avgPLPerTrade)}
          tone={colorByNumber(avgPLPerTrade)}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Symbol Breakdown</CardTitle>
          <Badge variant="outline">
            {sortedRows.length} symbol{sortedRows.length === 1 ? "" : "s"}
          </Badge>
        </CardHeader>
        <CardContent>
          {sortedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No trades found for selected filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedRows.map((row) => (
                <SymbolBreakdownCard key={row.symbol} row={row} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className={cn("text-2xl font-semibold tabular-nums", tone)}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function SymbolFilterCard({
  symbols,
  selected,
  applied,
  onToggle,
  onApply,
  onClear,
  disabled,
  hasPendingChanges,
}: {
  symbols: string[];
  selected: string[];
  applied: string[];
  onToggle: (symbol: string) => void;
  onApply: () => void;
  onClear: () => void;
  disabled?: boolean;
  hasPendingChanges: boolean;
}) {
  const sortedSymbols = [...symbols].sort((a, b) => a.localeCompare(b));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" />
            Symbol Filters
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select one or more pairs to recalculate analytics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {applied.length > 0
              ? `${applied.length} applied`
              : `${symbols.length} total`}
          </Badge>
          <Button
            variant="default"
            size="sm"
            onClick={onApply}
            disabled={disabled || !hasPendingChanges}
          >
            Apply Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={disabled || selected.length === 0}
          >
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto pr-1">
          {sortedSymbols.length === 0 ? (
            <p className="p-2 text-center text-sm text-muted-foreground">
              No symbols found
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedSymbols.map((symbol) => {
                const checked = selected.includes(symbol);

                return (
                  <label
                    key={symbol}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                      checked
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50",
                      disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggle(symbol)}
                      aria-label={`Select ${symbol}`}
                      disabled={disabled}
                    />
                    <span className="font-medium">{symbol}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {disabled && (
          <p className="pt-3 text-sm text-muted-foreground">
            Loading available symbols...
          </p>
        )}

        {!disabled && hasPendingChanges && (
          <p className="pt-3 text-sm text-muted-foreground">
            You have unapplied symbol changes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SymbolBreakdownCard({ row }: { row: SymbolRow }) {
  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
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
        <div className="mb-3 flex items-center justify-between gap-2">
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
                colorByNumber(row.totalPL),
              )}
            >
              {formatCurrency(row.totalPL)}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-green-600 dark:text-green-400">
                {row.winCount}W
              </span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {row.lossCount}L
              </span>
            </div>
          </div>
          <WinRateBar winRate={row.winRate} />
        </div>

        <Separator className="mb-3" />

        <div className="grid grid-cols-3 gap-3">
          <div
            className={cn(
              "rounded-md px-2.5 py-2 text-center",
              surfaceTone(row.profit),
            )}
          >
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Profit
            </p>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                colorByNumber(row.profit),
              )}
            >
              {formatCurrency(row.profit)}
            </p>
          </div>

          <div
            className={cn(
              "rounded-md px-2.5 py-2 text-center",
              surfaceTone(row.swap),
            )}
          >
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Swap
            </p>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                colorByNumber(row.swap),
              )}
            >
              {formatCurrency(row.swap)}
            </p>
          </div>

          <div
            className={cn(
              "rounded-md px-2.5 py-2 text-center",
              surfaceTone(row.commissions),
            )}
          >
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Comm.
            </p>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                colorByNumber(row.commissions),
              )}
            >
              {formatCurrency(row.commissions)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
