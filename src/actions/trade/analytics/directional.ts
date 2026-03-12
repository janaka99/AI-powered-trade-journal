"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";
import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

type DirectionalMetrics = {
  long: {
    totalTrades: number;
    winCount: number;
    winRate: number;
    totalProfit: number;
  };
  short: {
    totalTrades: number;
    winCount: number;
    winRate: number;
    totalProfit: number;
  };
  topSymbols: Array<{
    symbol: string;
    tradeCount: number;
    profit: number;
    winRate: number;
  }>;
};

type GetDirectionalAnalysisInput = {
  accountIds: string[];
};

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getDirectionalAnalysisAction(
  input: GetDirectionalAnalysisInput,
): Promise<ServerActionResult<DirectionalMetrics>> {
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
        data: {
          long: {
            totalTrades: 0,
            winCount: 0,
            winRate: 0,
            totalProfit: 0,
          },
          short: {
            totalTrades: 0,
            winCount: 0,
            winRate: 0,
            totalProfit: 0,
          },
          topSymbols: [],
        },
      };
    }

    // Security check: every requested account must belong to the current user
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

    // Long trades metrics
    const [longMetrics] = await db
      .select({
        totalTrades: sql<string>`count(*)`,
        winCount: sql<string>`count(case when ${trade.profit} > 0 then 1 end)`,
        totalProfit: sql<string>`coalesce(sum(${trade.profit}), 0)`,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
          eq(trade.direction, "long"),
        ),
      );

    // Short trades metrics
    const [shortMetrics] = await db
      .select({
        totalTrades: sql<string>`count(*)`,
        winCount: sql<string>`count(case when ${trade.profit} > 0 then 1 end)`,
        totalProfit: sql<string>`coalesce(sum(${trade.profit}), 0)`,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
          eq(trade.direction, "short"),
        ),
      );

    // Top 5 symbols by trade count
    const topSymbols = await db
      .select({
        symbol: trade.symbol,
        tradeCount: sql<string>`count(*)`,
        totalProfit: sql<string>`coalesce(sum(${trade.profit}), 0)`,
        winCount: sql<string>`count(case when ${trade.profit} > 0 then 1 end)`,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
        ),
      )
      .groupBy(trade.symbol)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    const longTotalTrades = toNumber(longMetrics?.totalTrades);
    const longWinCount = toNumber(longMetrics?.winCount);
    const longProfit = toNumber(longMetrics?.totalProfit);

    const shortTotalTrades = toNumber(shortMetrics?.totalTrades);
    const shortWinCount = toNumber(shortMetrics?.winCount);
    const shortProfit = toNumber(shortMetrics?.totalProfit);

    const metrics: DirectionalMetrics = {
      long: {
        totalTrades: longTotalTrades,
        winCount: longWinCount,
        winRate:
          longTotalTrades > 0
            ? roundToTwo((longWinCount / longTotalTrades) * 100)
            : 0,
        totalProfit: roundToTwo(longProfit),
      },
      short: {
        totalTrades: shortTotalTrades,
        winCount: shortWinCount,
        winRate:
          shortTotalTrades > 0
            ? roundToTwo((shortWinCount / shortTotalTrades) * 100)
            : 0,
        totalProfit: roundToTwo(shortProfit),
      },
      topSymbols: topSymbols.map((symbol) => {
        const tradeCount = toNumber(symbol.tradeCount);
        const winCount = toNumber(symbol.winCount);
        return {
          symbol: symbol.symbol,
          tradeCount,
          profit: roundToTwo(toNumber(symbol.totalProfit)),
          winRate:
            tradeCount > 0 ? roundToTwo((winCount / tradeCount) * 100) : 0,
        };
      }),
    };

    return {
      success: true,
      message: "Directional analysis fetched successfully.",
      data: metrics,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch directional analysis.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: undefined,
    };
  }
}
