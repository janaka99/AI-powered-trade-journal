"use client";

import { useState } from "react";
import { getAllTradesAction } from "@/actions/trade/all-trades";
import { useActionSWR } from "@/hooks/use-action-swr";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/common/pagination";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 20;

export default function TradesList() {
  const { selectedTradeAccountIds: accountIds } = useTradeAccountContext();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error, revalidate } = useActionSWR(
    getAllTradesAction,
    {
      accountIds,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    },
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return <TradesListSkeleton />;
  }

  if (error || !data) {
    return <TradesListError onRetry={revalidate} />;
  }

  const { trades, pagination } = data;

  if (trades.length === 0) {
    return <TradesListEmpty />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Latest Trades</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Exit Price</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Exit Time</TableHead>
                <TableHead className="text-right">Profit/Loss</TableHead>
                <TableHead className="text-right pr-3">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {trades.map((trade) => (
                <TradeRow key={trade.id} trade={trade} />
              ))}
            </TableBody>
          </Table>
        </div>

        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            isLoading={isLoading}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Sub-components ====================

type TradeRowProps = {
  trade: {
    id: string;
    symbol: string;
    direction: "long" | "short";
    entryPrice: string;
    exitPrice: string | null;
    entryTime: Date;
    exitTime: Date | null;
    profit: string | null;
  };
};

function TradeRow({ trade }: TradeRowProps) {
  const profit = trade.profit ? parseFloat(trade.profit) : null;
  const isOpen = !trade.exitPrice || !trade.exitTime;

  return (
    <TableRow>
      <TableCell className="font-medium">{trade.symbol}</TableCell>

      <TableCell>
        <Badge
          variant={trade.direction === "long" ? "default" : "secondary"}
          className="capitalize"
        >
          {trade.direction === "long" ? (
            <TrendingUp className="mr-1" />
          ) : (
            <TrendingDown className="mr-1" />
          )}
          {trade.direction}
        </Badge>
      </TableCell>

      <TableCell>{formatPrice(trade.entryPrice)}</TableCell>

      <TableCell>
        {trade.exitPrice ? formatPrice(trade.exitPrice) : "-"}
      </TableCell>

      <TableCell>{formatDateTime(trade.entryTime)}</TableCell>

      <TableCell>
        {trade.exitTime ? formatDateTime(trade.exitTime) : "-"}
      </TableCell>

      <TableCell className="text-right font-medium">
        {profit !== null ? (
          <span
            className={
              profit > 0
                ? "text-green-600 dark:text-green-400"
                : profit < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
            }
          >
            {profit > 0 ? "+" : ""}
            {formatCurrency(profit)}
          </span>
        ) : (
          "-"
        )}
      </TableCell>

      <TableCell className="text-right">
        <Badge variant={isOpen ? "outline" : "secondary"}>
          {isOpen ? "Open" : "Closed"}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

function TradesListSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TradesListError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="w-full">
      <CardContent className="py-10">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="size-10 text-destructive" />

          <div className="space-y-1">
            <p className="font-medium">Failed to load trades</p>
            <p className="text-sm text-muted-foreground">
              There was an error loading your trades. Please try again.
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

function TradesListEmpty() {
  return (
    <Card className="w-full">
      <CardContent className="py-10">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            No trades found for the selected accounts.
          </p>
          <p className="text-xs text-muted-foreground">
            Add your first trade to get started.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Utility functions ====================

function formatPrice(price: string): string {
  const num = parseFloat(price);
  return num.toFixed(5);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
