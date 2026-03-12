"use server";

import { and, desc, eq, ilike } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";

type TradeAccountOption = {
  id: string;
  name: string;
  type: "real" | "demo" | "backtest";
  currency: string;
  isActive: boolean;
};

type ListTradeAccountsInput = {
  search?: string;
};

export async function listTradeAccountsForTradeAction(
  input: ListTradeAccountsInput,
): Promise<ServerActionResult<TradeAccountOption[]>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be signed in.",
      error: "UNAUTHORIZED",
      data: [],
    };
  }

  try {
    const search = input.search?.trim();
    const whereCondition = search
      ? and(
          eq(tradeAccount.userId, session.user.id),
          ilike(tradeAccount.name, `%${search}%`),
        )
      : eq(tradeAccount.userId, session.user.id);

    const accounts = await db
      .select({
        id: tradeAccount.id,
        name: tradeAccount.name,
        type: tradeAccount.type,
        currency: tradeAccount.currency,
        isActive: tradeAccount.isActive,
      })
      .from(tradeAccount)
      .where(whereCondition)
      .orderBy(desc(tradeAccount.createdAt));

    return {
      success: true,
      message: "Trade accounts fetched successfully.",
      data: accounts,
    };
  } catch {
    return {
      success: false,
      message: "Failed to fetch trade accounts.",
      error: "FETCH_FAILED",
      data: [],
    };
  }
}
