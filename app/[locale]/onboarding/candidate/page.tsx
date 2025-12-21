"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeCandidateOnboardingAction } from "@/lib/server/onboarding-actions";
import { getResumeUploadUrlAction } from "@/lib/server/file-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, FileTextIcon } from "@phosphor-icons/react";

import { PageLayout } from "@/components/page-layout";

export default function CandidateOnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    const [formData, setFormData] = useState({
        phone: "",
        resumeUrl: "",
        skills: "",
        summary: ""
    });

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            // Clear URL if file is selected to avoid confusion
            setFormData(prev => ({ ...prev, resumeUrl: "" }));
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

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            let resumeUrl = formData.resumeUrl || undefined;
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
            }

            await completeCandidateOnboardingAction({
                phone: formData.phone,
                resumeUrl,
                resumeKey,
                resumeFileName,
                resumeSize,
                resumeType,
                skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
            });
            toast.success("Profile setup complete!");
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            toast.error("Failed to setup profile.");
            setIsLoading(false);
        }
    };

    return (
        <PageLayout maxWidth="xl">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-medium ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>Step 1: Contact</span>
                    <span className={`text-sm font-medium ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>Step 2: Skills</span>
                    <span className={`text-sm font-medium ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>Step 3: Review</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-300 ease-in-out" 
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            <Card>
                {step === 1 && (
                    <>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Let recruiters contact you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input 
                                    id="phone" 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                            
                            <div className="space-y-4 border-t pt-4">
                                <Label>Resume / CV</Label>
                                
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="resume-upload" className="text-xs text-muted-foreground">Upload File (PDF, DOCX)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                id="resume-upload"
                                                type="file" 
                                                accept=".pdf,.doc,.docx" 
                                                onChange={handleFileChange}
                                                className="cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">Or provide a link</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="resume-url" className="text-xs text-muted-foreground">Resume URL</Label>
                                        <Input 
                                            id="resume-url" 
                                            value={formData.resumeUrl}
                                            onChange={(e) => {
                                                setFormData({...formData, resumeUrl: e.target.value});
                                                if (e.target.value) setSelectedFile(null);
                                            }}
                                            placeholder="https://linkedin.com/in/..."
                                            disabled={!!selectedFile}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={handleNext}>
                                Next <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </>
                )}

                {step === 2 && (
                    <>
                        <CardHeader>
                            <CardTitle>Skills & Expertise</CardTitle>
                            <CardDescription>What are you good at?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="skills">Skills (Comma separated)</Label>
                                <Textarea 
                                    id="skills" 
                                    value={formData.skills}
                                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                                    placeholder="React, Next.js, TypeScript, Node.js..."
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={handleBack}>
                                <ArrowLeftIcon className="h-4 w-4" /> Back
                            </Button>
                            <Button onClick={handleNext}>
                                Next <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </>
                )}

                {step === 3 && (
                    <>
                        <CardHeader>
                            <CardTitle>Review & Finish</CardTitle>
                            <CardDescription>You&apos;re almost done!</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <p><strong>Phone:</strong> {formData.phone || "Not provided"}</p>
                                <p className="flex items-center gap-2">
                                    <strong>Resume:</strong> 
                                    {selectedFile ? (
                                        <span className="flex items-center gap-1">
                                            <FileTextIcon className="w-4 h-4" /> {selectedFile.name}
                                        </span>
                                    ) : (
                                        formData.resumeUrl || "Not provided"
                                    )}
                                </p>
                                <p><strong>Skills:</strong> {formData.skills || "None listed"}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                                <ArrowLeftIcon className="h-4 w-4" /> Back
                            </Button>
                            <Button onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? "Setting up..." : "Complete Setup"} 
                                {!isLoading && <CheckIcon className="ml-2 h-4 w-4" />}
                            </Button>
                        </CardFooter>
                    </>
                )}
            </Card>
        </PageLayout>
    );
}
