import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AnalyticsPage from "./analytics-page";

async function page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user == null) {
    return redirect("/auth/login");
  }

  return <AnalyticsPage />;
}

export default page;
