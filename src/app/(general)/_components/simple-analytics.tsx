"use client";
import { getAnalyticsAction } from "@/actions/trade/analytics/get";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";
import { useActionSWR } from "@/hooks/use-action-swr";
import { BookHeart, Info } from "lucide-react";
import { useState } from "react";

type MetricCard = {
  title: string;
  value: string;
  breakdown: [number, number, number];
  suffix?: string;
};

const METRICS: MetricCard[] = [
  {
    title: "Net P&L",
    value: "$14,742",
    breakdown: [63, 26, 11],
  },
  {
    title: "Trade win %",
    value: "31.78",
    suffix: "%",
    breakdown: [34, 3, 73],
  },
  {
    title: "Profit factor",
    value: "1.82",
    breakdown: [57, 20, 23],
  },
  {
    title: "Day win %",
    value: "57.58",
    suffix: "%",
    breakdown: [15, 2, 14],
  },
];

function formatPriceValue(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function DonutChart({ values }: { values: [number, number, number] }) {
  const total = values.reduce((sum, current) => sum + current, 0);
  const first = total === 0 ? 0 : (values[0] / total) * 100;
  const second = total === 0 ? 0 : (values[1] / total) * 100;

  const chartStyle = {
    background: `conic-gradient(
      var(--primary) 0% ${first}%,
      var(--chart-2) ${first}% ${first + second}%,
      var(--muted) ${first + second}% 100%
    )`,
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-14">
        <div className="size-14 rounded-full" style={chartStyle} />
        <div className="absolute inset-[6px] rounded-full bg-card" />
      </div>
    </div>
  );
}

function Metric({ title, value, suffix, breakdown }: MetricCard) {
  return (
    <article className="rounded-xl border border-border/70 bg-card px-5 py-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>{title}</span>
          <Info className="size-3.5" />
        </div>
      </div>

      <div className="text-3xl leading-none font-semibold tracking-tight text-card-foreground">
        {value}
        {/* <span className="text-2xl">{suffix}</span> */}
      </div>

      <DonutChart values={breakdown} />
    </article>
  );
}

export default function SimpleAnalytics() {
  const { selectedTradeAccountIds: accounts } = useTradeAccountContext();

  const { data, isLoading, error, revalidate } = useActionSWR(
    getAnalyticsAction,
    accounts,
  );

  console.log(data);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card className="p-4">
        <CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <span className="text-sm text-muted-foreground">
                Failed to load analytics.
              </span>
              <button
                onClick={revalidate}
                className="rounded-md bg-primary px-3 py-1 text-sm text-white hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {data.netPL != null ? (
        <NetPL value={data.netPL} />
      ) : (
        <Skeleton className="h-32 w-full rounded-xl" />
      )}
      {data.tradeWinRate != null ? (
        <TradeWinRate winRate={data.tradeWinRate} />
      ) : (
        <Skeleton className="h-32 w-full rounded-xl" />
      )}
      {data.profitFactor != null ? (
        <ProfitFactor profitFactor={data.profitFactor} />
      ) : (
        <Skeleton className="h-32 w-full rounded-xl" />
      )}
      {data.averageWinLoss != null ? (
        <AverageWinLoss averageWinLoss={data.averageWinLoss} />
      ) : (
        <Skeleton className="h-32 w-full rounded-xl" />
      )}
    </div>
  );
}

function NetPL({ value }: { value: number }) {
  const style =
    value > 0
      ? "text-green-400"
      : value < 0
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <Card className="p-4 flex flex-row justify-between items-center ">
      <div className="space-y-5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">Net P&L</span>
          <Info className="size-3.5" />
        </div>
        <div
          className={`mb-5 text-2xl leading-none font-semibold tracking-tight ${style}`}
        >
          ${formatPriceValue(value)}
        </div>
      </div>
      <BookHeart />
    </Card>
  );
}

function ProfitFactor({ profitFactor }: { profitFactor: number }) {
  return (
    <Card className="p-4 flex flex-row justify-between items-center ">
      <div className="space-y-5 ">
        <div className="flex items-center gap-1.5 ">
          <span className="text-sm">Profit factor</span>
          <Info className="size-3.5" />
        </div>
        <div className="text-2xl leading-none font-semibold tracking-tight text-card-foreground">
          {profitFactor}
        </div>
      </div>
      <DonutChart values={[34, 3, 73]} />
    </Card>
  );
}

function TradeWinRate({ winRate }: { winRate: number }) {
  const percentage = Math.min(Math.max(winRate, 0), 100);
  return (
    <Card className="p-4 flex flex-row justify-between items-center ">
      <div className="space-y-5 ">
        <div className="flex items-center gap-1.5 ">
          <span className="text-sm">Trade Win Rate</span>
          <Info className="size-3.5" />
        </div>
        <div className="text-2xl leading-none font-semibold tracking-tight text-card-foreground">
          {percentage.toFixed(1)}
          <span className="text-2xl">%</span>
        </div>
      </div>
      <div className="relative size-20">
        <svg viewBox="0 0 100 100" className="size-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted-foreground/20"
          />

          {/* Filled circle (gauge) */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${2.51 * percentage} 251`}
            className={
              percentage >= 50
                ? "text-green-600 dark:text-green-400"
                : percentage >= 30
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
            }
            strokeLinecap="round"
          />
        </svg>
      </div>
    </Card>
  );
}

function AverageWinLoss({ averageWinLoss }: { averageWinLoss: number }) {
  return (
    <Card className="p-4 flex flex-row justify-between items-center ">
      <div className="space-y-5 ">
        <div className="flex items-center gap-1.5 ">
          <span className="text-sm">Average Win/Loss</span>
          <Info className="size-3.5" />
        </div>
        <div className="text-2xl leading-none font-semibold tracking-tight text-card-foreground">
          {averageWinLoss}
        </div>
      </div>
      <DonutChart values={[34, 3, 73]} />
    </Card>
  );
}
