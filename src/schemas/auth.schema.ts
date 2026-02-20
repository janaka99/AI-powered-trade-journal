import z from "zod";

export const signUpSchema = z.object({
  email: z.email().min(1),
  password: z.string().min(6),
  name: z.string().min(1),
});

export type SignUpForm = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.email().min(1),
  password: z.string().min(6),
});

export type SignInForm = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email().min(1),
});

export type ForgotPasswordType = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(6),
});

export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
