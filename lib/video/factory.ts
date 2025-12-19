import { IVideoProvider } from "./types";
import { MockVideoProvider } from "./mock-provider";
import { DailyVideoProvider } from "./daily-provider";
import { LiveKitVideoProvider } from "./livekit-provider";
import { HundredMsVideoProvider } from "./hundredms-provider";

export class VideoProviderFactory {
    static getProvider(overrideProviderName?: string): IVideoProvider {
        const providerName = overrideProviderName || process.env.VIDEO_PROVIDER || "mock";

        switch (providerName.toLowerCase()) {
            case "daily":
                return new DailyVideoProvider();
            case "livekit":
                return new LiveKitVideoProvider();
            case "hundredms":
            case "100ms":
                return new HundredMsVideoProvider();
            case "mock":
            default:
                if (providerName !== "mock") {
                    console.warn(`Unknown video provider '${providerName}', falling back to mock provider.`);
                }
                return new MockVideoProvider();
        }
    }
}
