"use client";

import { useEffect, useRef, useState } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DailyRoomProps {
    roomUrl: string;
    token?: string;
    userName?: string;
}

export function DailyRoom({ roomUrl, token, userName }: DailyRoomProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const callFrameRef = useRef<DailyCall | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!containerRef.current) return;
        
        let isMounted = true;

        const initDaily = async () => {
            // Prevent duplicate instances if we already have one tracked
            if (callFrameRef.current) return;

            // Cleanup any existing global instances to be safe
            // This handles hot module reloading or strict mode edge cases
            const existingInstance = DailyIframe.getCallInstance();
            if (existingInstance) {
                try {
                    console.log("Destroying existing Daily instance...");
                    await existingInstance.destroy();
                } catch (e) {
                    console.warn("Failed to destroy existing Daily instance:", e);
                }
            }

            if (!isMounted || !containerRef.current) return;

            try {
                console.log("Creating new Daily frame...");
                const frame = DailyIframe.createFrame(containerRef.current, {
                    iframeStyle: {
                        width: "100%",
                        height: "100%",
                        border: "none",
                        backgroundColor: "hsl(222.2 84% 4.9%)"
                    },
                    showLeaveButton: true,
                    showFullscreenButton: true,
                });

                callFrameRef.current = frame;

                const joinOptions: { url: string; userName?: string; token?: string } = { url: roomUrl, userName };
                if (token) {
                    joinOptions.token = token;
                }

                console.log("Joining Daily room...", joinOptions);
                await frame.join(joinOptions);

                frame.on("left-meeting", () => {
                    // We don't destroy here immediately to avoid race conditions, 
                    // but we can trigger a refresh or navigation.
                    // The cleanup function will handle destruction.
                    router.refresh();
                });

                frame.on("error", (e) => {
                    console.error("Daily frame error:", e);
                });

            } catch (error) {
                console.error("Error creating/joining Daily frame:", error);
            }
        };

        initDaily();

        return () => {
            isMounted = false;
            try {
                if (callFrameRef.current) {
                    console.log("Cleaning up Daily frame...");
                    callFrameRef.current.destroy();
                    callFrameRef.current = null;
                }
            } catch (e) {
                console.error("Error destroying Daily frame:", e);
            }
        };
    }, [roomUrl, token, userName, router]);

    return (
        <div className="flex h-screen w-full flex-col bg-background dark">
            <div ref={containerRef} className="flex-1 w-full h-full" />
        </div>
    );
}
