"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";
import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

type RiskMetrics = {
  maxDrawdown: number;
  avgRiskPerTrade: number;
  profitableRiskRewardTrades: number;
  riskRewardRatio: number;
  totalRiskTaken: number;
};

type GetRiskMetricsInput = {
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

export async function getRiskMetricsAction(
  input: GetRiskMetricsInput,
): Promise<ServerActionResult<RiskMetrics>> {
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
          maxDrawdown: 0,
          avgRiskPerTrade: 0,
          profitableRiskRewardTrades: 0,
          riskRewardRatio: 0,
          totalRiskTaken: 0,
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

    // Fetch trades with risk and profit data
    const trades = await db
      .select({
        risk: trade.risk,
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
      .orderBy(trade.createdAt);

    if (trades.length === 0) {
      return {
        success: true,
        message: "No trades found.",
        data: {
          maxDrawdown: 0,
          avgRiskPerTrade: 0,
          profitableRiskRewardTrades: 0,
          riskRewardRatio: 0,
          totalRiskTaken: 0,
        },
      };
    }

    // Calculate drawdown from running balance
    let runningBalance = 0;
    let peak = 0;
    let maxDrawdown = 0;

    trades.forEach((t) => {
      const profit = toNumber(t.profit);
      runningBalance += profit;

      if (runningBalance > peak) {
        peak = runningBalance;
      }

      const drawdown = Math.abs(peak - runningBalance);
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Calculate risk metrics
    let totalRisk = 0;
    let profitableRiskRewardCount = 0;
    let tradesWithRisk = 0;

    trades.forEach((t) => {
      const risk = toNumber(t.risk);
      const profit = toNumber(t.profit);

      if (risk !== 0) {
        totalRisk += Math.abs(risk);
        tradesWithRisk++;

        // Profitable R:R means profit >= risk (positive risk reward)
        if (profit >= risk && risk > 0) {
          profitableRiskRewardCount++;
        }
      }
    });

    const avgRiskPerTrade =
      tradesWithRisk > 0 ? roundToTwo(totalRisk / tradesWithRisk) : 0;
    const totalRiskTaken = roundToTwo(totalRisk);

    // Calculate overall risk reward ratio (avg profit per unit risk)
    const riskRewardRatio =
      totalRisk > 0 ? roundToTwo(Math.abs(runningBalance) / totalRisk) : 0;

    const metrics: RiskMetrics = {
      maxDrawdown: roundToTwo(maxDrawdown),
      avgRiskPerTrade,
      profitableRiskRewardTrades: profitableRiskRewardCount,
      riskRewardRatio,
      totalRiskTaken,
    };

    return {
      success: true,
      message: "Risk metrics fetched successfully.",
      data: metrics,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch risk metrics.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: undefined,
    };
  }
}
