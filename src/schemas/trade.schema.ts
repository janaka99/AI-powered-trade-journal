import z from "zod";

// Media Schema
export const createMediaSchema = z.object({
  url: z.string().url({ message: "Invalid URL" }),
  type: z.string().min(1, { message: "File type is required." }),
  filename: z.string().min(1, { message: "Filename is required." }),
  size: z.string().optional(),
});

export type CreateMediaInput = z.infer<typeof createMediaSchema>;

// Trade Schema
export const tradeDirectionSchema = z.enum(["long", "short"]);

export const createTradeSchema = z.object({
  accountId: z.string().min(1, { message: "Account ID is required." }),
  symbol: z
    .string()
    .min(1, { message: "Symbol is required." })
    .max(50, { message: "Symbol must be less than 50 characters." }),
  direction: tradeDirectionSchema,
  entryPrice: z
    .number({ message: "Entry price is required." })
    .positive({ message: "Entry price must be greater than 0." }),
  exitPrice: z
    .number({ message: "Exit price is required." })
    .positive({ message: "Exit price must be greater than 0." }),
  entryTime: z.coerce.date({ message: "Entry time is required." }),
  exitTime: z.coerce
    .date({ message: "Exit time must be a valid date." })
    .optional(),
  risk: z.number({ message: "Risk must be a valid number." }).optional(),
  profit: z.number({ message: "Profit is required." }),
  notes: z
    .string()
    .max(1000, { message: "Notes must be less than 1000 characters." })
    .optional()
    .or(z.literal("")),
  mediaId: z.string().optional().or(z.literal("")),
});

export type CreateTradeInput = z.infer<typeof createTradeSchema>;

export const updateTradeSchema = createTradeSchema.extend({
  id: z.string().min(1, { message: "Trade ID is required." }),
});

export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;
