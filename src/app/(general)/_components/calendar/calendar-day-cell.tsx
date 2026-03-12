"use client";

import type { CalendarDayData } from "@/actions/trade/analytics/calendar";
import { cn } from "@/lib/utils";

type CalendarDayCellProps = {
  day: number | null;
  data?: CalendarDayData;
  isToday?: boolean;
};

export function CalendarDayCell({ day, data, isToday }: CalendarDayCellProps) {
  if (day === null) {
    return <div className="min-h-[80px] aspect-square bg-muted/20" />;
  }

  const hasData = !!data;
  const isProfit = hasData && data.profit > 0;
  const isLoss = hasData && data.profit < 0;

  return (
    <div
      className={cn(
        "min-h-[80px] aspect-square border border-border/50 p-1.5 transition-colors flex flex-col justify-between",
        hasData && isProfit && "bg-emerald-500/40",
        hasData && isLoss && "bg-red-500/30",
        hasData && data.profit === 0 && "bg-muted/30",
        !hasData && "bg-background",
        isToday && "ring-2 ring-primary ring-inset",
      )}
    >
      <div
        className={cn(
          "text-xs md:text-sm font-medium mb-1 flex justify-end",
          isToday ? "text-primary" : "text-muted-foreground",
        )}
      >
        {day}
      </div>

      {hasData && (
        <div className="space-y-0.5 flex items-end flex-col">
          <div className={cn("text-sm md:text-xl font-bold ")}>
            {isProfit ? "" : ""}
            {data.profit.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="">
            <div className="text-[10px] text-muted-foreground">
              {data.totalTrades} trade{data.totalTrades !== 1 ? "s" : ""}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {data.winRate}% WR
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
