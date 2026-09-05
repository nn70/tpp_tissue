import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import RestrictedAccess from "@/components/RestrictedAccess";
import VolunteerForumClient from "@/components/VolunteerForumClient";

export default async function ForumPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return <RestrictedAccess />;
    }

    return <VolunteerForumClient />;
}
