"use client";

import { Button } from "@/components/ui/button";
import { useAiChat } from "./ai-chat-context";

interface OptionSelectorProps {
  question: string;
  options: string[];
}

export function OptionSelector({ question, options }: OptionSelectorProps) {
  const { sendMessage } = useAiChat();

  return (
    <div className="flex flex-col gap-3 my-4 p-4 border rounded-lg bg-background shadow-sm">
      <p className="font-medium text-sm">{question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button 
            key={option} 
            variant="outline" 
            size="sm"
            onClick={() => sendMessage(option)}
            className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
