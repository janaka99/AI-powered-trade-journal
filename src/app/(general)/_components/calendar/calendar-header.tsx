"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type CalendarHeaderProps = {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

export function CalendarHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">
        {MONTH_NAMES[month]} {year}
      </h3>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={onPrevMonth}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={onNextMonth}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
