"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";
import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

export async function listTradeSymbolsAction(
  accountIds: string[],
): Promise<ServerActionResult<string[]>> {
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

    const sanitizedIds = Array.from(
      new Set(accountIds.map((id) => id.trim())),
    ).filter(Boolean);

    if (sanitizedIds.length === 0) {
      return { success: true, message: "No accounts selected.", data: [] };
    }

    // Security check
    const ownedAccounts = await db
      .select({ id: tradeAccount.id })
      .from(tradeAccount)
      .where(
        and(
          eq(tradeAccount.userId, session.user.id),
          inArray(tradeAccount.id, sanitizedIds),
        ),
      );

    if (ownedAccounts.length !== sanitizedIds.length) {
      return {
        success: false,
        message: "One or more accounts are invalid for this user.",
        error: "INVALID_ACCOUNT_SELECTION",
        data: undefined,
      };
    }

    const upperSymbol = sql<string>`upper(${trade.symbol})`;

    const rows = await db
      .selectDistinct({ symbol: upperSymbol })
      .from(trade)
      .where(
        and(
          eq(trade.userId, session.user.id),
          inArray(trade.accountId, sanitizedIds),
        ),
      )
      .orderBy(upperSymbol);

    return {
      success: true,
      message: "Symbols fetched successfully.",
      data: rows.map((r) => r.symbol),
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch symbols.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: undefined,
    };
  }
}
