import z from "zod";

export const tradeAccountTypeSchema = z.enum(["real", "demo", "backtest"]);

export const createTradeAccountSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Account name is required." })
    .max(100, { message: "Account name must be less than 100 characters." }),
  broker: z
    .string()
    .max(100, { message: "Broker name must be less than 100 characters." })
    .optional()
    .or(z.literal("")),
  type: tradeAccountTypeSchema,
  balance: z
    .number({ message: "Balance is required." })
    .positive({ message: "Balance must be greater than 0." }),
  currency: z
    .string()
    .min(1, { message: "Currency is required." })
    .max(10, { message: "Currency must be less than 10 characters." }),
});

export type CreateTradeAccountInput = z.infer<typeof createTradeAccountSchema>;
