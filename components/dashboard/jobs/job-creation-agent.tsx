"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { submitJobCreationMessage } from "@/lib/server/ai-job-agent";
import { JobDraft } from "@/lib/job-schemas";
import { AiChatProvider } from "./ai-chat-context";
import { OptionSelector } from "./option-selector";
import { User, Bot, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  role: "user" | "assistant";
  display: React.ReactNode;
  content: string;
}

export default function JobCreationAgent({ organizationId }: { organizationId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState<JobDraft>({});
  const [inputValue, setInputValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      handleSendMessage("Start job creation", true);
    }
  }, []);

  async function handleSendMessage(text: string, hidden: boolean = false) {
    if (!text.trim()) return;
    
    setIsPending(true);
    
    // Add user message to UI
    if (!hidden) {
      setMessages(curr => [...curr, {
        id: Date.now(),
        role: "user",
        display: <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">{text}</div>,
        content: text
      }]);
    }
    
    setInputValue("");

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const { message: aiText, draft: updatedDraft, isFinalized } = await submitJobCreationMessage(
        text, 
        history, 
        draft,
        organizationId
      );

      setDraft(updatedDraft);

      if (isFinalized) {
          setMessages(curr => [...curr, {
            id: Date.now() + 1,
            role: "assistant",
            display: (
                <div className="flex flex-col gap-2">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-800 dark:text-green-200">
                        Ottimo! L&apos;annuncio è stato salvato come bozza.
                    </div>
                </div>
            ),
            content: "Job finalized."
          }]);
          
          // Optional: redirect
          // router.push(...) 
          return;
      }

      // Parse options
      let cleanText = aiText;
      let options: string[] = [];
      const optionsMatch = aiText.match(/\|\|OPTIONS: (.*?)\|\|/);
      
      if (optionsMatch) {
          cleanText = aiText.replace(optionsMatch[0], "").trim();
          options = optionsMatch[1].split(",").map(s => s.trim());
      }

      setMessages(curr => [...curr, {
        id: Date.now() + 1,
        role: "assistant",
        display: (
            <div className="flex flex-col gap-2">
                <div className="bg-muted px-4 py-2 rounded-lg whitespace-pre-wrap">{cleanText}</div>
                {options.length > 0 && (
                    <OptionSelector question="" options={options} />
                )}
            </div>
        ),
        content: aiText
      }]);

    } catch (error) {
      console.error(error);
      setMessages(curr => [...curr, {
        id: Date.now() + 2,
        role: "assistant",
        display: <div className="text-destructive bg-destructive/10 px-4 py-2 rounded-lg">Si è verificato un errore. Riprova.</div>,
        content: ""
      }]);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AiChatProvider value={{ sendMessage: (text) => handleSendMessage(text) }}>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Chat Area */}
          <Card className="md:col-span-2 flex flex-col h-full border shadow-sm overflow-hidden">
             <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                   <Sparkles className="w-5 h-5 text-indigo-500" />
                   AI Recruiter Assistant
                </CardTitle>
             </CardHeader>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-indigo-100 text-indigo-600"
                    )}>
                      {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground px-1">
                        {msg.role === "user" ? "You" : "AI Recruiter"}
                      </span>
                      {msg.display}
                    </div>
                  </div>
                ))}
                {isPending && (
                  <div className="flex gap-3 max-w-[80%] mr-auto">
                     <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Bot size={14} />
                     </div>
                     <div className="flex items-center h-full pt-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        </div>
                     </div>
                  </div>
                )}
             </div>

             <div className="p-4 bg-background border-t">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }}
                  className="flex gap-2"
                >
                  <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Scrivi la tua risposta..."
                    disabled={isPending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isPending || !inputValue.trim()}>
                    <Send size={16} />
                  </Button>
                </form>
             </div>
          </Card>

          {/* Draft Preview */}
          <Card className="hidden md:flex flex-col h-full bg-muted/10 border shadow-sm">
             <CardHeader>
                <CardTitle className="text-base">Anteprima Job Post</CardTitle>
             </CardHeader>
             <CardContent className="flex-1 overflow-y-auto space-y-6">
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Titolo</p>
                  {draft.title ? (
                    <p className="font-semibold text-lg">{draft.title}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">In attesa...</p>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</p>
                      {draft.type ? (
                        <Badge variant="secondary">{draft.type}</Badge>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">...</p>
                      )}
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Luogo</p>
                      <p className="text-sm">{draft.location || <span className="text-muted-foreground italic">...</span>}</p>
                   </div>
                </div>

                <div className="space-y-1">
                   <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Salario</p>
                   <p className="text-sm">{draft.salaryRange || <span className="text-muted-foreground italic">...</span>}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrizione</p>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-3 bg-background text-sm">
                    {draft.description ? (
                      <div className="whitespace-pre-wrap">{draft.description}</div>
                    ) : (
                      <span className="text-muted-foreground italic">In attesa di descrizione...</span>
                    )}
                  </ScrollArea>
                </div>

             </CardContent>
          </Card>
       </div>
    </AiChatProvider>
  );
}
