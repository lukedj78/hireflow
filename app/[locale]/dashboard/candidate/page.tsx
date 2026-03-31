import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageLayout } from "@/components/page-layout";
import { FileText, Calendar, Eye, Briefcase, UserCircle, Upload, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function CandidateDashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || session.user.role !== "candidate") {
        redirect("/dashboard");
    }

    const t = await getTranslations("CandidateDashboard");

    const steps = [
        {
            icon: UserCircle,
            title: t("steps.profile"),
            description: t("steps.profileDesc"),
            href: "/dashboard/candidate/profile",
        },
        {
            icon: Upload,
            title: t("steps.cv"),
            description: t("steps.cvDesc"),
            href: "/dashboard/candidate/profile",
        },
        {
            icon: Search,
            title: t("steps.browse"),
            description: t("steps.browseDesc"),
            href: "/dashboard/candidate/jobs",
        },
    ];

    return (
        <PageLayout>
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="animate-fade-in">
                    <h1 className="text-3xl font-bold tracking-tight">{t("welcome")}, {session.user.name?.split(" ")[0]}</h1>
                    <p className="text-muted-foreground mt-1">{t("getStartedDescription")}</p>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="animate-fade-in-up stagger-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t("metrics.applications")}</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                {t("metrics.applicationsDesc")}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="animate-fade-in-up stagger-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t("metrics.interviews")}</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                {t("metrics.interviewsDesc")}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="animate-fade-in-up stagger-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t("metrics.profileViews")}</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                {t("metrics.profileViewsDesc")}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Getting Started Steps */}
                <div className="animate-fade-in-up stagger-4">
                    <h2 className="text-lg font-semibold mb-3">{t("getStarted")}</h2>
                    <div className="grid gap-3 md:grid-cols-3">
                        {steps.map((step, i) => (
                            <Link key={i} href={step.href} className="group">
                                <Card className="h-full transition-all duration-200 hover:border-primary hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-ring">
                                    <CardContent className="pt-6 flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                                                <step.icon className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="font-medium text-sm">{step.title}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {step.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recommended Jobs Section */}
                <Card className="animate-fade-in-up stagger-5">
                    <CardHeader>
                        <CardTitle>{t("recommendedJobs.title")}</CardTitle>
                        <CardDescription>
                            {t("recommendedJobs.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Briefcase className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium mb-1">{t("recommendedJobs.emptyTitle")}</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mb-6">
                                {t("recommendedJobs.emptyDescription")}
                            </p>
                            <div className="flex gap-3">
                                <Link href="/dashboard/candidate/profile" className={cn(buttonVariants({ variant: "default" }))}>
                                    {t("recommendedJobs.completeProfile")}
                                </Link>
                                <Link href="/dashboard/candidate/jobs" className={cn(buttonVariants({ variant: "outline" }))}>
                                    {t("recommendedJobs.browseJobs")}
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
