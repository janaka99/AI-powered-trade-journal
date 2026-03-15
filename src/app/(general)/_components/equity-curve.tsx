"use client";

import {
  getEquityCurveAction,
  type EquityCurvePoint,
} from "@/actions/trade/analytics/equity-curve";
import { useActionSWR } from "@/hooks/use-action-swr";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function EquityCurve({ className }: { className?: string }) {
  const { selectedTradeAccountIds: accountIds } = useTradeAccountContext();

  const { data, isLoading, error, revalidate } = useActionSWR(
    getEquityCurveAction,
    { accountIds },
  );

  if (isLoading) {
    return <EquityCurveSkeleton />;
  }

  if (error || !data) {
    return <EquityCurveError onRetry={revalidate} />;
  }

  if (data.points.length === 0) {
    return <EquityCurveEmpty />;
  }

  const chartData = data.points.map((point) => ({
    ...point,
    date: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    fullDate: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const minEquity = Math.min(...data.points.map((p) => p.equity));
  const maxEquity = Math.max(...data.points.map((p) => p.equity));
  const padding = Math.max(Math.abs(maxEquity - minEquity) * 0.1, 10);
  const finalEquity = data.points[data.points.length - 1].equity;
  const pnl = finalEquity - data.startingBalance;
  const isPositive = pnl >= 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Equity Curve</CardTitle>
          <p className="text-sm text-muted-foreground">
            Balance: {formatCurrency(data.startingBalance)} &rarr;{" "}
            {formatCurrency(finalEquity)}
          </p>
        </div>
        <span
          className={`text-lg font-bold ${
            isPositive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {formatCurrency(pnl)}
        </span>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="equityGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="equityRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `${Math.round(value)}`}
                domain={[minEquity - padding, maxEquity + padding]}
              />
              <Tooltip content={<EquityCurveTooltip />} />
              <Area
                type="monotone"
                dataKey="equity"
                stroke={isPositive ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                fill={isPositive ? "url(#equityGreen)" : "url(#equityRed)"}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function EquityCurveTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: EquityCurvePoint & { fullDate: string };
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-xs text-muted-foreground mb-1.5">{data.fullDate}</p>
      <p className="text-sm font-medium mb-1">{data.symbol}</p>
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Profit:</span>
          <span
            className={data.profit >= 0 ? "text-green-600" : "text-red-600"}
          >
            {formatCurrency(data.profit)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Swap:</span>
          <span className={data.swap >= 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(data.swap)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Commissions:</span>
          <span
            className={
              data.commissions >= 0 ? "text-green-600" : "text-red-600"
            }
          >
            {formatCurrency(data.commissions)}
          </span>
        </div>
        <div className="flex justify-between gap-4 border-t pt-0.5 mt-0.5">
          <span className="text-muted-foreground font-medium">Net P&L:</span>
          <span
            className={`font-medium ${
              data.netPnl >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(data.netPnl)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground font-medium">Equity:</span>
          <span
            className={`font-bold ${
              data.equity >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(data.equity)}
          </span>
        </div>
      </div>
    </div>
  );
}

function EquityCurveSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

function EquityCurveError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="w-full">
      <CardContent className="py-10">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium">Failed to load equity curve</p>
            <p className="text-sm text-muted-foreground">
              There was an error loading the data. Please try again.
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

function EquityCurveEmpty() {
  return (
    <Card className="w-full">
      <CardContent className="py-10">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            No closed trades found to build an equity curve.
          </p>
          <p className="text-xs text-muted-foreground">
            Close some trades to see your balance curve.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
