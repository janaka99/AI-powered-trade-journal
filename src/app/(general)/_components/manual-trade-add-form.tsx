"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { createTradeAction } from "@/actions/trade/create";
import { listTradeAccountsForTradeAction } from "@/actions/trade/list-trade-accounts";
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
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActionSWR } from "@/hooks/use-action-swr";
import {
  createTradeSchema,
  type CreateTradeInput,
} from "@/schemas/trade.schema";

type CreateTradeFormInput = z.input<typeof createTradeSchema>;

const directionOptions: Array<{ label: string; value: "long" | "short" }> = [
  { label: "Long", value: "long" },
  { label: "Short", value: "short" },
];

function toDateTimeLocalValue(value?: Date) {
  if (!value) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ManualTradeAddForm() {
  const [open, setOpen] = React.useState(false);
  const tradeAccountParams = React.useMemo(() => ({}), []);

  const form = useForm<CreateTradeFormInput, unknown, CreateTradeInput>({
    resolver: zodResolver(createTradeSchema),
    defaultValues: {
      accountId: "",
      symbol: "",
      direction: "long",
      entryPrice: 0,
      exitPrice: 0,
      entryTime: new Date(),
      profit: 0,
      notes: "",
      mediaId: "",
    },
  });

  const mediaFileRef = React.useRef<File | null>(null);

  const { isSubmitting } = form.formState;

  const { data: tradeAccounts, isLoading: isLoadingAccounts } = useActionSWR(
    listTradeAccountsForTradeAction,
    tradeAccountParams,
    {
      shouldFetch: open,
      onError: (error) => {
        toast.error(
          typeof error === "string" ? error : "Failed to fetch accounts.",
        );
      },
    },
  );
  async function handleSubmit(data: CreateTradeInput) {
    const formData = new FormData();

    formData.append("accountId", data.accountId);
    formData.append("symbol", data.symbol);
    formData.append("direction", data.direction);
    formData.append("entryPrice", String(data.entryPrice));
    formData.append("exitPrice", String(data.exitPrice));
    formData.append("entryTime", data.entryTime.toISOString());
    if (data.exitTime) {
      formData.append("exitTime", data.exitTime.toISOString());
    }
    if (data.risk !== undefined) {
      formData.append("risk", String(data.risk));
    }
    formData.append("profit", String(data.profit));
    if (data.notes) {
      formData.append("notes", data.notes);
    }
    if (mediaFileRef.current) {
      formData.append("media", mediaFileRef.current);
    }

    const response = await createTradeAction(formData);

    if (!response.success) {
      if (response.fieldErrors) {
        Object.entries(response.fieldErrors).forEach(([field, messages]) => {
          if (!messages?.length) {
            return;
          }

          form.setError(field as keyof CreateTradeFormInput, {
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
      accountId: "",
      symbol: "",
      direction: "long",
      entryPrice: 0,
      exitPrice: 0,
      entryTime: new Date(),
      profit: 0,
      notes: "",
      mediaId: "",
    });
    mediaFileRef.current = null;
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !isSubmitting && setOpen(value)}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          <span className="hidden sm:flex">Add Trade</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add manual trade</DialogTitle>
          <DialogDescription>
            Add a single trade manually to your journal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade account</FormLabel>
                  <Select
                    disabled={isSubmitting || isLoadingAccounts}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingAccounts
                              ? "Loading accounts..."
                              : "Select account"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(tradeAccounts ?? []).map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select which account this trade belongs to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="EURUSD"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {directionOptions.map((option) => (
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.00001"
                        min="0"
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

              <FormField
                control={form.control}
                name="exitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.00001"
                        min="0"
                        disabled={isSubmitting}
                        value={field.value}
                        onChange={(event) => {
                          field.onChange(event.target.valueAsNumber);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="entryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        disabled={isSubmitting}
                        value={toDateTimeLocalValue(
                          field.value as Date | undefined,
                        )}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(value ? new Date(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exitTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit time (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        disabled={isSubmitting}
                        value={toDateTimeLocalValue(
                          field.value as Date | undefined,
                        )}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(value ? new Date(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk % (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        disabled={isSubmitting}
                        value={field.value}
                        onChange={(event) => {
                          field.onChange(event.target.valueAsNumber);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder="Write trade notes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mediaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      disabled={isSubmitting}
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          mediaFileRef.current = file;
                          field.onChange(file.name);
                        } else {
                          mediaFileRef.current = null;
                          field.onChange("");
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload an optional image for this trade.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LoadingSwap isLoading={isSubmitting}>Add trade</LoadingSwap>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
