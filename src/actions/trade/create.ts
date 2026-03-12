"use server";

import { db } from "@/drizzle/db";
import { trade } from "@/drizzle/schemas/trade-schema";
import { media } from "@/drizzle/schemas/media-schema";
import { auth } from "@/lib/auth/auth";
import {
  createTradeSchema,
  type CreateTradeInput,
} from "@/schemas/trade.schema";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type CreateTradeActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  error?: string;
  data?: {
    id: string;
  };
};

export async function createTradeAction(
  formData: FormData,
): Promise<CreateTradeActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be signed in to add a trade.",
      error: "UNAUTHORIZED",
    };
  }

  // Extract data from FormData
  const input: CreateTradeInput = {
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
    notes: (formData.get("notes") as string) || undefined,
    mediaId: undefined,
  };

  const parsedInput = createTradeSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      message: "Please fix the form errors.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
      error: "VALIDATION_ERROR",
    };
  }

  try {
    let mediaId: string | undefined;

    // Handle file upload if present
    const mediaFile = formData.get("media") as File | null;

    // TODO - Implement media upload logic

    const tradeId = crypto.randomUUID();

    await db.insert(trade).values({
      id: tradeId,
      userId: session.user.id,
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
      notes: parsedInput.data.notes?.trim() || null,
      mediaId: mediaId || null,
    });

    revalidatePath("/journal");

    return {
      success: true,
      message: "Trade added successfully.",
      data: { id: tradeId },
    };
  } catch (error) {
    console.error("Trade creation error:", error);
    return {
      success: false,
      message: "Failed to add trade. Please try again.",
      error: "CREATE_FAILED",
    };
  }
}
