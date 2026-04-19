"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";
import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

type AnalyticsData = {
  netPL: number;
  profitFactor: number;
  averageWinLoss: number;
  tradeWinRate: number;
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

// Net P/L = sum of all closed trade profits (wins + losses).
function calculateNetPL(totalProfit: number): number {
  return roundToTwo(totalProfit);
}

// Profit Factor = gross profit / gross loss (absolute). Returns 0 when no losses.
function calculateProfitFactor(
  grossProfit: number,
  grossLossAbs: number,
): number {
  if (grossLossAbs <= 0) {
    return 0;
  }

  return roundToTwo(grossProfit / grossLossAbs);
}

// Average Win/Loss = average winning trade / average losing trade (absolute).
function calculateAverageWinLoss(avgWin: number, avgLossAbs: number): number {
  if (avgLossAbs <= 0) {
    return 0;
  }

  return roundToTwo(avgWin / avgLossAbs);
}

// Trade Win Rate (%) = winning trades / total closed trades * 100.
function calculateTradeWinRate(
  winCount: number,
  closedTradeCount: number,
): number {
  if (closedTradeCount <= 0) {
    return 0;
  }

  return roundToTwo((winCount / closedTradeCount) * 100);
}

export async function getAnalyticsAction(
  accounts: string[],
): Promise<ServerActionResult<AnalyticsData>> {
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
      new Set(accounts.map((id) => id.trim())),
    ).filter(Boolean);

    if (accountIds.length === 0) {
      return {
        success: true,
        message: "No accounts selected. Returning empty analytics.",
        data: {
          netPL: 0,
          profitFactor: 0,
          averageWinLoss: 0,
          tradeWinRate: 0,
        },
      };
    }

    // Security check: every requested account must belong to the current user.
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

    const netProfitExpr = sql`(coalesce(${trade.profit}, 0) + coalesce(${trade.swap}, 0) + coalesce(${trade.commissions}, 0))`;

    const [aggregates] = await db
      .select({
        totalProfit: sql<string>`coalesce(sum(${netProfitExpr}), 0)`,
        sumProfit: sql<string>`coalesce(sum(${trade.profit}), 0)`,
        sumSwap: sql<string>`coalesce(sum(${trade.swap}), 0)`,
        sumCommissions: sql<string>`coalesce(sum(${trade.commissions}), 0)`,
        grossProfit: sql<string>`coalesce(sum(case when ${netProfitExpr} > 0 then ${netProfitExpr} else 0 end), 0)`,
        grossLossAbs: sql<string>`coalesce(sum(case when ${netProfitExpr} < 0 then abs(${netProfitExpr}) else 0 end), 0)`,
        avgWin: sql<string>`coalesce(avg(case when ${netProfitExpr} > 0 then ${netProfitExpr} end), 0)`,
        avgLossAbs: sql<string>`coalesce(avg(case when ${netProfitExpr} < 0 then abs(${netProfitExpr}) end), 0)`,
        winCount: sql<string>`count(case when ${netProfitExpr} > 0 then 1 end)`,
        closedTradeCount: sql<string>`count(${trade.profit})`,
      })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, accountIds),
        ),
      );

    const totalProfit = toNumber(aggregates?.totalProfit);
    const sumProfit = toNumber(aggregates?.sumProfit);
    const sumSwap = toNumber(aggregates?.sumSwap);
    const sumCommissions = toNumber(aggregates?.sumCommissions);
    const grossProfit = toNumber(aggregates?.grossProfit);
    const grossLossAbs = toNumber(aggregates?.grossLossAbs);
    const avgWin = toNumber(aggregates?.avgWin);
    const avgLossAbs = toNumber(aggregates?.avgLossAbs);
    const winCount = toNumber(aggregates?.winCount);
    const closedTradeCount = toNumber(aggregates?.closedTradeCount);

    // console.log("[Analytics Debug]", {
    //   sumProfit,
    //   sumSwap,
    //   sumCommissions,
    //   totalProfit,
    //   manualTotal: sumProfit + sumSwap + sumCommissions,
    //   grossProfit,
    //   grossLossAbs,
    //   closedTradeCount,
    // });

    const analyticsData: AnalyticsData = {
      netPL: calculateNetPL(totalProfit),
      profitFactor: calculateProfitFactor(grossProfit, grossLossAbs),
      averageWinLoss: calculateAverageWinLoss(avgWin, avgLossAbs),
      tradeWinRate: calculateTradeWinRate(winCount, closedTradeCount),
    };

    return {
      success: true,
      message: "Analytics data fetched successfully",
      data: analyticsData,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch analytics data.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: undefined,
    };
  }
}
