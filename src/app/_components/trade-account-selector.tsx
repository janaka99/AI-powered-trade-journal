"use client";

import * as React from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { ChevronDown, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { listTradeAccountsAction } from "@/actions/trade-account/list";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTradeAccountContext,
  type TradeAccountContextItem,
} from "@/context/trade-account/trade-account-context";

export default function TradeAccountSelector() {
  const {
    tradeAccounts,
    selectedTradeAccountIds,
    setTradeAccounts,
    addTradeAccount,
    removeTradeAccount,
    isTradeAccountSelected,
  } = useTradeAccountContext();

  const [isLoading, setIsLoading] = React.useState(true);

  const fetchTradeAccounts = React.useCallback(async () => {
    setIsLoading(true);

    const result = await listTradeAccountsAction();

    if (!result.success) {
      toast.error(result.message || "Failed to load trade accounts.");
      setTradeAccounts([]);
      setIsLoading(false);
      return;
    }

    setTradeAccounts(result.tradeAccounts as TradeAccountContextItem[]);
    setIsLoading(false);
  }, [setTradeAccounts]);

  React.useEffect(() => {
    void fetchTradeAccounts();

    const handleRefresh = () => {
      void fetchTradeAccounts();
    };

    window.addEventListener("trade-accounts:refresh", handleRefresh);

    return () => {
      window.removeEventListener("trade-accounts:refresh", handleRefresh);
    };
  }, [fetchTradeAccounts]);

  function handleToggleTradeAccount(accountId: string, checked: CheckedState) {
    if (checked === true) {
      addTradeAccount(accountId);
      return;
    }

    removeTradeAccount(accountId);
  }

  if (isLoading) {
    return <Skeleton className="h-9 w-32" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-32 justify-between">
          <span className="inline-flex items-center gap-2">
            <WalletCards />
            Accounts
          </span>
          <span className="text-xs text-muted-foreground">
            {selectedTradeAccountIds.length}
          </span>
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
          Select active trade accounts
        </div>
        <DropdownMenuSeparator />

        {tradeAccounts.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No trade accounts available.
          </div>
        ) : (
          tradeAccounts.map((account) => (
            <DropdownMenuItem
              key={account.id}
              className="gap-3"
              onSelect={(event) => event.preventDefault()}
            >
              <Checkbox
                checked={isTradeAccountSelected(account.id)}
                onCheckedChange={(checked) =>
                  handleToggleTradeAccount(account.id, checked)
                }
                aria-label={`Select ${account.name}`}
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {account.name}
                </span>
                <span className="text-muted-foreground text-xs capitalize">
                  {account.type}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
