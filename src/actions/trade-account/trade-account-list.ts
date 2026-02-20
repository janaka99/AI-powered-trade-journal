"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { auth } from "@/lib/auth/auth";
import {
  createTradeAccountSchema,
  type CreateTradeAccountInput,
} from "@/schemas/trade-account.schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

type CreateTradeAccountActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  data?: any;
};

export async function getTradeAccountsAction(
  input: CreateTradeAccountInput,
): Promise<CreateTradeAccountActionResult> {
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
    const accounts = await db
      .select()
      .from(tradeAccount)
      .where(eq(tradeAccount.userId, session.user.id));

    return {
      success: true,
      message: "Trade accounts retrieved successfully.",
      data: accounts,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to retrieve trade accounts. Please try again.",
      data: [],
    };
  }
}
