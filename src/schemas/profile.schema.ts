import z from "zod";

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required." })
    .max(100, { message: "Name must be less than 100 characters." }),

  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Please enter a valid email address." }),

  phone: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || /^\+?[0-9]{10,15}$/.test(val), {
      message: "Enter a valid phone number (digits only, optional +).",
    }),
});

export type ProfileUpdateSchemaType = z.infer<typeof profileUpdateSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  revokeOtherSessions: z.boolean(),
});

export type ChangePasswordFormType = z.infer<typeof changePasswordSchema>;
