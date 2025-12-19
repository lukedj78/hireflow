import { IVideoProvider, CreateMeetingResult } from "./types";
import { SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";

export class HundredMsVideoProvider implements IVideoProvider {
    private accessKey: string;
    private appSecret: string;
    private templateId: string;

    constructor() {
        const accessKey = process.env.HMS_ACCESS_KEY;
        const appSecret = process.env.HMS_APP_SECRET;
        const templateId = process.env.HMS_TEMPLATE_ID;

        if (!accessKey || !appSecret) {
            console.warn("HMS_ACCESS_KEY or HMS_APP_SECRET is not set. 100ms provider will fail.");
        }

        this.accessKey = accessKey || "";
        this.appSecret = appSecret || "";
        this.templateId = templateId || "default_videoconf_7e45063c-3932-411a-9d29-6d8753239c80"; // Default template ID if not provided
    }

    private async getManagementToken(): Promise<string> {
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 60 * 60; // 1 hour

        const payload = {
            access_key: this.accessKey,
            type: "management",
            version: 2,
            iat,
            exp,
            jti: uuidv4(),
        };

        const secret = new TextEncoder().encode(this.appSecret);
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .sign(secret);
    }

    async createMeeting(topic: string, startTime: Date, duration: number): Promise<CreateMeetingResult> {
        if (!this.accessKey || !this.appSecret) {
            throw new Error("HMS_ACCESS_KEY or HMS_APP_SECRET is missing. Please set them in your .env file.");
        }

        const managementToken = await this.getManagementToken();

        try {
            const response = await fetch("https://api.100ms.live/v2/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${managementToken}`,
                },
                body: JSON.stringify({
                    name: `${topic.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-${uuidv4().substring(0, 8)}`,
                    description: topic,
                    template_id: this.templateId,
                    region: "eu" // Default to EU, can be parameterized
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`100ms API error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            // data structure: { id: "room_id", name: "room_name", ... }

            return {
                id: data.id,
                url: "", // 100ms rooms don't have a single URL, they use room codes or auth tokens. We'll handle this in the frontend.
                provider: "hundredms",
                metadata: {
                    roomId: data.id,
                    roomName: data.name,
                },
            };
        } catch (error) {
            console.error("100ms createMeeting failed:", error);
            throw error;
        }
    }

    async generateToken(meetingId: string, participantName: string, role: 'host' | 'guest'): Promise<string> {
        if (!this.accessKey || !this.appSecret) {
            throw new Error("HMS_ACCESS_KEY or HMS_APP_SECRET is missing");
        }

        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 60 * 60 * 24; // 24 hours validity

        // Map 'host' to 'host' (or whatever role name is in your template) and 'guest' to 'guest'
        // Common roles in 100ms templates are 'host', 'guest', 'teacher', 'student'
        const hmsRole = role === 'host' ? 'host' : 'guest';

        const payload = {
            access_key: this.accessKey,
            room_id: meetingId,
            user_id: uuidv4(), // Unique ID for the participant
            role: hmsRole,
            type: "app",
            version: 2,
            iat,
            exp,
            jti: uuidv4(),
        };

        const secret = new TextEncoder().encode(this.appSecret);
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .sign(secret);
    }
}
