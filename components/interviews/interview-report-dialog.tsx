"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateInterviewAction } from "@/lib/server/interview-actions";
import { generateInterviewReportAction } from "@/lib/server/ai-actions";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";

interface InterviewReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    interview: {
        id: string;
        notes: string | null;
        feedbackReport: string | null;
    };
}

export function InterviewReportDialog({ open, onOpenChange, interview }: InterviewReportDialogProps) {
    const [notes, setNotes] = useState(interview.notes || "");
    const [report, setReport] = useState(interview.feedbackReport || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateInterviewAction(interview.id, {
                notes,
                feedbackReport: report,
            });

            if (result.success) {
                toast.success("Interview updated successfully");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (!notes) {
            toast.error("Please add notes first");
            return;
        }

        // Save notes first if they changed, so server has latest notes
        if (notes !== interview.notes) {
             const updateResult = await updateInterviewAction(interview.id, { notes });
             if (!updateResult.success) {
                 toast.error("Failed to save notes before generation");
                 return;
             }
        }

        setIsGenerating(true);
        try {
            const result = await generateInterviewReportAction(interview.id);
            if (result.success && result.data) {
                setReport(result.data);
                toast.success("Report generated successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to generate report");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Interview Report</DialogTitle>
                    <DialogDescription>
                        Add your notes and generate an AI report.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <h3 className="font-medium">Interviewer Notes</h3>
                        <Textarea 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)} 
                            placeholder="Take notes during or after the interview..."
                            className="min-h-[150px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">AI Report</h3>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleGenerate} 
                                disabled={isGenerating || !notes}
                            >
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                Generate with AI
                            </Button>
                        </div>
                        <Tabs defaultValue="preview" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                                <TabsTrigger value="edit">Edit</TabsTrigger>
                            </TabsList>
                            <TabsContent value="preview" className="min-h-[300px] rounded-md border p-4 overflow-y-auto bg-muted/30">
                                {report ? (
                                    <div className="prose dark:prose-invert text-sm max-w-none">
                                        <ReactMarkdown>{report}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm italic">
                                        No report generated yet. Click &quot;Generate with AI&quot; or switch to Edit mode to write one manually.
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="edit">
                                <Textarea 
                                    value={report} 
                                    onChange={(e) => setReport(e.target.value)} 
                                    placeholder="Generated report will appear here..."
                                    className="min-h-[300px] font-mono text-sm"
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}