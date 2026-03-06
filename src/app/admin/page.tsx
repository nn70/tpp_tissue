import AdminClient from "@/components/AdminClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    if ((session?.user as any)?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return <AdminClient />;
}
