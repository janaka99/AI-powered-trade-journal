"use client";

import { useState } from "react";
import { format } from "date-fns";
import { getAllTradesAction } from "@/actions/trade/all-trades";
import { listTradeSymbolsAction } from "@/actions/trade/list-symbols";
import { deleteTradeAction } from "@/actions/trade/delete";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/common/pagination";
import ConfirmationDialog from "@/components/common/confirmation-dialog";
import EditTradeDialog from "./edit-trade-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertCircle,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type OrderByField = "exitTime" | "entryTime" | "exitPrice";
type OrderByDirection = "asc" | "desc";

const ORDER_OPTIONS = [
  { value: "exitTime-desc", label: "Exit Time (Newest)" },
  { value: "exitTime-asc", label: "Exit Time (Oldest)" },
  { value: "entryTime-desc", label: "Entry Time (Newest)" },
  { value: "entryTime-asc", label: "Entry Time (Oldest)" },
  { value: "exitPrice-desc", label: "Exit Price (High to Low)" },
  { value: "exitPrice-asc", label: "Exit Price (Low to High)" },
] as const;

const ITEMS_PER_PAGE = 20;

export default function TradesList() {
  const { selectedTradeAccountIds: accountIds } = useTradeAccountContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<OrderByField>("exitTime");
  const [orderDirection, setOrderDirection] =
    useState<OrderByDirection>("desc");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

  const { data: symbols } = useActionSWR(listTradeSymbolsAction, accountIds);

  const { data, isLoading, error, revalidate } = useActionSWR(
    getAllTradesAction,
    {
      accountIds,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      orderBy,
      orderDirection,
      symbols: selectedSymbols.length > 0 ? selectedSymbols : undefined,
    },
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  const handleToggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol],
    );
    setCurrentPage(1);
  };

  const handleClearSymbols = () => {
    setSelectedSymbols([]);
    setCurrentPage(1);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Latest Trades</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SymbolFilter
              symbols={symbols ?? []}
              selected={selectedSymbols}
              onToggle={handleToggleSymbol}
              onClear={handleClearSymbols}
            />
            <Select
              value={`${orderBy}-${orderDirection}`}
              onValueChange={(value) => {
                const [field, dir] = value.split("-") as [
                  OrderByField,
                  OrderByDirection,
                ];
                setOrderBy(field);
                setOrderDirection(dir);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger size="sm" className="h-8">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePicker
              label="From"
              date={startDate}
              onSelect={(date) => {
                setStartDate(date);
                setCurrentPage(1);
              }}
              toDate={endDate}
            />
            <DatePicker
              label="To"
              date={endDate}
              onSelect={(date) => {
                setEndDate(date);
                setCurrentPage(1);
              }}
              fromDate={startDate}
            />
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearDates}
                className="size-8"
              >
                <X className="size-4" />
                <span className="sr-only">Clear dates</span>
              </Button>
            )}
          </div>
        </div>
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
                <TableHead className="text-right">Swap</TableHead>
                <TableHead className="text-right">Commissions</TableHead>
                <TableHead className="text-right">Profit/Loss</TableHead>
                <TableHead className="text-right pr-3">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {trades.map((trade) => (
                <TradeRow key={trade.id} trade={trade} onMutate={revalidate} />
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

type SymbolFilterProps = {
  symbols: string[];
  selected: string[];
  onToggle: (symbol: string) => void;
  onClear: () => void;
};

function SymbolFilter({
  symbols,
  selected,
  onToggle,
  onClear,
}: SymbolFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 justify-start text-left font-normal",
            selected.length === 0 && "text-muted-foreground",
          )}
        >
          <ChevronsUpDown className="mr-2 size-3.5" />
          {selected.length > 0
            ? `${selected.length} symbol${selected.length > 1 ? "s" : ""}`
            : "All Symbols"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <div className="max-h-60 overflow-y-auto p-1">
          {symbols.length === 0 ? (
            <p className="p-2 text-center text-sm text-muted-foreground">
              No symbols found
            </p>
          ) : (
            symbols.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => onToggle(symbol)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <div
                  className={cn(
                    "flex size-4 items-center justify-center rounded-sm border",
                    selected.includes(symbol)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/25",
                  )}
                >
                  {selected.includes(symbol) && <Check className="size-3" />}
                </div>
                {symbol}
              </button>
            ))
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-1">
            <button
              type="button"
              onClick={onClear}
              className="w-full rounded-sm px-2 py-1.5 text-center text-sm hover:bg-accent hover:text-accent-foreground"
            >
              Clear filters
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

type DatePickerProps = {
  label: string;
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  fromDate?: Date;
  toDate?: Date;
};

function DatePicker({
  label,
  date,
  onSelect,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 size-3.5" />
          {date ? format(date, "MMM dd, yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(day) => {
            onSelect(day);
            setOpen(false);
          }}
          fromDate={fromDate}
          toDate={toDate}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

type TradeRowProps = {
  trade: {
    id: string;
    accountId: string;
    symbol: string;
    direction: "long" | "short";
    entryPrice: string;
    exitPrice: string | null;
    entryTime: Date;
    exitTime: Date | null;
    risk: string | null;
    profit: string | null;
    swap: string | null;
    commissions: string | null;
    notes: string | null;
  };
  onMutate: () => void;
};

function TradeRow({ trade, onMutate }: TradeRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const profit = trade.profit ? parseFloat(trade.profit) : null;
  const isOpen = !trade.exitPrice || !trade.exitTime;

  async function handleDelete() {
    const result = await deleteTradeAction(trade.id);
    if (result.success) {
      toast.success(result.message);
      onMutate();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <>
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

        <TableCell className="text-right">
          {trade.swap ? (
            <span
              className={
                parseFloat(trade.swap) > 0
                  ? "text-green-600 dark:text-green-400"
                  : parseFloat(trade.swap) < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
              }
            >
              {formatCurrency(parseFloat(trade.swap))}
            </span>
          ) : (
            "-"
          )}
        </TableCell>

        <TableCell className="text-right">
          {trade.commissions ? (
            <span
              className={
                parseFloat(trade.commissions) > 0
                  ? "text-green-600 dark:text-green-400"
                  : parseFloat(trade.commissions) < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
              }
            >
              {formatCurrency(parseFloat(trade.commissions))}
            </span>
          ) : (
            "-"
          )}
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

        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <ConfirmationDialog
                title="Delete trade"
                description="Are you sure you want to delete this trade? This action cannot be undone."
                confirmText="Delete"
                onConfirm={handleDelete}
                trigger={
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <EditTradeDialog
        trade={trade}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onMutate}
      />
    </>
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
