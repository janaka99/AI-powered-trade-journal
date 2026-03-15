"use server";

import { db } from "@/drizzle/db";
import { trade } from "@/drizzle/schemas/trade-schema";
import { auth } from "@/lib/auth/auth";
import {
  updateTradeSchema,
  type UpdateTradeInput,
} from "@/schemas/trade.schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type UpdateTradeActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  error?: string;
};

export async function updateTradeAction(
  formData: FormData,
): Promise<UpdateTradeActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be signed in to update a trade.",
      error: "UNAUTHORIZED",
    };
  }

  const input: UpdateTradeInput = {
    id: formData.get("id") as string,
    accountId: formData.get("accountId") as string,
    symbol: formData.get("symbol") as string,
    direction: formData.get("direction") as "long" | "short",
    entryPrice: Number(formData.get("entryPrice")),
    exitPrice: Number(formData.get("exitPrice")),
    entryTime: new Date(formData.get("entryTime") as string),
    exitTime: formData.get("exitTime")
      ? new Date(formData.get("exitTime") as string)
      : undefined,
    risk: formData.get("risk") ? Number(formData.get("risk")) : undefined,
    profit: Number(formData.get("profit")),
    swap: formData.get("swap") ? Number(formData.get("swap")) : undefined,
    commissions: formData.get("commissions")
      ? Number(formData.get("commissions"))
      : undefined,
    notes: (formData.get("notes") as string) || undefined,
    mediaId: undefined,
  };

  const parsedInput = updateTradeSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      message: "Please fix the form errors.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
      error: "VALIDATION_ERROR",
    };
  }

  try {
    // Verify trade ownership
    const existing = await db
      .select({ id: trade.id })
      .from(trade)
      .where(
        and(
          eq(trade.id, parsedInput.data.id),
          eq(trade.userId, session.user.id),
        ),
      );

    if (existing.length === 0) {
      return {
        success: false,
        message: "Trade not found.",
        error: "NOT_FOUND",
      };
    }

    await db
      .update(trade)
      .set({
        accountId: parsedInput.data.accountId,
        symbol: parsedInput.data.symbol.trim(),
        direction: parsedInput.data.direction,
        entryPrice: parsedInput.data.entryPrice.toFixed(5),
        exitPrice:
          parsedInput.data.exitPrice !== undefined
            ? parsedInput.data.exitPrice.toFixed(5)
            : null,
        entryTime: parsedInput.data.entryTime,
        exitTime: parsedInput.data.exitTime ?? null,
        risk:
          parsedInput.data.risk !== undefined
            ? parsedInput.data.risk.toFixed(2)
            : null,
        profit:
          parsedInput.data.profit !== undefined
            ? parsedInput.data.profit.toFixed(2)
            : null,
        swap:
          parsedInput.data.swap !== undefined
            ? parsedInput.data.swap.toFixed(2)
            : null,
        commissions:
          parsedInput.data.commissions !== undefined
            ? parsedInput.data.commissions.toFixed(2)
            : null,
        notes: parsedInput.data.notes?.trim() || null,
      })
      .where(
        and(
          eq(trade.id, parsedInput.data.id),
          eq(trade.userId, session.user.id),
        ),
      );

    revalidatePath("/journal");

    return {
      success: true,
      message: "Trade updated successfully.",
    };
  } catch (error) {
    console.error("Trade update error:", error);
    return {
      success: false,
      message: "Failed to update trade. Please try again.",
      error: "UPDATE_FAILED",
    };
  }
}
