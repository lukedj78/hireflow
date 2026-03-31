"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, FileText, Save, Wand2, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateInterviewAction } from "@/lib/server/interview-actions";
import { generateInterviewReportAction } from "@/lib/server/ai-actions";
import {
    HMSRoomProvider,
    useHMSActions,
    useHMSStore,
    selectIsConnectedToRoom,
    selectPeers,
    selectLocalPeer,
    selectIsLocalAudioEnabled,
    selectIsLocalVideoEnabled,
    useVideo,
    HMSPeer
} from "@100mslive/react-sdk";

interface HundredMsRoomProps {
    interviewId: string;
    token: string;
    organizerName: string; // Used for UI labels if peer name matches or fallback
    candidateName: string; // Used for UI labels if peer name matches or fallback
    isOrganizer?: boolean;
    initialNotes?: string;
    returnUrl?: string;
}

function VideoTile({ peer, isLocal }: { peer: HMSPeer; isLocal?: boolean }) {
    const { videoRef } = useVideo({
        trackId: peer.videoTrack
    });

    return (
        <div className="relative w-full h-full bg-card flex items-center justify-center overflow-hidden rounded-md">
            {peer.videoTrack ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted={isLocal}
                    playsInline
                    className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
                />
            ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(peer.name)}&background=random`} alt={peer.name} />
                        <AvatarFallback>{peer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p>Camera Off</p>
                </div>
            )}
            
            <div className="absolute bottom-4 left-4 bg-background/70 text-foreground px-2 py-1 rounded text-sm flex items-center gap-2">
                <span>{peer.name} {isLocal ? "(You)" : ""} {peer.roleName ? `(${peer.roleName})` : ""}</span>
                {!peer.audioTrack ? (
                     <MicOff className="h-3 w-3 text-destructive" />
                ) : (
                    <Mic className="h-3 w-3 text-success" />
                )}
            </div>
        </div>
    );
}

function Conference({ interviewId, token, organizerName, candidateName, isOrganizer = false, initialNotes = "", returnUrl = "/dashboard" }: HundredMsRoomProps) {
    const isConnected = useHMSStore(selectIsConnectedToRoom);
    const peers = useHMSStore(selectPeers);
    const localPeer = useHMSStore(selectLocalPeer);
    const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
    const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
    const hmsActions = useHMSActions();
    const router = useRouter();

    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [notes, setNotes] = useState(initialNotes);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEndingCall, setIsEndingCall] = useState(false);

    useEffect(() => {
        const joinRoom = async () => {
            try {
                await hmsActions.join({
                    authToken: token,
                    userName: isOrganizer ? organizerName : candidateName,
                });
            } catch (e) {
                console.error("Failed to join room", e);
                toast.error("Failed to join the meeting");
            }
        };

        if (token && !isConnected) {
            joinRoom();
        }

        // Cleanup on unmount
        return () => {
            if (isConnected) {
                hmsActions.leave();
            }
        };
    }, [token, isConnected, hmsActions, isOrganizer, organizerName, candidateName]);

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
        
        await hmsActions.leave();
        router.push(returnUrl);
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

    const toggleAudio = async () => {
        await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
    };

    const toggleVideo = async () => {
        await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
    };

    if (!isConnected) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background p-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Joining meeting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col bg-background text-foreground dark">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-card border-b border-border">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                        100ms Provider
                    </Badge>
                    <h1 className="text-lg font-semibold">Interview Room</h1>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{peers.length} Participants</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
                        {peers.map((peer) => (
                            <Card key={peer.id} className="bg-card border-border h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
                                <VideoTile peer={peer} isLocal={peer.isLocal} />
                            </Card>
                        ))}
                        {peers.length === 0 && (
                            <div className="col-span-2 flex items-center justify-center text-muted-foreground">
                                Waiting for others to join...
                            </div>
                        )}
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
                        variant={isLocalAudioEnabled ? "secondary" : "destructive"}
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={toggleAudio}
                        aria-label={isLocalAudioEnabled ? "Mute microphone" : "Unmute microphone"}
                    >
                        {isLocalAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant={isLocalVideoEnabled ? "secondary" : "destructive"}
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={toggleVideo}
                        aria-label={isLocalVideoEnabled ? "Turn off camera" : "Turn on camera"}
                    >
                        {isLocalVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
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

export function HundredMsRoom(props: HundredMsRoomProps) {
    return (
        <HMSRoomProvider>
            <Conference {...props} />
        </HMSRoomProvider>
    );
}
