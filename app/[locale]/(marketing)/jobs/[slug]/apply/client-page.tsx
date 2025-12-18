"use client";

import { JobPosting, organization, Candidate } from "@/lib/db/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitApplicationAction } from "@/lib/server/application-actions";
import { getResumeUploadUrlAction } from "@/lib/server/file-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileTextIcon, ClockIcon, MapPinIcon, BriefcaseIcon, CurrencyDollarIcon, BuildingsIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

type JobWithOrg = JobPosting & {
    organization: typeof organization.$inferSelect;
};

const applicationSchema = z.object({
    resumeUrl: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

interface ApplyClientPageProps {
    job: JobWithOrg;
    candidateProfile: Candidate | null;
}

export default function ApplyClientPage({ job, candidateProfile }: ApplyClientPageProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [useExistingResume, setUseExistingResume] = useState<boolean>(!!candidateProfile?.resumeUrl || !!candidateProfile?.resumeLastUpdatedAt);
    const form = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            resumeUrl: candidateProfile?.resumeUrl || "",
        },
    });

    // Redirect or show login if no candidate profile
    if (!candidateProfile) {
        return (
            <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="max-w-md w-full space-y-8 text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-foreground">
                        Sign in to Apply
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        You need to be logged in as a candidate to apply for this position.
                    </p>
                    <div className="mt-5">
                        <Link href={`/auth/sign-in?callbackUrl=/jobs/${job.slug}/apply`}>
                            <Button className="w-full">Sign In / Register</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                } else {
                    reject(new Error("Failed to convert file to base64"));
                }
            };
            reader.onerror = error => reject(error);
        });
    };

    async function onSubmit(data: ApplicationFormValues) {
        setIsSubmitting(true);
        try {
            let resumeUrl = data.resumeUrl;
            let resumeKey: string | undefined;
            let resumeFileName: string | undefined;
            let resumeSize: number | undefined;
            let resumeType: string | undefined;

            if (selectedFile) {
                // Get Presigned URL
                const { success, data } = await getResumeUploadUrlAction(
                    selectedFile.name,
                    selectedFile.type,
                    selectedFile.size
                );

                if (!success || !data) {
                    throw new Error("Failed to get upload URL");
                }

                // Upload to Storage
                const uploadResponse = await fetch(data.uploadUrl, {
                    method: "PUT",
                    body: selectedFile,
                    headers: {
                        "Content-Type": selectedFile.type,
                    },
                });

                if (!uploadResponse.ok) {
                    throw new Error("Failed to upload file");
                }

                resumeUrl = data.publicUrl;
                resumeKey = data.fileKey;
                resumeFileName = selectedFile.name;
                resumeSize = selectedFile.size;
                resumeType = selectedFile.type;
            } else if (!useExistingResume && !data.resumeUrl) {
                 toast.error("Please upload a resume or provide a link");
                 setIsSubmitting(false);
                 return;
            }
            
            if (!selectedFile && !data.resumeUrl && !useExistingResume) {
                toast.error("Resume is required");
                setIsSubmitting(false);
                return;
            }

            const finalResumeUrl = useExistingResume ? (candidateProfile?.resumeUrl || undefined) : resumeUrl;

            await submitApplicationAction({
                jobSlug: job.slug,
                resumeUrl: finalResumeUrl || undefined,
                resumeKey,
                resumeFileName,
                resumeSize,
                resumeType,
            });
            toast.success("Application submitted successfully!");
            router.push(`/jobs/${job.slug}/success`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to submit application");
        } finally {
            setIsSubmitting(false);
        }
    }

    const lastUpdatedText = candidateProfile.resumeLastUpdatedAt 
        ? `Last updated ${formatDistanceToNow(new Date(candidateProfile.resumeLastUpdatedAt))} ago`
        : "No resume uploaded recently";

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold">Apply for {job.title}</h1>
                    <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground">
                        <BuildingsIcon className="w-4 h-4" />
                        <span className="font-medium">{job.organization.name}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Job & Company Summary */}
                    <div className="lg:col-span-2 bg-card p-6 rounded-lg border shadow-sm space-y-6 h-fit">
                        <div className="flex items-center gap-4 pb-6 border-b">
                            {job.organization.logo ? (
                                <Image width={40} height={40} src={job.organization.logo} alt={job.organization.name} className="w-12 h-12 rounded-md object-cover border" />
                            ) : (
                                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <BuildingsIcon className="w-6 h-6 text-primary" />
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold">{job.organization.name}</h3>
                                <p className="text-xs text-muted-foreground">Is hiring for this position</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Location</Label>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <MapPinIcon className="w-4 h-4 text-primary" />
                                    {job.location || "Remote"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Type</Label>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <BriefcaseIcon className="w-4 h-4 text-primary" />
                                    <span className="capitalize">{job.type}</span>
                                </div>
                            </div>
                            {job.salaryRange && (
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Salary</Label>
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <CurrencyDollarIcon className="w-4 h-4 text-primary" />
                                        {job.salaryRange}
                                    </div>
                                </div>
                            )}
                        </div>

                        {job.description && (
                            <div className="pt-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">About the Role</Label>
                                <div className="text-sm text-muted-foreground">
                                    <div dangerouslySetInnerHTML={{ __html: job.description }} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1 bg-card p-6 rounded-lg border shadow-sm h-fit sticky top-8">
                        <div className="mb-6 space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Applicant Details</h3>
                                <div className="grid grid-cols-1 gap-1 text-sm">
                                    <p><span className="font-medium">Name:</span> {candidateProfile.name}</p>
                                    <p><span className="font-medium">Email:</span> {candidateProfile.email}</p>
                                    <p><span className="font-medium">Phone:</span> {candidateProfile.phone || "Not provided"}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Resume / CV</Label>
                            
                            {useExistingResume ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <FileTextIcon className="h-4 w-4 text-primary" />
                                                <span>Current Resume</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground" suppressHydrationWarning>
                                                <ClockIcon className="h-3 w-3" />
                                                {lastUpdatedText}
                                            </div>
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => {
                                                setUseExistingResume(false);
                                                form.setValue("resumeUrl", "");
                                            }}
                                        >
                                            Update
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            type="file" 
                                            accept=".pdf,.doc,.docx" 
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Accepted formats: PDF, DOC, DOCX
                                    </p>
                                    
                                    {candidateProfile.resumeUrl && (
                                        <Button 
                                            type="button" 
                                            variant="link" 
                                            size="sm" 
                                            className="h-auto p-0 text-muted-foreground"
                                            onClick={() => {
                                                setUseExistingResume(true);
                                                setSelectedFile(null);
                                                form.setValue("resumeUrl", candidateProfile.resumeUrl || "");
                                            }}
                                        >
                                            Use existing resume instead
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting Application..." : "Submit Application"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    );
}
