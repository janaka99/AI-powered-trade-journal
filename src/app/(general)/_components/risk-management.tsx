"use client";

import { getRiskMetricsAction } from "@/actions/trade/analytics/risk";
import { useActionSWR } from "@/hooks/use-action-swr";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RiskManagement({ className }: { className?: string }) {
  const { selectedTradeAccountIds: accountIds } = useTradeAccountContext();

  const { data, isLoading, error, revalidate } = useActionSWR(
    getRiskMetricsAction,
    { accountIds },
  );

  if (isLoading) {
    return <RiskManagementSkeleton />;
  }

  if (error || !data) {
    return <RiskManagementError onRetry={revalidate} />;
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Risk Management</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <RiskStatItem
          label="Maximum Drawdown"
          value={formatCurrency(data.maxDrawdown)}
          subtext="Peak-to-trough decline"
          icon={
            <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
          }
          isWarning={data.maxDrawdown > 0}
        />

        <RiskStatItem
          label="Average Risk Per Trade"
          value={formatCurrency(data.avgRiskPerTrade)}
          subtext="Average risk exposure"
        />

        <RiskStatItem
          label="Risk Reward Ratio"
          value={data.riskRewardRatio.toFixed(2)}
          subtext="Profit per unit of risk"
          isPositive={data.riskRewardRatio >= 1}
        />

        <RiskStatItem
          label="Profitable R:R Trades"
          value={`${data.profitableRiskRewardTrades}`}
          subtext="Trades with positive risk reward"
        />

        <RiskStatItem
          label="Total Risk Taken"
          value={formatCurrency(data.totalRiskTaken)}
          subtext="Cumulative risk exposure"
        />
      </CardContent>
    </Card>
  );
}

// ==================== Sub-components ====================

type RiskStatItemProps = {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  isWarning?: boolean;
  isPositive?: boolean;
};

function RiskStatItem({
  label,
  value,
  subtext,
  icon,
  isWarning,
  isPositive,
}: RiskStatItemProps) {
  return (
    <div className="flex items-start justify-between border-b pb-4 last:border-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon && icon}
          <p className="text-sm font-medium text-foreground">{label}</p>
        </div>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>

      <div
        className={`text-lg font-semibold ${
          isWarning
            ? "text-red-600 dark:text-red-400"
            : isPositive
              ? "text-green-600 dark:text-green-400"
              : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function RiskManagementSkeleton() {
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
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RiskManagementError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="w-full">
      <CardContent className="py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="size-10 text-destructive" />

          <div className="space-y-1">
            <p className="font-medium">Failed to load risk metrics</p>
            <p className="text-sm text-muted-foreground">
              There was an error loading your risk data.
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
