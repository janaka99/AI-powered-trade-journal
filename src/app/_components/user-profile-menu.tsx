"use client";

import { useRouter } from "next/navigation";
import {
  CirclePlus,
  LogOut,
  Settings,
  User,
  Users,
  Wallet,
  WandSparkles,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/auth-client";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UserProfileMenu({ user }: { user: SessionUser }) {
  const router = useRouter();

  const userName = user.name || "User";
  const userEmail = user.email || "";
  const userImage = user.image || "";
  const initials = getInitials(userName) || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="border-input bg-background hover:bg-accent inline-flex size-9 items-center justify-center overflow-hidden rounded-full border transition-colors"
          aria-label="Open user menu"
        >
          {userImage ? (
            <img src={userImage} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-semibold">{initials}</span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center gap-3 p-4">
          <div className="relative">
            <div className="bg-muted flex size-12 items-center justify-center overflow-hidden rounded-full">
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">{initials}</span>
              )}
            </div>
            <span className="bg-emerald-500 ring-background absolute right-0 bottom-0 block size-2.5 rounded-full ring-2" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{userName}</p>
            <p className="text-muted-foreground truncate text-sm">
              {userEmail}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="p-2">
          <DropdownMenuItem onSelect={() => router.push("/profile")}>
            <User />
            My account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Wallet />
            Billing
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="p-2">
          <DropdownMenuItem>
            <Users />
            Manage team
          </DropdownMenuItem>
          <DropdownMenuItem>
            <WandSparkles />
            Customization
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CirclePlus />
            Add team account
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="p-2">
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              void authClient.signOut();
            }}
          >
            <LogOut />
            Logout
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
