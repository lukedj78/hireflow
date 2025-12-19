import { db } from "@/lib/db";
import { interview } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { MockRoom } from "@/components/room/mock-room";
import { DailyRoom } from "@/components/room/daily-room";
import { HundredMsRoom } from "@/components/room/hundredms-room";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { VideoProviderFactory } from "@/lib/video/factory";

interface RoomPageProps {
    params: Promise<{
        interviewId: string;
        locale: string;
    }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
    const { interviewId, locale } = await params;

    const interviewData = await db.query.interview.findFirst({
        where: eq(interview.id, interviewId),
        with: {
            organizer: {
                columns: {
                    name: true,
                    email: true,
                    image: true,
                }
            },
            candidate: {
                columns: {
                    name: true,
                    email: true,
                    // Exclude embedding to avoid "JSON cannot hold BLOB values" error
                }
            },
            job: {
                columns: {
                    organizationId: true,
                    title: true,
                    // Exclude embedding
                }
            },
        },
    });

    if (!interviewData) {
        notFound();
    }

    // Check if meeting provider is set
    if (!interviewData.meetingProvider) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            Meeting Not Ready
                        </CardTitle>
                        <CardDescription>
                            This interview does not have a video provider configured.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                            Please contact the organizer directly or check your email for a different link.
                        </p>
                        {interviewData.meetingLink && (
                            <Link 
                                href={interviewData.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={buttonVariants({ className: "w-full" })}
                            >
                                Open External Link
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Determine current user name
    const session = await auth.api.getSession({ headers: await headers() });
    let userName = interviewData.candidate.name; // Default to candidate name (guest)
    let isOrganizer = false;
    
    if (session) {
        userName = session.user.name;
        // Check both ID and email to be more robust, especially with impersonation or seeding
        isOrganizer = session.user.id === interviewData.organizerId || session.user.email === interviewData.organizer.email;
    }

    // Calculate duration in minutes
    const duration = Math.round((interviewData.endTime.getTime() - interviewData.startTime.getTime()) / (1000 * 60));

    const returnUrl = `/${locale}/dashboard/${interviewData.job.organizationId}/jobs/${interviewData.jobId}/applications/${interviewData.applicationId}`;

    // Render the appropriate provider component
    switch (interviewData.meetingProvider) {
        case "mock":
            return (
                <MockRoom
                    interviewId={interviewData.id}
                    organizerName={interviewData.organizer.name}
                    candidateName={interviewData.candidate.name}
                    startTime={interviewData.startTime}
                    duration={duration}
                    isOrganizer={isOrganizer}
                    initialNotes={interviewData.notes || ""}
                    returnUrl={returnUrl}
                />
            );
        case "daily":
            let dailyMetadata = interviewData.meetingMetadata;
            
            // Handle case where metadata is a string (double-encoded or not parsed by Drizzle)
            if (typeof dailyMetadata === 'string') {
                try {
                    dailyMetadata = JSON.parse(dailyMetadata);
                } catch (e) {
                    console.error("Failed to parse meetingMetadata", e);
                }
            }

            // Handle double-encoded JSON string if necessary (parse again if it's still a string)
            if (typeof dailyMetadata === 'string') {
                 try {
                    dailyMetadata = JSON.parse(dailyMetadata);
                } catch (e) {
                     console.error("Failed to parse meetingMetadata (second pass)", e);
                }
            }

            const metadata = dailyMetadata as { roomUrl?: string; roomName?: string };

            if (!metadata?.roomUrl) {
                return (
                    <div className="flex h-screen flex-col items-center justify-center gap-4 text-red-500">
                        <p>Error: Missing room URL in meeting metadata.</p>
                        <pre className="rounded bg-gray-100 p-4 text-xs text-black">
                            {JSON.stringify(interviewData.meetingMetadata, null, 2)}
                        </pre>
                    </div>
                );
            }

            // Generate token for secure access
            let token: string | undefined;
            // Token generation disabled to avoid 'account-missing-payment-method' error on free tier
            /*
            try {
                const videoProvider = VideoProviderFactory.getProvider("daily");
                // Check if current user is the organizer
                const isOrganizer = session?.user?.id === interviewData.organizer.id;
                const role = isOrganizer ? 'host' : 'guest';
                
                // We need the room name/ID to generate a token
                // In our implementation, we stored it as roomName in metadata
                if (metadata.roomName) {
                    token = await videoProvider.generateToken(metadata.roomName, userName, role);
                }
            } catch (error) {
                console.error("Failed to generate Daily token:", error);
                // We continue without a token, though joining might fail if the room is private
            }
            */

            return (
                <DailyRoom
                    roomUrl={metadata.roomUrl}
                    userName={userName}
                    token={token}
                />
            );
        case "hundredms":
        case "100ms":
            let hmsMetadata = interviewData.meetingMetadata;
            if (typeof hmsMetadata === 'string') {
                try {
                    hmsMetadata = JSON.parse(hmsMetadata);
                } catch (e) {
                    console.error("Failed to parse meetingMetadata", e);
                }
            }
            // Double decode if needed
            if (typeof hmsMetadata === 'string') {
                try {
                    hmsMetadata = JSON.parse(hmsMetadata);
                } catch (e) {
                    console.error("Failed to parse meetingMetadata (second pass)", e);
                }
            }

            const hmsData = hmsMetadata as { roomId?: string };

            if (!hmsData?.roomId) {
                return (
                    <div className="flex h-screen flex-col items-center justify-center gap-4 text-red-500">
                        <p>Error: Missing room ID for 100ms provider.</p>
                    </div>
                );
            }

            let hmsToken = "";
            try {
                const videoProvider = VideoProviderFactory.getProvider("hundredms");
                const role = isOrganizer ? 'host' : 'guest';
                // Use roomId to generate token
                hmsToken = await videoProvider.generateToken(hmsData.roomId, userName, role);
            } catch (error) {
                console.error("Failed to generate 100ms token:", error);
                return (
                    <div className="flex h-screen flex-col items-center justify-center gap-4 text-red-500">
                        <p>Error: Failed to generate access token. Please check server logs.</p>
                    </div>
                );
            }

            return (
                <HundredMsRoom
                    interviewId={interviewData.id}
                    token={hmsToken}
                    organizerName={interviewData.organizer.name}
                    candidateName={interviewData.candidate.name}
                    isOrganizer={isOrganizer}
                    initialNotes={interviewData.notes || ""}
                    returnUrl={returnUrl}
                />
            );
        case "livekit":
            // return <LiveKitRoom ... />
            return <div>LiveKit integration coming soon</div>;
        default:
            return <div>Unknown meeting provider: {interviewData.meetingProvider}</div>;
    }
}
