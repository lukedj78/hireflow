import { nanoid } from "nanoid";

export async function triggerWorkflow<T>(event: string, payload: T) {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn("N8N_WEBHOOK_URL is not set. Skipping workflow trigger.", event);
        return;
    }

    const eventId = nanoid();
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1s

    const body = JSON.stringify({
        id: eventId,
        event,
        timestamp: new Date().toISOString(),
        payload,
    });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Idempotency-Key": eventId,
                },
                body,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return; // Success
        } catch (error) {
            console.warn(`Failed to trigger workflow (attempt ${attempt}/${MAX_RETRIES}):`, error);
            if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            } else {
                console.error("Final failure to trigger workflow:", event, error);
            }
        }
    }
}
