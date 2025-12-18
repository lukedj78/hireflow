"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadIcon, FileTextIcon, EyeIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { getResumeUploadUrlAction, getResumeDownloadUrlAction } from "@/lib/server/file-actions";
import { updateCandidateResumeAction } from "@/lib/server/candidate-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { candidate, candidateFile } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";

type CandidateWithFiles = InferSelectModel<typeof candidate> & {
    files?: InferSelectModel<typeof candidateFile>[];
};

interface ResumeClientPageProps {
    candidateProfile: CandidateWithFiles | null;
}

export default function ResumeClientPage({ candidateProfile }: ResumeClientPageProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!validTypes.includes(file.type)) {
            toast.error("Please upload a PDF or DOCX file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB.");
            return;
        }

        setIsUploading(true);
        try {
            // 1. Get presigned URL
            const { success, data } = await getResumeUploadUrlAction(file.name, file.type, file.size);
            if (!success || !data) throw new Error("Failed to get upload URL");

            // 2. Upload to Storage
            const uploadRes = await fetch(data.uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });
            if (!uploadRes.ok) throw new Error("Failed to upload file to storage");

            // 3. Update profile
            await updateCandidateResumeAction({
                resumeUrl: data.publicUrl,
                resumeKey: data.fileKey,
                resumeFileName: file.name,
                resumeSize: file.size,
                resumeType: file.type,
            });

            toast.success("Resume updated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update resume.");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    const [isViewing, setIsViewing] = useState(false);

    const handleViewResume = async () => {
        if (!candidateProfile) return;
        
        setIsViewing(true);
        try {
            const fileKey = candidateProfile.files?.[0]?.fileKey;

            if (fileKey) {
                const result = await getResumeDownloadUrlAction(fileKey);
                if (result.success) {
                    window.open(result.url, '_blank');
                } else {
                    toast.error(result.error || "Failed to generate download link");
                }
            } else if (candidateProfile.resumeUrl) {
                window.open(candidateProfile.resumeUrl, '_blank');
            } else {
                toast.error("No resume found");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to view resume");
        } finally {
            setIsViewing(false);
        }
    };

    const handleDelete = () => {
        // Implement delete action if needed, or just warn user
        toast.info("Delete functionality coming soon. You can upload a new resume to replace the current one.");
    };

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Resume</CardTitle>
                    <CardDescription>
                        Upload your latest resume in PDF or DOCX format. Max size 5MB.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 hover:bg-muted/50 transition-colors">
                        <input 
                            type="file" 
                            accept=".pdf,.docx"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        {isUploading ? (
                            <CircleNotchIcon className="h-10 w-10 text-primary animate-spin mb-4" />
                        ) : (
                            <UploadIcon className="h-10 w-10 text-muted-foreground mb-4" />
                        )}
                        <p className="text-sm font-medium">
                            {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX (Max 5MB)</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Current Resume</CardTitle>
                    <CardDescription>
                        This is the resume currently used for your applications.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {candidateProfile?.resumeUrl ? (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-primary/10 rounded shrink-0">
                                    <FileTextIcon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium truncate max-w-[200px]">
                                        {/* Since we don't store filename on candidate table separately (only url), we extract or show generic */}
                                        {candidateProfile.files?.[0]?.fileName || "Resume"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Updated on {candidateProfile.resumeLastUpdatedAt ? format(new Date(candidateProfile.resumeLastUpdatedAt), 'MMM d, yyyy') : 'Unknown date'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    title="View" 
                                    onClick={handleViewResume}
                                    disabled={isViewing}
                                >
                                    {isViewing ? <CircleNotchIcon className="h-4 w-4 animate-spin" /> : <EyeIcon className="h-4 w-4" />}
                                </Button>
                                {/*  
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete" onClick={handleDelete}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                */}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <p>No resume uploaded yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
