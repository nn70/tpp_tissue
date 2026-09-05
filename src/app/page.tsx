import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (canManageContent(session)) {
    redirect("/dashboard");
  }

  redirect("/forum");
}
