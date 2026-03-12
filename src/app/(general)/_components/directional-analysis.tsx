"use client";

import { getDirectionalAnalysisAction } from "@/actions/trade/analytics/directional";
import { useActionSWR } from "@/hooks/use-action-swr";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DirectionalAnalysis({
  className,
}: {
  className?: string;
}) {
  const { selectedTradeAccountIds: accountIds } = useTradeAccountContext();

  const { data, isLoading, error, revalidate } = useActionSWR(
    getDirectionalAnalysisAction,
    { accountIds },
  );

  if (isLoading) {
    return <DirectionalAnalysisSkeleton />;
  }

  if (error || !data) {
    return <DirectionalAnalysisError onRetry={revalidate} />;
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Directional Analysis</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Long vs Short Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Long vs Short Performance</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Long Trades */}
            <DirectionalCard
              direction="Long"
              totalTrades={data.long.totalTrades}
              winCount={data.long.winCount}
              winRate={data.long.winRate}
              totalProfit={data.long.totalProfit}
              isPositive={true}
            />

            {/* Short Trades */}
            <DirectionalCard
              direction="Short"
              totalTrades={data.short.totalTrades}
              winCount={data.short.winCount}
              winRate={data.short.winRate}
              totalProfit={data.short.totalProfit}
              isPositive={false}
            />
          </div>
        </div>

        {/* Top Symbols Section */}
        {data.topSymbols.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Top Symbols by Trades</h3>

            <div className="space-y-3">
              {data.topSymbols.map((symbol) => (
                <SymbolRow key={symbol.symbol} symbol={symbol} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Sub-components ====================

type DirectionalCardProps = {
  direction: "Long" | "Short";
  totalTrades: number;
  winCount: number;
  winRate: number;
  totalProfit: number;
  isPositive: boolean;
};

function DirectionalCard({
  direction,
  totalTrades,
  winCount,
  winRate,
  totalProfit,
  isPositive,
}: DirectionalCardProps) {
  const bgColor = isPositive
    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";

  const textColor = isPositive
    ? "text-green-700 dark:text-green-400"
    : "text-red-700 dark:text-red-400";

  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`rounded-lg border p-4 ${bgColor}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4" />
        <span className={`font-semibold text-sm ${textColor}`}>
          {direction}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Trades:</span>
          <span className="font-medium">{totalTrades}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Wins:</span>
          <span className="font-medium">
            {winCount} ({winRate.toFixed(1)}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">P/L:</span>
          <span className={`font-semibold ${textColor}`}>
            {totalProfit > 0 ? "+" : ""}
            {formatCurrency(totalProfit)}
          </span>
        </div>
      </div>
    </div>
  );
}

type SymbolRowProps = {
  symbol: {
    symbol: string;
    tradeCount: number;
    profit: number;
    winRate: number;
  };
};

function SymbolRow({ symbol }: SymbolRowProps) {
  const isProfit = symbol.profit > 0;

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="space-y-1">
        <p className="font-medium text-sm">{symbol.symbol}</p>
        <p className="text-xs text-muted-foreground">
          {symbol.tradeCount} trades · {symbol.winRate.toFixed(1)}% win rate
        </p>
      </div>

      <div
        className={`text-right text-sm font-semibold ${
          isProfit
            ? "text-green-600 dark:text-green-400"
            : isProfit === false
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
        }`}
      >
        {isProfit ? "+" : ""}
        {formatCurrency(symbol.profit)}
      </div>
    </div>
  );
}

function DirectionalAnalysisSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-20" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DirectionalAnalysisError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="w-full">
      <CardContent className="py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="size-10 text-destructive" />

          <div className="space-y-1">
            <p className="font-medium">Failed to load directional analysis</p>
            <p className="text-sm text-muted-foreground">
              There was an error loading your directional data.
            </p>
          </div>

          <Button onClick={onRetry} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Utility functions ====================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
