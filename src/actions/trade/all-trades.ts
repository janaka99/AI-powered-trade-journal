"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import type { ServerActionResult } from "@/hooks/use-action-swr";
import { and, asc, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { headers } from "next/headers";

type TradeItem = {
  id: string;
  accountId: string;
  symbol: string;
  direction: "long" | "short";
  entryPrice: string;
  exitPrice: string | null;
  entryTime: Date;
  exitTime: Date | null;
  risk: string | null;
  profit: string | null;
  swap: string | null;
  commissions: string | null;
  notes: string | null;
  mediaId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PaginationMeta = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AllTradesData = {
  trades: TradeItem[];
  pagination: PaginationMeta;
};

type OrderByField = "exitTime" | "entryTime" | "exitPrice";
type OrderByDirection = "asc" | "desc";

type GetAllTradesInput = {
  accountIds: string[];
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  orderBy?: OrderByField;
  orderDirection?: OrderByDirection;
  symbols?: string[];
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function getAllTradesAction(
  input: GetAllTradesInput,
): Promise<ServerActionResult<AllTradesData>> {
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

    // Sanitize and validate pagination parameters
    const page = Math.max(1, input.page ?? DEFAULT_PAGE);
    const limit = Math.min(
      Math.max(1, input.limit ?? DEFAULT_LIMIT),
      MAX_LIMIT,
    );
    const offset = (page - 1) * limit;

    // Sanitize account IDs
    const accountIds = Array.from(
      new Set(input.accountIds.map((id) => id.trim())),
    ).filter(Boolean);

    if (accountIds.length === 0) {
      return {
        success: true,
        message: "No accounts selected. Returning empty trades list.",
        data: {
          trades: [],
          pagination: {
            currentPage: page,
            pageSize: limit,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
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

    // Build date filters for exitTime
    const dateFilters = [];
    if (input.startDate) {
      dateFilters.push(gte(trade.exitTime, new Date(input.startDate)));
    }
    if (input.endDate) {
      const end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilters.push(lte(trade.exitTime, end));
    }

    // Build symbol filter (case-insensitive)
    const symbolFilter =
      input.symbols && input.symbols.length > 0
        ? [inArray(sql`upper(${trade.symbol})`, input.symbols.map((s) => s.toUpperCase()))]
        : [];

    const whereClause = and(
      eq(trade.userId, session.user.id),
      inArray(trade.accountId, accountIds),
      ...dateFilters,
      ...symbolFilter,
    );

    // Get total count for pagination metadata
    const [{ totalItems }] = await db
      .select({ totalItems: count() })
      .from(trade)
      .where(whereClause);

    // Determine sort column and direction
    const orderByField = input.orderBy ?? "exitTime";
    const orderDir = input.orderDirection ?? "desc";
    const columnMap = {
      exitTime: trade.exitTime,
      entryTime: trade.entryTime,
      exitPrice: trade.exitPrice,
    } as const;
    const sortColumn = columnMap[orderByField];
    const sortFn = orderDir === "asc" ? asc : desc;

    // Fetch paginated trades
    const trades = await db
      .select({
        id: trade.id,
        accountId: trade.accountId,
        symbol: trade.symbol,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        entryTime: trade.entryTime,
        exitTime: trade.exitTime,
        risk: trade.risk,
        profit: trade.profit,
        swap: trade.swap,
        commissions: trade.commissions,
        notes: trade.notes,
        mediaId: trade.mediaId,
        createdAt: trade.createdAt,
        updatedAt: trade.updatedAt,
      })
      .from(trade)
      .where(whereClause)
      .orderBy(sortFn(sortColumn))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(totalItems / limit);

    const paginationMeta: PaginationMeta = {
      currentPage: page,
      pageSize: limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      success: true,
      message: "Trades fetched successfully.",
      data: {
        trades,
        pagination: paginationMeta,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch trades.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: undefined,
    };
  }
}
