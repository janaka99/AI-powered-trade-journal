"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { set, User } from "better-auth";
import { authClient } from "@/lib/auth/auth-client";
import { LucideIcon } from "lucide-react";

type DialogWithFormProps = {
  title: string;
  description: string;
  buttonText: string;
  icon?: React.ReactNode;
  FormComponent: React.ComponentType<{
    setIsSubmitting?: (state: boolean) => void;
    closeDialog?: () => void;
    user: User;
  }>;
};

export function DialogWithForm({
  title,
  description,
  FormComponent,
  buttonText,
  icon,
}: DialogWithFormProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userState, setUserState] = React.useState<User | null>(null);

  React.useEffect(() => {
    authClient.getSession().then((session) => {
      if (session.data != null) setUserState(session.data.user);
    });
  }, []);

  if (!userState) {
    return <></>;
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && setOpen(val)}>
      <form>
        <DialogTrigger asChild>
          {icon ? (
            <Button className="w-full flex gap-2 items-center">
              {icon}
              {buttonText}
            </Button>
          ) : (
            <Button className="w-full">{buttonText}</Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <FormComponent
            setIsSubmitting={setIsSubmitting}
            closeDialog={() => setOpen(false)}
            user={userState}
          />
        </DialogContent>
      </form>
    </Dialog>
  );
}
