"use client";
import { BetterAuthActionButton } from "../auth/better-auth-action-button";
import { authClient } from "@/lib/auth/auth-client";

export default function LogOutButton() {
  return (
    <BetterAuthActionButton
      size="lg"
      variant="destructive"
      action={() => authClient.signOut()}
    >
      Sign Out
    </BetterAuthActionButton>
  );
}
