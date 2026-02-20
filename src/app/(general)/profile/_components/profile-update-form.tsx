"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  profileUpdateSchema,
  ProfileUpdateSchemaType,
} from "@/schemas/profile.schema";
import { useForm } from "react-hook-form";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function ProfileUpdateForm({
  user,
}: {
  user: { name: string; email: string; phone?: string | null };
}) {
  const router = useRouter();
  const form = useForm<ProfileUpdateSchemaType>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
    },
  });

  const { isSubmitting } = form.formState;

  async function handleFormSubmit(data: ProfileUpdateSchemaType) {
    const promises = [
      authClient.updateUser({
        name: data.name,
        phone: data.phone,
      }),
    ];
    if (data.email !== user.email) {
      promises.push(
        authClient.changeEmail({
          newEmail: data.email,
          callbackURL: "/profile",
        })
      );
    }
    const res = await Promise.all(promises);
    const updateUserResults = res[0];
    const emailResult = res[1] ?? { error: false };

    if (updateUserResults.error) {
      toast.error(
        updateUserResults.error.message || "Failed to update profile"
      );
    } else if (emailResult.error) {
      toast.error(emailResult.error.message || "Failed to update the email");
    } else {
      if (data.email !== user.email) {
        toast.success("Verify your new email address to complete the change");
      } else {
        toast.success("Profile updated successfully");
      }
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(handleFormSubmit)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <Input disabled={isSubmitting} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <Input
                disabled={isSubmitting}
                {...field}
                value={field.value ?? ""}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          <LoadingSwap isLoading={isSubmitting}>Update Profile</LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}

export default ProfileUpdateForm;
