"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createTradeAccountAction } from "@/actions/trade-account/create";
import { updateTradeAccountAction } from "@/actions/trade-account/update";
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
  updateTradeAccountSchema,
  type UpdateTradeAccountInput,
} from "@/schemas/trade-account.schema";

const accountTypeOptions: Array<{
  label: string;
  value: "real" | "demo" | "backtest";
}> = [
  { label: "Real", value: "real" },
  { label: "Demo", value: "demo" },
  { label: "Backtest", value: "backtest" },
];

type TradeAccountFormData = CreateTradeAccountInput | UpdateTradeAccountInput;

interface TradeAccountDialogProps {
  mode?: "create" | "edit";
  accountData?: {
    id: string;
    name: string;
    broker: string | null;
    type: "real" | "demo" | "backtest";
    balance: string;
    currency: string;
    isActive: boolean;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CreateTradeAccountDialog({
  mode = "create",
  accountData,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TradeAccountDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? controlledOnOpenChange || (() => {})
    : setInternalOpen;

  const form = useForm<TradeAccountFormData>({
    resolver: zodResolver(
      mode === "edit" ? updateTradeAccountSchema : createTradeAccountSchema,
    ),
    defaultValues: {
      ...(mode === "edit" && accountData?.id ? { id: accountData.id } : {}),
      name: accountData?.name || "",
      broker: accountData?.broker || "",
      type: "real",
      balance: accountData?.balance ? parseFloat(accountData.balance) : 0,
      currency: accountData?.currency || "USD",
      ...(mode === "edit" ? { isActive: accountData?.isActive ?? true } : {}),
    },
  });

  const { isSubmitting } = form.formState;

  React.useEffect(() => {
    if (mode === "edit" && accountData) {
      form.reset({
        ...(accountData.id ? { id: accountData.id } : {}),
        name: accountData.name,
        broker: accountData.broker || "",
        type: accountData.type,
        balance: parseFloat(accountData.balance),
        currency: accountData.currency,
        isActive: accountData.isActive,
      });
    }
  }, [mode, accountData, form]);

  async function handleSubmit(data: TradeAccountFormData) {
    const response =
      mode === "edit"
        ? await updateTradeAccountAction(data as UpdateTradeAccountInput)
        : await createTradeAccountAction(data as CreateTradeAccountInput);

    if (!response.success) {
      if (response.fieldErrors) {
        Object.entries(response.fieldErrors).forEach(([field, messages]) => {
          if (!messages?.length) {
            return;
          }

          form.setError(field as keyof TradeAccountFormData, {
            type: "server",
            message: messages[0],
          });
        });
      }

      toast.error(response.message);
      return;
    }

    toast.success(response.message);
    if (mode === "create") {
      form.reset({
        name: "",
        broker: "",
        type: "real",
        balance: 0,
        currency: "USD",
      });
    }
    window.dispatchEvent(new Event("trade-accounts:refresh"));
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !isSubmitting && setOpen(value)}
    >
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : mode === "create" ? (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus />
            <span className="hidden sm:flex">Add Account</span>
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit trade account" : "Create trade account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update your trading account details."
              : "Add a trading account to track balances and journal entries."}
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

            {mode === "edit" && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      value={field.value ? "active" : "inactive"}
                      onValueChange={(value) =>
                        field.onChange(value === "active")
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LoadingSwap isLoading={isSubmitting}>
                {mode === "edit" ? "Update account" : "Create account"}
              </LoadingSwap>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
