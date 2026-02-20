"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { auth } from "@/lib/auth/auth";
import {
  createTradeAccountSchema,
  type CreateTradeAccountInput,
} from "@/schemas/trade-account.schema";
import { headers } from "next/headers";

type CreateTradeAccountActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createTradeAccountAction(
  input: CreateTradeAccountInput,
): Promise<CreateTradeAccountActionResult> {
  const parsedInput = createTradeAccountSchema.safeParse(input);

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
      message: "You must be signed in to create an account.",
    };
  }

  try {
    await db.insert(tradeAccount).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name: parsedInput.data.name.trim(),
      broker: parsedInput.data.broker?.trim() || null,
      type: parsedInput.data.type,
      balance: parsedInput.data.balance.toFixed(2),
      currency: parsedInput.data.currency || "USD",
      isActive: true,
    });

    return {
      success: true,
      message: "Trade account created successfully.",
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
      message: "Failed to create trade account. Please try again.",
    };
  }
}
