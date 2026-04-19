"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";
import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

type SymbolBreakdown = {
  symbol: string;
  totalPL: number;
  profit: number;
  swap: number;
  commissions: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
};

type SymbolBreakdownInput = {
  accountIds: string[];
  symbols?: string[];
};

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getSymbolBreakdownAction(
  input: SymbolBreakdownInput,
): Promise<ServerActionResult<SymbolBreakdown[]>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be signed in.",
        error: "UNAUTHORIZED",
        data: undefined,
      };
    }

    const accountIds = Array.from(
      new Set(input.accountIds.map((id) => id.trim())),
    ).filter(Boolean);

    if (accountIds.length === 0) {
      return {
        success: true,
        message: "No accounts selected.",
        data: [],
      };
    }

    // Security check
    const ownedAccounts = await db
      .select({ id: tradeAccount.id })
      .from(tradeAccount)
      .where(
        and(
          eq(tradeAccount.userId, session.user.id),
          inArray(tradeAccount.id, accountIds),
        ),
      );

    if (ownedAccounts.length !== accountIds.length) {
      return {
        success: false,
        message: "One or more accounts are invalid for this user.",
        error: "INVALID_ACCOUNT_SELECTION",
        data: undefined,
      };
    }

    // Build symbol filter (case-insensitive)
    const symbolFilter =
      input.symbols && input.symbols.length > 0
        ? [
            inArray(
              sql`upper(${trade.symbol})`,
              input.symbols.map((s) => s.toUpperCase()),
            ),
          ]
        : [];

    const netProfitExpr = sql`(coalesce(${trade.profit}, 0) + coalesce(${trade.swap}, 0) + coalesce(${trade.commissions}, 0))`;

    const rows = await db
      .select({
        symbol: sql<string>`upper(${trade.symbol})`,
        profit: sql<string>`coalesce(sum(${trade.profit}), 0)`,
        swap: sql<string>`coalesce(sum(${trade.swap}), 0)`,
        commissions: sql<string>`coalesce(sum(${trade.commissions}), 0)`,
        tradeCount: sql<string>`count(*)`,
        winCount: sql<string>`count(case when ${netProfitExpr} > 0 then 1 end)`,
        lossCount: sql<string>`count(case when ${netProfitExpr} < 0 then 1 end)`,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
          ...symbolFilter,
        ),
      )
      .groupBy(sql`upper(${trade.symbol})`)
      .orderBy(sql`upper(${trade.symbol})`);

    const data: SymbolBreakdown[] = rows.map((row) => {
      const profit = roundToTwo(toNumber(row.profit));
      const swap = roundToTwo(toNumber(row.swap));
      const commissions = roundToTwo(toNumber(row.commissions));
      const tradeCount = toNumber(row.tradeCount);
      const winCount = toNumber(row.winCount);
      const lossCount = toNumber(row.lossCount);
      return {
        symbol: row.symbol,
        totalPL: roundToTwo(profit + swap + commissions),
        profit,
        swap,
        commissions,
        tradeCount,
        winCount,
        lossCount,
        winRate: tradeCount > 0 ? roundToTwo((winCount / tradeCount) * 100) : 0,
      };
    });

    return {
      success: true,
      message: "Symbol breakdown fetched successfully.",
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch symbol breakdown.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: undefined,
    };
  }
}
