"use client";

import { getPerformanceStatsAction } from "@/actions/trade/analytics/performance";
import { useActionSWR } from "@/hooks/use-action-swr";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PerformanceStats({
  className,
}: {
  className?: string;
}) {
  const { selectedTradeAccountIds: accountIds } = useTradeAccountContext();

  const { data, isLoading, error, revalidate } = useActionSWR(
    getPerformanceStatsAction,
    { accountIds },
  );

  if (isLoading) {
    return <PerformanceStatsSkeleton />;
  }

  if (error || !data) {
    return <PerformanceStatsError onRetry={revalidate} />;
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Performance</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <StatItem
          label="Best Trade"
          value={
            data.bestTrade
              ? `${formatCurrency(data.bestTrade.profit)}`
              : "No trades"
          }
          subtext={
            data.bestTrade
              ? `${data.bestTrade.symbol} on ${formatDate(data.bestTrade.date)}`
              : undefined
          }
          isPositive={data.bestTrade ? data.bestTrade.profit > 0 : undefined}
        />

        <StatItem
          label="Worst Trade"
          value={
            data.worstTrade
              ? `${formatCurrency(data.worstTrade.profit)}`
              : "No trades"
          }
          subtext={
            data.worstTrade
              ? `${data.worstTrade.symbol} on ${formatDate(data.worstTrade.date)}`
              : undefined
          }
          isPositive={data.worstTrade ? data.worstTrade.profit > 0 : undefined}
        />

        <StatItem
          label="Average Trade Duration"
          value={data.avgTradeDuration}
          subtext="HH:MM:SS format"
        />
      </CardContent>
    </Card>
  );
}

// ==================== Sub-components ====================

type StatItemProps = {
  label: string;
  value: string;
  subtext?: string;
  isPositive?: boolean;
};

function StatItem({ label, value, subtext, isPositive }: StatItemProps) {
  return (
    <div className="flex items-start justify-between border-b pb-4 last:border-0">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>

      <div
        className={`text-lg font-semibold ${
          isPositive === undefined
            ? "text-foreground"
            : isPositive
              ? "text-green-600 dark:text-green-400 flex items-center gap-1"
              : "text-red-600 dark:text-red-400 flex items-center gap-1"
        }`}
      >
        {isPositive && <TrendingUp className="size-4" />}
        {isPositive === false && <TrendingDown className="size-4" />}
        {value}
      </div>
    </div>
  );
}

function PerformanceStatsSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>

      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b pb-4 last:border-0"
          >
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PerformanceStatsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="w-full">
      <CardContent className="py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="size-10 text-destructive" />

          <div className="space-y-1">
            <p className="font-medium">Failed to load performance stats</p>
            <p className="text-sm text-muted-foreground">
              There was an error loading your performance data.
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
