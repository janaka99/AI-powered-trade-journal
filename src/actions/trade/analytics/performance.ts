"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

type PerformanceStats = {
  bestTrade: {
    symbol: string;
    profit: number;
    date: Date;
  } | null;
  worstTrade: {
    symbol: string;
    profit: number;
    date: Date;
  } | null;
  largestWin: number;
  largestLoss: number;
  avgTradeDuration: string; // HH:MM:SS format
};

type GetPerformanceStatsInput = {
  accountIds: string[];
};

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 0) milliseconds = 0;

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export async function getPerformanceStatsAction(
  input: GetPerformanceStatsInput,
): Promise<ServerActionResult<PerformanceStats>> {
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
          bestTrade: null,
          worstTrade: null,
          largestWin: 0,
          largestLoss: 0,
          avgTradeDuration: "00:00:00",
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

    // Fetch best trade (highest profit)
    const [bestTradeRow] = await db
      .select({
        symbol: trade.symbol,
        profit: trade.profit,
        createdAt: trade.createdAt,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
        ),
      )
      .orderBy(desc(trade.profit))
      .limit(1);

    // Fetch worst trade (lowest profit)
    const [worstTradeRow] = await db
      .select({
        symbol: trade.symbol,
        profit: trade.profit,
        createdAt: trade.createdAt,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
        ),
      )
      .orderBy(sql`${trade.profit} ASC`)
      .limit(1);

    // Fetch largest win and largest loss
    const [aggregates] = await db
      .select({
        largestWin: sql<string>`coalesce(max(case when ${trade.profit} > 0 then ${trade.profit} else null end), 0)`,
        largestLoss: sql<string>`coalesce(min(case when ${trade.profit} < 0 then abs(${trade.profit}) else null end), 0)`,
        avgDurationMs: sql<string>`coalesce(avg(extract(epoch from (${trade.exitTime} - ${trade.entryTime})) * 1000), 0)`,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
          sql`${trade.exitTime} IS NOT NULL`,
        ),
      );

    const bestTrade = bestTradeRow
      ? {
          symbol: bestTradeRow.symbol,
          profit: toNumber(bestTradeRow.profit),
          date: bestTradeRow.createdAt,
        }
      : null;

    const worstTrade = worstTradeRow
      ? {
          symbol: worstTradeRow.symbol,
          profit: toNumber(worstTradeRow.profit),
          date: worstTradeRow.createdAt,
        }
      : null;

    const largestWin = toNumber(aggregates?.largestWin);
    const largestLoss = toNumber(aggregates?.largestLoss);
    const avgDurationMs = toNumber(aggregates?.avgDurationMs);

    const stats: PerformanceStats = {
      bestTrade,
      worstTrade,
      largestWin,
      largestLoss,
      avgTradeDuration: formatDuration(avgDurationMs),
    };

    return {
      success: true,
      message: "Performance stats fetched successfully.",
      data: stats,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch performance stats.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: undefined,
    };
  }
}
