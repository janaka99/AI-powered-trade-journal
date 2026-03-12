"use client";

import type { CalendarDayData } from "@/actions/trade/analytics/calendar";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Calendar,
  Trophy,
} from "lucide-react";

type MonthSummary = {
  totalTrades: number;
  wins: number;
  losses: number;
  profit: number;
  winRate: number;
  tradingDays: number;
  bestDay: CalendarDayData | null;
  worstDay: CalendarDayData | null;
  avgProfitPerDay: number;
  avgTradesPerDay: number;
};

export function computeMonthSummary(days: CalendarDayData[]): MonthSummary {
  if (days.length === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      profit: 0,
      winRate: 0,
      tradingDays: 0,
      bestDay: null,
      worstDay: null,
      avgProfitPerDay: 0,
      avgTradesPerDay: 0,
    };
  }

  let totalTrades = 0;
  let wins = 0;
  let losses = 0;
  let profit = 0;
  let bestDay: CalendarDayData | null = null;
  let worstDay: CalendarDayData | null = null;

  for (const day of days) {
    totalTrades += day.totalTrades;
    wins += day.wins;
    losses += day.losses;
    profit += day.profit;
    if (!bestDay || day.profit > bestDay.profit) bestDay = day;
    if (!worstDay || day.profit < worstDay.profit) worstDay = day;
  }

  const tradingDays = days.length;

  return {
    totalTrades,
    wins,
    losses,
    profit: Math.round(profit * 100) / 100,
    winRate: totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0,
    tradingDays,
    bestDay,
    worstDay,
    avgProfitPerDay: Math.round((profit / tradingDays) * 100) / 100,
    avgTradesPerDay: Math.round((totalTrades / tradingDays) * 10) / 10,
  };
}

type CalendarMonthSummaryProps = {
  days: CalendarDayData[];
};

function formatProfit(value: number) {
  const formatted = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CalendarMonthSummary({ days }: CalendarMonthSummaryProps) {
  const summary = computeMonthSummary(days);

  if (summary.totalTrades === 0) {
    return (
      <div className="mt-4 rounded-lg border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
        No closed trades this month.
      </div>
    );
  }

  const isProfit = summary.profit > 0;
  const isLoss = summary.profit < 0;

  return (
    <div className="mt-4 rounded-lg border bg-muted/20 p-4 space-y-4">
      <h4 className="text-sm font-semibold text-foreground">Monthly Summary</h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Net P&L */}
        <SummaryCard
          icon={
            isProfit ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )
          }
          label="Net P&L"
          value={formatProfit(summary.profit)}
          valueClassName={cn(
            isProfit && "text-emerald-600 dark:text-emerald-400",
            isLoss && "text-red-600 dark:text-red-400",
          )}
        />

        {/* Total Trades */}
        <SummaryCard
          icon={<BarChart3 className="size-4" />}
          label="Total Trades"
          value={summary.totalTrades.toString()}
          sub={`${summary.wins}W / ${summary.losses}L`}
        />

        {/* Win Rate */}
        <SummaryCard
          icon={<Target className="size-4" />}
          label="Win Rate"
          value={`${summary.winRate}%`}
          valueClassName={cn(
            summary.winRate >= 50 && "text-emerald-600 dark:text-emerald-400",
            summary.winRate < 50 && "text-red-600 dark:text-red-400",
          )}
        />

        {/* Trading Days */}
        <SummaryCard
          icon={<Calendar className="size-4" />}
          label="Trading Days"
          value={summary.tradingDays.toString()}
          sub={`~${summary.avgTradesPerDay} trades/day`}
        />

        {/* Avg Profit/Day */}
        <SummaryCard
          icon={<TrendingUp className="size-4" />}
          label="Avg P&L / Day"
          value={formatProfit(summary.avgProfitPerDay)}
          valueClassName={cn(
            summary.avgProfitPerDay > 0 &&
              "text-emerald-600 dark:text-emerald-400",
            summary.avgProfitPerDay < 0 && "text-red-600 dark:text-red-400",
          )}
        />

        {/* Best Day */}
        {summary.bestDay && (
          <SummaryCard
            icon={<Trophy className="size-4" />}
            label="Best Day"
            value={formatProfit(summary.bestDay.profit)}
            sub={formatDate(summary.bestDay.date)}
            valueClassName="text-emerald-600 dark:text-emerald-400"
          />
        )}

        {/* Worst Day */}
        {summary.worstDay && (
          <SummaryCard
            icon={<TrendingDown className="size-4" />}
            label="Worst Day"
            value={formatProfit(summary.worstDay.profit)}
            sub={formatDate(summary.worstDay.date)}
            valueClassName="text-red-600 dark:text-red-400"
          />
        )}
      </div>
    </div>
  );
}

type SummaryCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
};

function SummaryCard({
  icon,
  label,
  value,
  sub,
  valueClassName,
}: SummaryCardProps) {
  return (
    <div className="rounded-md border bg-background p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={cn("text-lg font-bold", valueClassName)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
