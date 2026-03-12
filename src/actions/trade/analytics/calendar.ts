"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";
import { and, eq, inArray, sql, gte, lt, isNotNull } from "drizzle-orm";
import { headers } from "next/headers";

export type CalendarDayData = {
  date: string; // YYYY-MM-DD
  totalTrades: number;
  wins: number;
  losses: number;
  profit: number;
  winRate: number;
};

export type CalendarMonthData = {
  days: CalendarDayData[];
};

type GetCalendarDataInput = {
  accountIds: string[];
  year: number;
  month: number; // 0-indexed (0 = January)
};

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getCalendarDataAction(
  input: GetCalendarDataInput,
): Promise<ServerActionResult<CalendarMonthData>> {
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
        data: { days: [] },
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

    const monthStart = new Date(input.year, input.month, 1);
    const monthEnd = new Date(input.year, input.month + 1, 1);

    // Fetch daily aggregates grouped by exit date
    const rows = await db
      .select({
        date: sql<string>`${trade.exitTime}::date`,
        totalTrades: sql<string>`count(*)`,
        wins: sql<string>`count(*) filter (where ${trade.profit} > 0)`,
        losses: sql<string>`count(*) filter (where ${trade.profit} <= 0)`,
        profit: sql<string>`coalesce(sum(${trade.profit}), 0)`,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
          isNotNull(trade.exitTime),
          gte(trade.exitTime, monthStart),
          lt(trade.exitTime, monthEnd),
        ),
      )
      .groupBy(sql`${trade.exitTime}::date`)
      .orderBy(sql`${trade.exitTime}::date`);

    const days: CalendarDayData[] = rows.map((row) => {
      const totalTrades = toNumber(row.totalTrades);
      const wins = toNumber(row.wins);
      return {
        date: row.date,
        totalTrades,
        wins,
        losses: toNumber(row.losses),
        profit: Math.round(toNumber(row.profit) * 100) / 100,
        winRate: totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0,
      };
    });

    return {
      success: true,
      message: "Calendar data fetched successfully.",
      data: { days },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch calendar data.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: undefined,
    };
  }
}
