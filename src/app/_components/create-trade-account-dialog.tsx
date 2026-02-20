"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createTradeAccountAction } from "@/actions/trade-account/create";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTradeAccountSchema,
  type CreateTradeAccountInput,
} from "@/schemas/trade-account.schema";

const accountTypeOptions: Array<{
  label: string;
  value: "real" | "demo" | "backtest";
}> = [
  { label: "Real", value: "real" },
  { label: "Demo", value: "demo" },
  { label: "Backtest", value: "backtest" },
];

export default function CreateTradeAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const form = useForm<CreateTradeAccountInput>({
    resolver: zodResolver(createTradeAccountSchema),
    defaultValues: {
      name: "",
      broker: "",
      type: "real",
      balance: 0,
      currency: "USD",
    },
  });

  const { isSubmitting } = form.formState;

  async function handleSubmit(data: CreateTradeAccountInput) {
    const response = await createTradeAccountAction(data);

    if (!response.success) {
      if (response.fieldErrors) {
        Object.entries(response.fieldErrors).forEach(([field, messages]) => {
          if (!messages?.length) {
            return;
          }

          form.setError(field as keyof CreateTradeAccountInput, {
            type: "server",
            message: messages[0],
          });
        });
      }

      toast.error(response.message);
      return;
    }

    toast.success(response.message);
    form.reset({
      name: "",
      broker: "",
      type: "real",
      balance: 0,
      currency: "USD",
    });
    window.dispatchEvent(new Event("trade-accounts:refresh"));
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !isSubmitting && setOpen(value)}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          <span className="hidden sm:flex">Add Account</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create trade account</DialogTitle>
          <DialogDescription>
            Add a trading account to track balances and journal entries.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="Main FTMO"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="broker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broker (optional)</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="IC Markets"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Balance</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={isSubmitting}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input disabled value={field.value} />
                  </FormControl>
                  <FormDescription>
                    Only USD is supported right now.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LoadingSwap isLoading={isSubmitting}>Create account</LoadingSwap>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
