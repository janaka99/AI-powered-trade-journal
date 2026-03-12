"use client";

import { getActivityStatsAction } from "@/actions/trade/analytics/activity";
import { useActionSWR } from "@/hooks/use-action-swr";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ActivityStats({ className }: { className?: string }) {
  const { selectedTradeAccountIds: accountIds } = useTradeAccountContext();

  const { data, isLoading, error, revalidate } = useActionSWR(
    getActivityStatsAction,
    { accountIds },
  );

  if (isLoading) {
    return <ActivityStatsSkeleton />;
  }

  if (error || !data) {
    return <ActivityStatsError onRetry={revalidate} />;
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Activity & Frequency</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <GridStatItem
            label="Today"
            value={data.tradesToday.toString()}
            icon={<Calendar className="size-4" />}
          />

          <GridStatItem
            label="This Week"
            value={data.tradesThisWeek.toString()}
            icon={<Calendar className="size-4" />}
          />

          <GridStatItem
            label="This Month"
            value={data.tradesThisMonth.toString()}
            icon={<Calendar className="size-4" />}
          />
        </div>

        <div className="space-y-3">
          <StatItem
            label="Active Trading Days"
            value={data.activeTradingDays.toString()}
            subtext="Total unique days with trades"
            icon={<Calendar className="size-4" />}
          />

          <StatItem
            label="Most Active Hour"
            value={
              data.mostActiveHour
                ? `${String(data.mostActiveHour.hour).padStart(2, "0")}:00`
                : "No data"
            }
            subtext={
              data.mostActiveHour
                ? `${data.mostActiveHour.count} trades`
                : undefined
            }
            icon={<Clock className="size-4" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Sub-components ====================

type GridStatItemProps = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

function GridStatItem({ label, value, icon }: GridStatItemProps) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4 flex flex-col items-center gap-2 text-center">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

type StatItemProps = {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  className?: string;
};

function StatItem({ label, value, subtext, icon, className }: StatItemProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 ${className}`}
    >
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <p className="text-sm font-medium text-foreground">{label}</p>
        </div>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>

      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ActivityStatsSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>

      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b pb-4 last:border-0"
          >
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityStatsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="w-full">
      <CardContent className="py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="size-10 text-destructive" />

          <div className="space-y-1">
            <p className="font-medium">Failed to load activity stats</p>
            <p className="text-sm text-muted-foreground">
              There was an error loading your activity data.
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
