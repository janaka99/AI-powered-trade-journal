"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import QRCode from "react-qr-code";

const twoFactorAuthSchema = z.object({
  password: z.string().min(1),
});

type TwoFactorAuthType = z.infer<typeof twoFactorAuthSchema>;
type TwoFactorData = {
  totpURI: string;
  backupCodes: string[];
};

function TwoFactorAuthSection({
  isTwoFactorEnabled,
}: {
  isTwoFactorEnabled: boolean;
}) {
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(
    null
  );
  const router = useRouter();
  const form = useForm<TwoFactorAuthType>({
    resolver: zodResolver(twoFactorAuthSchema),
    defaultValues: {
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  const handleDisableTwoFactorAuth = async (data: TwoFactorAuthType) => {
    await authClient.twoFactor.disable(
      {
        password: data.password,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to disable 2FA");
        },
        onSuccess: () => {
          form.reset();
          router.refresh();
        },
      }
    );
  };
  const handleEnableTwoFactorAuth = async (data: TwoFactorAuthType) => {
    const res = await authClient.twoFactor.enable({
      password: data.password,
    });

    if (res.error) {
      toast.error(res.error.message || "Failed to enable 2FA");
    } else {
      const data = res.data;
      setTwoFactorData(data);
      form.reset();
    }
  };

  if (twoFactorData != null) {
    return (
      <QRCodeVerify
        {...twoFactorData}
        onDone={() => {
          setTwoFactorData(null);
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(
          isTwoFactorEnabled
            ? handleDisableTwoFactorAuth
            : handleEnableTwoFactorAuth
        )}
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <Input disabled={isSubmitting} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          variant={isTwoFactorEnabled ? "destructive" : "default"}
        >
          <LoadingSwap isLoading={isSubmitting}>
            {isTwoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}

export default TwoFactorAuthSection;

const qrSchema = z.object({
  token: z.string().length(6),
});

type QRSchemaType = z.infer<typeof qrSchema>;

function QRCodeVerify({
  totpURI,
  backupCodes,
  onDone,
}: TwoFactorData & { onDone: () => void }) {
  const [successEnabled, setSuccessEnabled] = useState(false);
  const router = useRouter();
  const form = useForm<QRSchemaType>({
    resolver: zodResolver(qrSchema),
    defaultValues: {
      token: "",
    },
  });

  const { isSubmitting } = form.formState;

  const handleFormSubmit = async (data: QRSchemaType) => {
    const res = await authClient.twoFactor.verifyTotp({
      code: data.token,
    });

    if (res.error) {
      toast.error(res.error.message || "Failed to verify code");
    } else {
      setSuccessEnabled(true);
      router.refresh();
    }
  };

  if (successEnabled) {
    return (
      <>
        <p className="text-sm text-muted-foreground mb-2">
          Save these backup codes in a safe place. You can use them to access
          your account
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {backupCodes.map((code, i) => (
            <div key={i} className="font-mono text-sm">
              {code}
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={onDone}>
          Done
        </Button>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Scan this QR code with your authenticator app and enter the code below
      </p>
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(handleFormSubmit)}
        >
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <Input disabled={isSubmitting} {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <LoadingSwap isLoading={isSubmitting}>Submit Code</LoadingSwap>
          </Button>
        </form>
      </Form>
      <div className="p-4 bg-white w-fit">
        <QRCode size={256} value={totpURI} />
      </div>
    </div>
  );
}
