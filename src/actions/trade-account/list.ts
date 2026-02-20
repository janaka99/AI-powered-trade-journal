"use server";

import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { auth } from "@/lib/auth/auth";

type TradeAccountListItem = {
  id: string;
  name: string;
  broker: string | null;
  type: "real" | "demo" | "backtest";
  currency: string;
  isActive: boolean;
};

type ListTradeAccountsActionResult = {
  success: boolean;
  message?: string;
  tradeAccounts: TradeAccountListItem[];
};

export async function listTradeAccountsAction(): Promise<ListTradeAccountsActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be signed in.",
      tradeAccounts: [],
    };
  }

  const tradeAccounts = await db
    .select({
      id: tradeAccount.id,
      name: tradeAccount.name,
      broker: tradeAccount.broker,
      type: tradeAccount.type,
      currency: tradeAccount.currency,
      isActive: tradeAccount.isActive,
    })
    .from(tradeAccount)
    .where(eq(tradeAccount.userId, session.user.id))
    .orderBy(desc(tradeAccount.createdAt));

  return {
    success: true,
    tradeAccounts,
  };
}
