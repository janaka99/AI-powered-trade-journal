"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";
import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

type ActivityStats = {
  tradesToday: number;
  tradesThisWeek: number;
  tradesThisMonth: number;
  activeTradingDays: number;
  mostActiveHour: {
    hour: number;
    count: number;
  } | null;
};

type GetActivityStatsInput = {
  accountIds: string[];
};

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getActivityStatsAction(
  input: GetActivityStatsInput,
): Promise<ServerActionResult<ActivityStats>> {
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
          tradesToday: 0,
          tradesThisWeek: 0,
          tradesThisMonth: 0,
          activeTradingDays: 0,
          mostActiveHour: null,
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

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Trades today
    const [{ tradesToday }] = await db
      .select({ tradesToday: sql<string>`count(*)` })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
          sql`${trade.createdAt}::date = ${startOfToday}::date`,
        ),
      );

    // Trades this week
    const [{ tradesThisWeek }] = await db
      .select({ tradesThisWeek: sql<string>`count(*)` })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
          sql`${trade.createdAt} >= ${startOfWeek}`,
        ),
      );

    // Trades this month
    const [{ tradesThisMonth }] = await db
      .select({ tradesThisMonth: sql<string>`count(*)` })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
          sql`${trade.createdAt} >= ${startOfMonth}`,
        ),
      );

    // Active trading days (unique days with trades)
    const [{ activeTradingDays }] = await db
      .select({
        activeTradingDays: sql<string>`count(distinct ${trade.createdAt}::date)`,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
        ),
      );

    // Most active hour
    const [mostActiveHourRow] = await db
      .select({
        hour: sql<string>`extract(hour from ${trade.createdAt})`,
        count: sql<string>`count(*)`,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
        ),
      )
      .groupBy(sql`extract(hour from ${trade.createdAt})`)
      .orderBy(sql`count(*) DESC`)
      .limit(1);

    const stats: ActivityStats = {
      tradesToday: toNumber(tradesToday),
      tradesThisWeek: toNumber(tradesThisWeek),
      tradesThisMonth: toNumber(tradesThisMonth),
      activeTradingDays: toNumber(activeTradingDays),
      mostActiveHour: mostActiveHourRow
        ? {
            hour: Math.floor(toNumber(mostActiveHourRow.hour)),
            count: toNumber(mostActiveHourRow.count),
          }
        : null,
    };

    return {
      success: true,
      message: "Activity stats fetched successfully.",
      data: stats,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch activity stats.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: undefined,
    };
  }
}
