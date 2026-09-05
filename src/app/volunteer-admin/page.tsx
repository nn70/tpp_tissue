import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import VolunteerAdminClient from "@/components/VolunteerAdminClient";
import { canManageContent } from "@/lib/permissions";

export default async function VolunteerAdminPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageContent(session)) {
        redirect("/dashboard");
    }

    return <VolunteerAdminClient />;
}
