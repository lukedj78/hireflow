import { IVideoProvider, CreateMeetingResult } from "./types";

export class DailyVideoProvider implements IVideoProvider {
    private apiKey: string;

    constructor() {
        const apiKey = process.env.DAILY_API_KEY;
        if (!apiKey) {
            console.warn("DAILY_API_KEY is not set. Daily provider will fail.");
        }
        this.apiKey = apiKey || "";
    }

    async createMeeting(topic: string, startTime: Date, duration: number): Promise<CreateMeetingResult> {
        if (!this.apiKey) {
            throw new Error("DAILY_API_KEY is missing. Please set it in your .env file.");
        }

        // Daily rooms are created via POST /rooms
        // exp is unix timestamp in seconds
        const exp = Math.floor(startTime.getTime() / 1000) + (duration * 60) + (60 * 60); // duration + 1 hour buffer

        try {
            const response = await fetch("https://api.daily.co/v1/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    privacy: "public", // Public for MVP simplicity
                    properties: {
                        exp: exp,
                        enable_chat: true,
                        enable_screenshare: true,
                        start_audio_off: false,
                        start_video_off: false,
                        lang: "en" // Or dynamic based on locale
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Daily API error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            // data structure: { id: "uuid", name: "room-name", url: "https://...", ... }

            return {
                id: data.name, // We use the room name (slug) as ID because it's cleaner
                url: data.url,
                provider: "daily",
                metadata: {
                    roomName: data.name,
                    roomUrl: data.url,
                    expiresAt: new Date(exp * 1000).toISOString(),
                    dailyId: data.id
                }
            };
        } catch (error) {
            console.error("Daily createMeeting failed:", error);
            throw error;
        }
    }

    async generateToken(meetingId: string, participantName: string, role: 'host' | 'guest'): Promise<string> {
        // Not strictly needed for public rooms, but implemented for future proofing
        if (!this.apiKey) {
            throw new Error("DAILY_API_KEY is missing");
        }

        const response = await fetch("https://api.daily.co/v1/meeting-tokens", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                properties: {
                    room_name: meetingId,
                    user_name: participantName,
                    is_owner: role === 'host',
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to generate token: ${await response.text()}`);
        }

        const data = await response.json();
        return data.token;
    }

    async deleteMeeting(meetingId: string): Promise<void> {
        if (!this.apiKey) return;
        
        await fetch(`https://api.daily.co/v1/rooms/${meetingId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`
            }
        });
    }
}
