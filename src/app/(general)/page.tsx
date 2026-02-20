import { Button } from "@/components/ui/button";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

async function page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user == null) {
    return redirect("/auth/login");
  }
  return (
    <div className="my-6 px-4 max-w-md mx-auto">
      <div className="text-center space-y-6">
        <div className="text-2xl">Welcome, {session.user.name}</div>
        <Button asChild size="lg">
          <Link href="/journal">Journal</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/manual-journal">Manual Journal</Link>
        </Button>
        <div className="flex gap-4 justidy-center">
          <Button asChild size="lg">
            <Link href="/profile">Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default page;
