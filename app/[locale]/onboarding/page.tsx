"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Buildings } from "@phosphor-icons/react";
import { selectOnboardingTypeAction } from "@/lib/server/onboarding-actions";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";

export default function OnboardingSelectionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSelect = async (type: "business" | "candidate") => {
        setIsLoading(true);
        try {
            await selectOnboardingTypeAction(type);
            router.push(`/onboarding/${type}`);
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <PageLayout maxWidth="3xl">
            <div className="space-y-6 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to HireFlow</h1>
                <p className="text-muted-foreground">Choose how you want to use the platform.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <button
                        type="button"
                        className="text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSelect("candidate")}
                        disabled={isLoading}
                    >
                        <Card className="h-full hover:border-primary transition-all duration-200 hover:shadow-md active:scale-[0.98] group">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-200">
                                    <User size={32} className="text-primary" />
                                </div>
                                <CardTitle>I&apos;m a Candidate</CardTitle>
                                <CardDescription>
                                    I&apos;m looking for a job. I want to create a profile and apply for positions.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </button>

                    <button
                        type="button"
                        className="text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSelect("business")}
                        disabled={isLoading}
                    >
                        <Card className="h-full hover:border-primary transition-all duration-200 hover:shadow-md active:scale-[0.98] group">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-200">
                                    <Buildings size={32} className="text-primary" />
                                </div>
                                <CardTitle>I&apos;m a Business</CardTitle>
                                <CardDescription>
                                    I want to post jobs, manage candidates, and hire talent.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </button>
                </div>
                {isLoading && <p className="text-sm text-muted-foreground animate-pulse">Setting up your profile...</p>}
            </div>
        </PageLayout>
    );
}
