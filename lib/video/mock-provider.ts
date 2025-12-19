import { IVideoProvider, CreateMeetingResult } from "./types";
import { v4 as uuidv4 } from "uuid";

export class MockVideoProvider implements IVideoProvider {
    async createMeeting(topic: string, startTime: Date, duration: number): Promise<CreateMeetingResult> {
        const meetingId = uuidv4();
        // In un caso reale, questo sarebbe l'URL del provider o una rotta interna
        // Per il mock, generiamo un link fittizio che potrebbe portare a una pagina di test
        const mockUrl = `https://meet.mock-provider.com/${meetingId}`;

        console.log(`[MockVideoProvider] Creating meeting: ${topic} at ${startTime} (${duration} min)`);

        return {
            id: meetingId,
            url: mockUrl,
            provider: "mock",
            metadata: {
                createdAt: new Date().toISOString(),
                mock: true
            }
        };
    }

    async generateToken(meetingId: string, participantName: string, role: 'host' | 'guest'): Promise<string> {
        console.log(`[MockVideoProvider] Generating token for ${participantName} (${role}) in meeting ${meetingId}`);
        return `mock-token-${role}-${participantName}-${meetingId}`;
    }

    async deleteMeeting(meetingId: string): Promise<void> {
        console.log(`[MockVideoProvider] Deleting meeting ${meetingId}`);
    }
}
