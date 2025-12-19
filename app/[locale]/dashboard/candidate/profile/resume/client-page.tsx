"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadIcon, FileTextIcon, EyeIcon, CircleNotchIcon, TrashIcon } from "@phosphor-icons/react";
import { getResumeUploadUrlAction, getResumeDownloadUrlAction } from "@/lib/server/file-actions";
import { updateCandidateResumeAction, setDefaultResumeAction, deleteResumeAction } from "@/lib/server/candidate-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { candidate, candidateFile } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { StarIcon } from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CandidateWithFiles = InferSelectModel<typeof candidate> & {
    files?: InferSelectModel<typeof candidateFile>[];
};

interface ResumeClientPageProps {
    candidateProfile: CandidateWithFiles | null;
}

export default function ResumeClientPage({ candidateProfile }: ResumeClientPageProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);

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

    const [viewingFileId, setViewingFileId] = useState<string | null>(null);

    const handleViewResume = async (fileKey: string | null, fileId: string) => {
        if (!fileKey) return;
        
        setViewingFileId(fileId);
        try {
            const result = await getResumeDownloadUrlAction(fileKey);
            if (result.success) {
                window.open(result.url, '_blank');
            } else {
                toast.error(result.error || "Failed to generate download link");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to view resume");
        } finally {
            setViewingFileId(null);
        }
    };

    const handleSetDefault = async (fileId: string) => {
        try {
            await setDefaultResumeAction(fileId);
            toast.success("Default resume updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to set default resume");
        }
    };

    const confirmDelete = async () => {
        if (!resumeToDelete) return;
        try {
            await deleteResumeAction(resumeToDelete);
            toast.success("Resume deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete resume");
        } finally {
            setResumeToDelete(null);
        }
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
                    <CardTitle>Resume History</CardTitle>
                    <CardDescription>
                        Manage your uploaded resumes. Select one as default for new applications.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {candidateProfile?.files && candidateProfile.files.length > 0 ? (
                        <div className="space-y-4">
                            {candidateProfile.files.map((file) => {
                                const isDefault = candidateProfile.resumeUrl === file.url;
                                return (
                                    <div key={file.id} className={`flex items-center justify-between p-4 border rounded-lg ${isDefault ? 'border-primary/50 bg-primary/5' : ''}`}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-2 rounded shrink-0 ${isDefault ? 'bg-primary/20' : 'bg-muted'}`}>
                                                <FileTextIcon className={`h-6 w-6 ${isDefault ? 'text-primary' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
                                                        {file.fileName}
                                                    </p>
                                                    {isDefault && (
                                                        <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-primary/10 text-primary border-primary/20">
                                                            Default
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Uploaded {format(new Date(file.createdAt), 'MMM d, yyyy')} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            {!isDefault && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Set as Default"
                                                    onClick={() => handleSetDefault(file.id)}
                                                >
                                                    <StarIcon className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                </Button>
                                            )}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                title="View" 
                                                onClick={() => handleViewResume(file.fileKey, file.id)}
                                                disabled={viewingFileId === file.id}
                                            >
                                                {viewingFileId === file.id ? <CircleNotchIcon className="h-4 w-4 animate-spin" /> : <EyeIcon className="h-4 w-4" />}
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                                                title="Delete" 
                                                onClick={() => setResumeToDelete(file.id)}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <p>No resumes uploaded yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!resumeToDelete} onOpenChange={(open) => !open && setResumeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this resume? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
