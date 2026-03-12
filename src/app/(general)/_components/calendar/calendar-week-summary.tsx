"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WeekSummary = {
  totalTrades: number;
  wins: number;
  profit: number;
  winRate: number;
};

type CalendarWeekSummaryProps = {
  summary: WeekSummary | null;
  weekNumber: number;
};

export function CalendarWeekSummary({
  summary,
  weekNumber,
}: CalendarWeekSummaryProps) {
  if (!summary || summary.totalTrades === 0) {
    return (
      <div className="min-h-[80px] bg-muted/20 border border-border/50 p-1.5 flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium text-muted-foreground">
          Week {weekNumber}
        </span>
        <span className="text-[10px] text-muted-foreground">—</span>
      </div>
    );
  }

  const isProfit = summary.profit > 0;
  const isLoss = summary.profit < 0;

  return (
    <div className={cn("min-h-[80px]  p-2")}>
      <Card className="flex flex-col justify-center items-center h-full gap-0 bg-gray-50 dark:bg-gray-800/50 border border-border/50">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Week {weekNumber}
        </div>
        <div
          className={cn(
            "text-sm md:text-xl lg:text-2xl font-semibold",
            isProfit && "text-emerald-600 dark:text-emerald-400",
            isLoss && "text-red-600 dark:text-red-400",
            summary.profit === 0 && "text-muted-foreground",
          )}
        >
          {isProfit ? "+" : ""}
          {summary.profit.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className="text-xs md:text-sm text-muted-foreground">
          {summary.totalTrades} trade{summary.totalTrades !== 1 ? "s" : ""}
        </div>
        <div className="text-xs md:text-sm text-muted-foreground">
          {summary.winRate}% WR
        </div>
      </Card>
    </div>
  );
}

export type { WeekSummary };
