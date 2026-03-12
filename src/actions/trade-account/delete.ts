"use server";

import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schema";
import { auth } from "@/lib/auth/auth";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function deleteTradeAccountAction(account_id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be signed in.",
    };
  }

  await db
    .delete(tradeAccount)
    .where(
      and(
        eq(tradeAccount.id, account_id),
        eq(tradeAccount.userId, session.user.id),
      ),
    );

  revalidatePath("/journal");

  return {
    success: true,
    message: "Trade account deleted successfully",
  };
}
