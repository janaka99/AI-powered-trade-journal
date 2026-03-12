import { db } from "@/drizzle/db";
import { tradeAccount } from "@/drizzle/schemas/trade-account-schema";
import { auth } from "@/lib/auth/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ActionMenu from "./components/action-menu";

const typeBadgeClassMap: Record<"real" | "demo" | "backtest", string> = {
  real: "border-transparent bg-primary text-primary-foreground",
  demo: "border-transparent bg-secondary text-secondary-foreground",
  backtest: "border-transparent bg-muted text-muted-foreground",
};

export default function page() {
  return <JournalPage />;
}

async function JournalPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const accounts = await db
    .select({
      id: tradeAccount.id,
      name: tradeAccount.name,
      broker: tradeAccount.broker,
      type: tradeAccount.type,
      balance: tradeAccount.balance,
      currency: tradeAccount.currency,
      isActive: tradeAccount.isActive,
      createdAt: tradeAccount.createdAt,
    })
    .from(tradeAccount)
    .where(eq(tradeAccount.userId, session.user.id))
    .orderBy(desc(tradeAccount.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Journal Accounts</h1>
          <p className="text-muted-foreground text-sm">
            Manage trade accounts for your journal entries.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available accounts</CardTitle>
          <CardDescription>
            All trading accounts connected to your journal workspace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No trade accounts yet. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Broker</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.name}
                    </TableCell>
                    <TableCell>{account.broker || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className={`capitalize ${typeBadgeClassMap[account.type]}`}
                      >
                        {account.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: account.currency || "USD",
                      }).format(Number(account.balance))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? "default" : "outline"}>
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(account.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="flex justify-end">
                      <ActionMenu account={account} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
