export async function triggerWorkflow<T>(event: string, payload: T) {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn("N8N_WEBHOOK_URL is not set. Skipping workflow trigger.", event);
        return;
    }

    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                event,
                timestamp: new Date().toISOString(),
                payload,
            }),
        });
    } catch (error) {
        console.error("Failed to trigger workflow:", error);
    }
}
