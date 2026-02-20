"use client";
import {
  ForgotPasswordType,
  forgotPasswordSchema,
} from "@/schemas/auth.schema";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { LoadingSwap } from "@/components/ui/loading-swap";

function ForgotPassword({ openSignIn }: { openSignIn: () => void }) {
  const form = useForm<ForgotPasswordType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { isSubmitting } = form.formState;

  const handleForgotPassword = async (data: ForgotPasswordType) => {
    await authClient.requestPasswordReset(
      {
        ...data,
        redirectTo: "/auth/reset-password",
      },
      {
        onError: (error) => {
          toast.error(
            error.error.message || "Failed to send password reset email"
          );
        },
        onSuccess: () => {
          toast.success("Password reset email sent");
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(handleForgotPassword)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input disabled={isSubmitting} type="email" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={openSignIn}>
            Back to Sign In
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            <LoadingSwap isLoading={isSubmitting}>Send Reset Email</LoadingSwap>
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default ForgotPassword;
