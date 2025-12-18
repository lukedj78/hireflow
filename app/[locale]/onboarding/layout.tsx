import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOnboardingStatusAction } from "@/lib/server/onboarding-actions";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session) {
        redirect("/auth/sign-in");
    }

    if (session.user.role === "admin") {
        redirect("/admin");
    }

    if (session.user.role === "business") {
        redirect("/dashboard");
    }

    if (session.user.role === "candidate") {
        redirect("/dashboard/candidate");
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                {children}
            </div>
        </div>
    );
}
