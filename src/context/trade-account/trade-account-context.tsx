"use client";

import * as React from "react";

export type TradeAccountContextItem = {
  id: string;
  name: string;
  broker: string | null;
  type: "real" | "demo" | "backtest";
  currency: string;
  isActive: boolean;
};

type TradeAccountContextValue = {
  tradeAccounts: TradeAccountContextItem[];
  selectedTradeAccountIds: string[];
  selectedTradeAccounts: TradeAccountContextItem[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setTradeAccounts: (accounts: TradeAccountContextItem[]) => void;
  addTradeAccount: (accountId: string) => void;
  removeTradeAccount: (accountId: string) => void;
  isTradeAccountSelected: (accountId: string) => boolean;
};

const TradeAccountContext =
  React.createContext<TradeAccountContextValue | null>(null);

export function TradeAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tradeAccounts, setTradeAccountsState] = React.useState<
    TradeAccountContextItem[]
  >([]);
  const [selectedTradeAccountIds, setSelectedTradeAccountIds] = React.useState<
    string[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const setTradeAccounts = React.useCallback(
    (accounts: TradeAccountContextItem[]) => {
      setTradeAccountsState(accounts.filter((account) => account.isActive));
    },
    [],
  );

  React.useEffect(() => {
    if (tradeAccounts.length === 0) {
      setSelectedTradeAccountIds([]);
      return;
    }

    setSelectedTradeAccountIds((currentIds) => {
      const existingAccountIds = new Set(
        tradeAccounts.map((account) => account.id),
      );
      const validCurrentIds = currentIds.filter((id) =>
        existingAccountIds.has(id),
      );

      if (validCurrentIds.length > 0) {
        return validCurrentIds;
      }

      return [tradeAccounts[0].id];
    });
  }, [tradeAccounts]);

  const addTradeAccount = React.useCallback((accountId: string) => {
    setSelectedTradeAccountIds((currentIds) => {
      if (currentIds.includes(accountId)) {
        return currentIds;
      }

      return [...currentIds, accountId];
    });
  }, []);

  const removeTradeAccount = React.useCallback(
    (accountId: string) => {
      setSelectedTradeAccountIds((currentIds) => {
        const nextIds = currentIds.filter(
          (selectedId) => selectedId !== accountId,
        );

        if (nextIds.length > 0) {
          return nextIds;
        }

        if (tradeAccounts.length === 0) {
          return [];
        }

        return [tradeAccounts[0].id];
      });
    },
    [tradeAccounts],
  );

  const isTradeAccountSelected = React.useCallback(
    (accountId: string) => selectedTradeAccountIds.includes(accountId),
    [selectedTradeAccountIds],
  );

  const selectedTradeAccounts = React.useMemo(() => {
    const selectedIdSet = new Set(selectedTradeAccountIds);

    return tradeAccounts.filter((account) => selectedIdSet.has(account.id));
  }, [tradeAccounts, selectedTradeAccountIds]);

  const value = React.useMemo<TradeAccountContextValue>(
    () => ({
      tradeAccounts,
      selectedTradeAccountIds,
      selectedTradeAccounts,
      isLoading,
      setIsLoading,
      setTradeAccounts,
      addTradeAccount,
      removeTradeAccount,
      isTradeAccountSelected,
    }),
    [
      tradeAccounts,
      selectedTradeAccountIds,
      selectedTradeAccounts,
      isLoading,
      setTradeAccounts,
      addTradeAccount,
      removeTradeAccount,
      isTradeAccountSelected,
    ],
  );

  return (
    <TradeAccountContext.Provider value={value}>
      {children}
    </TradeAccountContext.Provider>
  );
}

export function useTradeAccountContext() {
  const context = React.useContext(TradeAccountContext);

  if (!context) {
    throw new Error(
      "useTradeAccountContext must be used within TradeAccountProvider.",
    );
  }

  return context;
}
