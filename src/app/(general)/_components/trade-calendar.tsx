"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getCalendarDataAction,
  type CalendarDayData,
} from "@/actions/trade/analytics/calendar";
import { useActionSWR } from "@/hooks/use-action-swr";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarHeader } from "./calendar/calendar-header";
import { CalendarDayCell } from "./calendar/calendar-day-cell";
import {
  CalendarWeekSummary,
  type WeekSummary,
} from "./calendar/calendar-week-summary";
import { CalendarMonthSummary } from "./calendar/calendar-month-summary";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TradeCalendar({ className }: { className?: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { selectedTradeAccountIds: accountIds } = useTradeAccountContext();

  const { data, isLoading, error, revalidate } = useActionSWR(
    getCalendarDataAction,
    { accountIds, year, month },
  );

  const handlePrevMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }, [month, year]);

  const handleNextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }, [month, year]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }, []);

  // Build a map of date string -> CalendarDayData
  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDayData>();
    if (data?.days) {
      for (const day of data.days) {
        // Normalize date to YYYY-MM-DD
        const dateStr = day.date.slice(0, 10);
        map.set(dateStr, day);
      }
    }
    return map;
  }, [data]);

  // Calendar grid calculation
  const { weeks, todayStr } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr =
      today.getFullYear() === year && today.getMonth() === month
        ? `${year}-${String(month + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
        : null;

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    // Fill leading empty cells
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill trailing empty cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return { weeks, todayStr };
  }, [year, month]);

  // Calculate weekly summaries
  const weekSummaries = useMemo(() => {
    return weeks.map((week) => {
      let totalTrades = 0;
      let wins = 0;
      let profit = 0;

      for (const day of week) {
        if (day === null) continue;
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayData = dayMap.get(dateStr);
        if (dayData) {
          totalTrades += dayData.totalTrades;
          wins += dayData.wins;
          profit += dayData.profit;
        }
      }

      if (totalTrades === 0) return null;

      return {
        totalTrades,
        wins,
        profit: Math.round(profit * 100) / 100,
        winRate: Math.round((wins / totalTrades) * 100),
      } satisfies WeekSummary;
    });
  }, [weeks, dayMap, year, month]);

  if (isLoading) {
    return <TradeCalendarSkeleton />;
  }

  if (error || !data) {
    return <TradeCalendarError onRetry={revalidate} />;
  }

  return (
    <Card className={`w-full ${className ?? ""}`}>
      <CardHeader>
        <CalendarHeader
          year={year}
          month={month}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />
      </CardHeader>

      <CardContent>
        {/* Header row */}
        <div className="grid grid-cols-8 gap-px mb-px">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid gap-px">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-8 gap-px">
              {week.map((day, dayIndex) => {
                const dateStr = day
                  ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  : null;

                return (
                  <CalendarDayCell
                    key={dayIndex}
                    day={day}
                    data={dateStr ? dayMap.get(dateStr) : undefined}
                    isToday={dateStr === todayStr}
                  />
                );
              })}
              <CalendarWeekSummary
                summary={weekSummaries[weekIndex]}
                weekNumber={weekIndex + 1}
              />
            </div>
          ))}
        </div>

        <CalendarMonthSummary days={data.days} />
      </CardContent>
    </Card>
  );
}

// ==================== Loading & Error ====================

function TradeCalendarSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-px">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-8" />
          ))}
        </div>
        <div className="grid gap-px mt-px">
          {Array.from({ length: 5 }).map((_, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-8 gap-px">
              {Array.from({ length: 8 }).map((_, dayIdx) => (
                <Skeleton key={dayIdx} className="h-[80px]" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TradeCalendarError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="w-full">
      <CardContent className="py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium">Failed to load calendar data</p>
            <p className="text-sm text-muted-foreground">
              There was an error loading your trade calendar.
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
