"use client";

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, FileText, Save, Wand2, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateInterviewAction } from "@/lib/server/interview-actions";
import { generateInterviewReportAction } from "@/lib/server/ai-actions";

interface MockRoomProps {
    interviewId: string;
    organizerName: string;
    candidateName: string;
    startTime: Date;
    duration: number; // in minutes
    isOrganizer?: boolean;
    initialNotes?: string;
    returnUrl?: string;
}

export function MockRoom({ interviewId, organizerName, candidateName, startTime, duration, isOrganizer = false, initialNotes = "", returnUrl = "/dashboard" }: MockRoomProps) {
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isCallActive, setIsCallActive] = useState(true);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [notes, setNotes] = useState(initialNotes);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEndingCall, setIsEndingCall] = useState(false);
    const router = useRouter();

    const handleEndCall = async () => {
        if (isOrganizer) {
            setIsEndingCall(true);
            try {
                // 1. Update status to completed and save final notes
                const updateResult = await updateInterviewAction(interviewId, { 
                    status: "completed",
                    notes: notes
                });

                if (!updateResult.success) {
                    toast.error("Failed to update interview status");
                }

                // 2. Generate report if notes exist
                if (notes.trim()) {
                    toast.info("Generating interview report...");
                    const reportResult = await generateInterviewReportAction(interviewId);
                    if (reportResult.success) {
                        toast.success("Interview report generated successfully");
                    } else {
                        toast.error("Failed to generate report");
                    }
                }
            } catch (error) {
                console.error("Error ending call:", error);
                toast.error("An error occurred while ending the call");
            } finally {
                setIsEndingCall(false);
            }
        }
        setIsCallActive(false);
    };

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            const result = await updateInterviewAction(interviewId, { notes });
            if (result.success) {
                toast.success("Notes saved successfully");
            } else {
                toast.error(result.error || "Failed to save notes");
            }
        } catch (error) {
            toast.error("An error occurred while saving notes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!notes.trim()) {
            toast.error("Please add notes before generating a report");
            return;
        }

        // Auto-save before generating
        setIsSaving(true);
        try {
             await updateInterviewAction(interviewId, { notes });
        } catch {
             toast.error("Failed to auto-save notes");
             setIsSaving(false);
             return;
        }
        setIsSaving(false);

        setIsGenerating(true);
        try {
            const result = await generateInterviewReportAction(interviewId);
            if (result.success) {
                toast.success("Interview report generated successfully");
            } else {
                toast.error(result.error || "Failed to generate report");
            }
        } catch (error) {
            toast.error("An error occurred while generating report");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isCallActive) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Call Ended</CardTitle>
                        <CardDescription>The interview has ended.</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-2 justify-center">
                        <Button variant="default" className="w-full" onClick={() => router.push(returnUrl)}>
                            Return to App
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => window.close()}>
                            Close Tab
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col bg-background text-foreground dark">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-card border-b border-border">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                        Mock Provider
                    </Badge>
                    <h1 className="text-lg font-semibold">Interview Room</h1>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>2 Participants</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
                        {/* Remote User (Other Person) - Left Side */}
                        <Card className="bg-card border-border h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(isOrganizer ? candidateName : organizerName)}&background=random`} alt={isOrganizer ? candidateName : organizerName} />
                                    <AvatarFallback>{(isOrganizer ? candidateName : organizerName).substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="absolute bottom-4 left-4 bg-background/70 text-foreground px-2 py-1 rounded text-sm flex items-center gap-2">
                                <span>{isOrganizer ? candidateName : organizerName} ({isOrganizer ? "Candidate" : "Organizer"})</span>
                                <Mic className="h-3 w-3 text-success" />
                            </div>
                        </Card>

                        {/* Local User (You) - Right Side */}
                        <Card className="bg-card border-border h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
                             <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                {isVideoOn ? (
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(isOrganizer ? organizerName : candidateName)}&background=random`} alt={isOrganizer ? organizerName : candidateName} />
                                        <AvatarFallback>{(isOrganizer ? organizerName : candidateName).substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="text-muted-foreground">Camera Off</div>
                                )}
                            </div>
                            <div className="absolute bottom-4 left-4 bg-background/70 text-foreground px-2 py-1 rounded text-sm flex items-center gap-2">
                                <span>{isOrganizer ? organizerName : candidateName} (You)</span>
                                {isMicOn ? (
                                    <Mic className="h-3 w-3 text-success" />
                                ) : (
                                    <MicOff className="h-3 w-3 text-destructive" />
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Notes Panel */}
                {isOrganizer && isNotesOpen && (
                    <div className="absolute inset-0 md:relative md:inset-auto w-full md:w-96 bg-card border-l border-border flex flex-col transition-all duration-300 z-10">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h2 className="font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Interview Notes
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="md:hidden"
                                onClick={() => setIsNotesOpen(false)}
                                aria-label="Close notes"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Type your notes here..."
                                className="h-full min-h-[300px] bg-background border-border resize-none placeholder:text-muted-foreground"
                                aria-label="Interview notes"
                            />
                        </div>
                        <div className="p-4 border-t border-border flex gap-2 flex-col">
                             <Button
                                variant="default"
                                className="w-full"
                                onClick={handleGenerateReport}
                                disabled={isGenerating || isSaving}
                            >
                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                                Generate Report
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleSaveNotes}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Notes
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="p-6 bg-card border-t border-border flex justify-center gap-4 relative items-center">
                <div className="flex gap-4">
                    <Button
                        variant={isMicOn ? "secondary" : "destructive"}
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={() => setIsMicOn(!isMicOn)}
                        aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
                    >
                        {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant={isVideoOn ? "secondary" : "destructive"}
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={() => setIsVideoOn(!isVideoOn)}
                        aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
                    >
                        {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={handleEndCall}
                        disabled={isEndingCall}
                        aria-label="End call"
                    >
                        {isEndingCall ? <Loader2 className="h-5 w-5 animate-spin" /> : <PhoneOff className="h-5 w-5" />}
                    </Button>
                </div>

                {isOrganizer && (
                    <Button
                        variant={isNotesOpen ? "secondary" : "outline"}
                        size="icon"
                        className="h-12 w-12 rounded-full absolute right-6"
                        onClick={() => setIsNotesOpen(!isNotesOpen)}
                        aria-label={isNotesOpen ? "Close notes panel" : "Open notes panel"}
                        aria-expanded={isNotesOpen}
                    >
                        <FileText className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </div>
    );
}
