"use client";

import { JobPosting, organization } from "@/lib/db/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitApplicationAction } from "@/lib/server/application-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

type JobWithOrg = JobPosting & {
    organization: typeof organization.$inferSelect;
};

const applicationSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone is required"),
    resumeUrl: z.string().url("Must be a valid URL").or(z.literal("")),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

interface ApplyClientPageProps {
    job: JobWithOrg;
}

export default function ApplyClientPage({ job }: ApplyClientPageProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            resumeUrl: "",
        },
    });

    async function onSubmit(data: ApplicationFormValues) {
        setIsSubmitting(true);
        try {
            await submitApplicationAction({
                jobSlug: job.slug,
                ...data,
            });
            toast.success("Application submitted successfully!");
            router.push(`/jobs/${job.slug}/success`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to submit application");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Apply for {job.title}</h1>
                    <p className="text-muted-foreground mt-2">at {job.organization.name}</p>
                </div>

                <div className="bg-card p-6 rounded-lg border shadow-sm">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" {...form.register("name")} />
                            {form.formState.errors.name && (
                                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" {...form.register("email")} />
                            {form.formState.errors.email && (
                                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" type="tel" {...form.register("phone")} />
                            {form.formState.errors.phone && (
                                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="resumeUrl">Link to Resume / LinkedIn</Label>
                            <Input id="resumeUrl" placeholder="https://linkedin.com/in/..." {...form.register("resumeUrl")} />
                            <p className="text-xs text-muted-foreground">Please provide a link to your resume or LinkedIn profile.</p>
                            {form.formState.errors.resumeUrl && (
                                <p className="text-sm text-destructive">{form.formState.errors.resumeUrl.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Application"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
