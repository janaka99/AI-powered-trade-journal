"use client";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth/auth-client";
import TradeAccountSelector from "./trade-account-selector";
import UserProfileMenu from "./user-profile-menu";
import CreateTradeAccountDialog from "./create-trade-account-dialog";

export default function DashboardHeader() {
  const { data: session, isPending, error } = authClient.useSession();

  if (isPending || error || !session || !session.user) {
    return <DashboardLoading />;
  }
  //   return <DashboardLoading />;
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <TradeAccountSelector />
      <CreateTradeAccountDialog />

      <UserProfileMenu user={session.user} />
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="h-9 w-32 " />
      <Skeleton className="h-9 w-9 sm:w-32 " />
      <Skeleton className="h-9 w-9 rounded-full" />
    </div>
  );
}
