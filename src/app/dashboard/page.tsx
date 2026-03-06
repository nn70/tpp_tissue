import DashboardClient from "@/components/DashboardClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RestrictedAccess from "@/components/RestrictedAccess";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return <RestrictedAccess />;
    }

    return <DashboardClient />;
}
