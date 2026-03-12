"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { auth } from "@/lib/auth/auth";
import {
  updateTradeAccountSchema,
  type UpdateTradeAccountInput,
} from "@/schemas/trade-account.schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type UpdateTradeAccountActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateTradeAccountAction(
  input: UpdateTradeAccountInput,
): Promise<UpdateTradeAccountActionResult> {
  const parsedInput = updateTradeAccountSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      message: "Please fix the form errors.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be signed in to update an account.",
    };
  }

  try {
    const result = await db
      .update(tradeAccount)
      .set({
        name: parsedInput.data.name.trim(),
        broker: parsedInput.data.broker?.trim() || null,
        type: parsedInput.data.type,
        balance: parsedInput.data.balance.toFixed(2),
        currency: parsedInput.data.currency || "USD",
        isActive: parsedInput.data.isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tradeAccount.id, parsedInput.data.id),
          eq(tradeAccount.userId, session.user.id),
        ),
      );

    revalidatePath("/journal");

    return {
      success: true,
      message: "Trade account updated successfully.",
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return {
        success: false,
        message: "You already have an account with this name.",
      };
    }

    return {
      success: false,
      message: "Failed to update trade account. Please try again.",
    };
  }
}
