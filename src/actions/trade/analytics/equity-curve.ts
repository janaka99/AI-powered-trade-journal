"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { headers } from "next/headers";

export type EquityCurvePoint = {
  date: string;
  equity: number;
  profit: number;
  swap: number;
  commissions: number;
  netPnl: number;
  symbol: string;
};

type EquityCurveData = {
  startingBalance: number;
  points: EquityCurvePoint[];
};

type GetEquityCurveInput = {
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

export async function getEquityCurveAction(
  input: GetEquityCurveInput,
): Promise<ServerActionResult<EquityCurveData>> {
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
        data: { startingBalance: 0, points: [] },
      };
    }

    const ownedAccounts = await db
      .select({ id: tradeAccount.id, balance: tradeAccount.balance })
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

    // Fetch all closed trades ordered by exit time
    const trades = await db
      .select({
        symbol: trade.symbol,
        profit: trade.profit,
        swap: trade.swap,
        commissions: trade.commissions,
        exitTime: trade.exitTime,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
          isNotNull(trade.exitTime),
          isNotNull(trade.profit),
        ),
      )
      .orderBy(asc(trade.exitTime));

    const startingBalance = roundToTwo(
      ownedAccounts.reduce((sum, a) => sum + toNumber(a.balance), 0),
    );

    let cumulative = startingBalance;
    const points: EquityCurvePoint[] = trades.map((t) => {
      const profit = toNumber(t.profit);
      const swap = toNumber(t.swap);
      const commissions = toNumber(t.commissions);
      const netPnl = roundToTwo(profit + swap + commissions);
      cumulative = roundToTwo(cumulative + netPnl);

      return {
        date: t.exitTime!.toISOString(),
        equity: cumulative,
        profit,
        swap,
        commissions,
        netPnl,
        symbol: t.symbol,
      };
    });

    return {
      success: true,
      message: "Equity curve data fetched successfully.",
      data: { startingBalance, points },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch equity curve data.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: undefined,
    };
  }
}
