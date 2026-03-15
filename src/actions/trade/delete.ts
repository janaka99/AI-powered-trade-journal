"use server";

import { db } from "@/drizzle/db";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type DeleteTradeActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

export async function deleteTradeAction(
  tradeId: string,
): Promise<DeleteTradeActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be signed in to delete a trade.",
      error: "UNAUTHORIZED",
    };
  }

  if (!tradeId) {
    return {
      success: false,
      message: "Trade ID is required.",
      error: "VALIDATION_ERROR",
    };
  }

  try {
    const result = await db
      .delete(trade)
      .where(and(eq(trade.id, tradeId), eq(trade.userId, session.user.id)));

    revalidatePath("/journal");

    return {
      success: true,
      message: "Trade deleted successfully.",
    };
  } catch (error) {
    console.error("Trade deletion error:", error);
    return {
      success: false,
      message: "Failed to delete trade. Please try again.",
      error: "DELETE_FAILED",
    };
  }
}
