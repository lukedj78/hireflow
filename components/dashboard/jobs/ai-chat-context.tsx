"use client";

import { createContext, useContext } from "react";

interface AiChatContextType {
  sendMessage: (text: string) => void;
}

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

export function useAiChat() {
  const context = useContext(AiChatContext);
  if (!context) {
    throw new Error("useAiChat must be used within an AiChatProvider");
  }
  return context;
}

export const AiChatProvider = AiChatContext.Provider;
