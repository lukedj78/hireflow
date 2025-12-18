"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeBusinessOnboardingAction } from "@/lib/server/onboarding-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Check, Buildings } from "@phosphor-icons/react";
import { PageLayout } from "@/components/page-layout";

export default function BusinessOnboardingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        companyName: "",
        companySlug: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyName) {
            toast.error("Company name is required");
            return;
        }

        setIsLoading(true);
        try {
            await completeBusinessOnboardingAction({
                companyName: formData.companyName,
                companySlug: formData.companySlug || undefined,
            });
            toast.success("Organization created successfully!");
            router.push("/dashboard");
        } catch (error) {
            toast.error("Failed to create organization.");
            setIsLoading(false);
        }
    };

    return (
        <PageLayout maxWidth="xl">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                    <Buildings size={32} className="text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Setup your Organization</h1>
                <p className="text-muted-foreground">Create your company profile to start posting jobs.</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Company Details</CardTitle>
                        <CardDescription>Tell us about your business.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input 
                                id="companyName" 
                                value={formData.companyName}
                                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                placeholder="Acme Inc."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companySlug">Company URL Slug (Optional)</Label>
                            <div className="flex items-center">
                                <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-muted-foreground text-sm">
                                    hireflow.com/
                                </span>
                                <Input 
                                    id="companySlug" 
                                    value={formData.companySlug}
                                    onChange={(e) => setFormData({...formData, companySlug: e.target.value})}
                                    placeholder="acme-inc"
                                    className="rounded-l-none"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Leave blank to auto-generate from company name.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => router.push("/onboarding")} disabled={isLoading}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Organization"} 
                            {!isLoading && <Check className="ml-2 h-4 w-4" />}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </PageLayout>
    );
}
