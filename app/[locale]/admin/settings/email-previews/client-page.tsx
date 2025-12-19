"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { renderEmailPreviewAction, getEmailTemplatesListAction, type EmailTemplateKey } from "@/lib/server/email-preview-actions";
import { CircleNotchIcon, ArrowsClockwiseIcon, EnvelopeSimpleIcon, CheckCircleIcon, WarningIcon, UserIcon, CalendarIcon, DesktopIcon, DeviceMobileIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EmailPreviewsClientPage() {
    const [templates, setTemplates] = useState<EmailTemplateKey[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateKey | "">("");
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

    useEffect(() => {
        const loadTemplates = async () => {
            setIsLoading(true);
            try {
                const list = await getEmailTemplatesListAction();
                setTemplates(list);
                if (list.length > 0) {
                    setSelectedTemplate(list[0]);
                }
            } catch {
                toast.error("Failed to load email templates");
            } finally {
                setIsLoading(false);
            }
        };
        loadTemplates();
    }, []);

    useEffect(() => {
        if (selectedTemplate) {
            handleRender(selectedTemplate as EmailTemplateKey);
        }
    }, [selectedTemplate]);

    const handleRender = async (template: EmailTemplateKey) => {
        setIsRendering(true);
        try {
            const result = await renderEmailPreviewAction(template);
            if (result.success && result.html) {
                setHtmlContent(result.html);
            } else {
                toast.error(result.error || "Failed to render email");
                setHtmlContent("");
            }
        } catch {
            toast.error("An error occurred while rendering");
            setHtmlContent("");
        } finally {
            setIsRendering(false);
        }
    };

    const handleRefresh = () => {
        if (selectedTemplate) {
            handleRender(selectedTemplate as EmailTemplateKey);
        }
    };

    const groupedTemplates = (() => {
        const groups: Record<string, { icon: React.ElementType, items: EmailTemplateKey[] }> = {
            "Applications": { icon: EnvelopeSimpleIcon, items: [] },
            "Interviews": { icon: CalendarIcon, items: [] },
            "Account & Auth": { icon: UserIcon, items: [] },
            "Alerts & Notifications": { icon: WarningIcon, items: [] },
            "Other": { icon: CheckCircleIcon, items: [] }
        };
    
        templates.forEach(t => {
            if (t.startsWith("application-")) {
                groups["Applications"].items.push(t);
            } else if (t.startsWith("interview-")) {
                groups["Interviews"].items.push(t);
            } else if (t.startsWith("account-") || t.startsWith("reset-") || t.startsWith("verification") || t.startsWith("invitation")) {
                groups["Account & Auth"].items.push(t);
            } else if (t.includes("alert") || t.includes("notification")) {
                groups["Alerts & Notifications"].items.push(t);
            } else {
                groups["Other"].items.push(t);
            }
        });
        
        return Object.entries(groups).filter(([_, g]) => g.items.length > 0);
    })();

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <CircleNotchIcon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <Card className="flex-shrink-0">
                <CardHeader className="pb-4">
                    <CardTitle>Email Template Preview</CardTitle>
                    <CardDescription>
                        Select a template to view how it looks with sample data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        
                            <Select 
                                value={selectedTemplate} 
                                onValueChange={(val) => setSelectedTemplate(val as EmailTemplateKey)}
                            >
                                <SelectTrigger className="w-full flex-1">
                                    <SelectValue>{selectedTemplate?.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Select template"}</SelectValue>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {groupedTemplates.map(([label, group], index) => (
                                        <SelectGroup key={label}>
                                            <SelectLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground pl-2">
                                                <group.icon className="h-3.5 w-3.5" />
                                                {label}
                                            </SelectLabel>
                                            {group.items.map((t) => (
                                                <SelectItem key={t} value={t} className="pl-9 cursor-pointer">
                                                    {t.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                                </SelectItem>
                                            ))}
                                            {index < groupedTemplates.length - 1 && <SelectSeparator className="my-1" />}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                        
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 border">
                            <Button 
                                variant={viewMode === "desktop" ? "secondary" : "ghost"} 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setViewMode("desktop")}
                                title="Desktop view"
                            >
                                <DesktopIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={viewMode === "mobile" ? "secondary" : "ghost"} 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setViewMode("mobile")}
                                title="Mobile view"
                            >
                                <DeviceMobileIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={!selectedTemplate || isRendering}>
                            <ArrowsClockwiseIcon className={`h-4 w-4 ${isRendering ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col min-h-[600px] overflow-hidden p-0 gap-0">
                <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</span>
                    <div className="flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-400/50" />
                        <div className="h-3 w-3 rounded-full bg-yellow-400/50" />
                        <div className="h-3 w-3 rounded-full bg-green-400/50" />
                    </div>
                </div>
                <div className="flex-1 w-full bg-muted/20 relative flex justify-center overflow-auto p-4">
                    {isRendering ? (
                         <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <CircleNotchIcon className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : null}
                    
                    {htmlContent ? (
                        <div className={cn(
                            "bg-white shadow-lg transition-all duration-300 ease-in-out border overflow-hidden",
                            viewMode === "mobile" ? "w-[375px] h-[667px] rounded-3xl border-slate-300 border-8" : "w-full h-full rounded-none border-0"
                        )}>
                            <iframe 
                                srcDoc={htmlContent}
                                className="w-full h-full border-0 bg-white"
                                title="Email Preview"
                            />
                        </div>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            Select a template to view preview
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
