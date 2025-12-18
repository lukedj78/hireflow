"use client";

import { Button } from "@/components/ui/button";
import { triggerJobParsingAction } from "@/lib/server/ai-actions";
import { Sparkle } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

interface GenerateEmbeddingButtonProps {
    jobId: string;
}

export function GenerateEmbeddingButton({ jobId }: GenerateEmbeddingButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const result = await triggerJobParsingAction(jobId);
            if (result.success) {
                toast.success("AI analysis started. This page will update shortly.");
                // We could refresh here, but the server action already revalidates
            } else {
                toast.error(result.error || "Failed to start AI analysis");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button 
            onClick={handleGenerate} 
            disabled={isLoading}
            variant="outline"
            className="w-fit"
        >
            {isLoading ? (
                <Sparkle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkle className="mr-2 h-4 w-4" />
            )}
            Generate AI Embeddings
        </Button>
    );
}