"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail } from "lucide-react";
import { updateUserSettingsAction } from "@/lib/server/settings-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Settings {
    emailNotifications: boolean;
    inAppNotifications: boolean;
}

interface AdminSettingsClientPageProps {
    initialSettings: Settings;
}

export default function AdminSettingsClientPage({ initialSettings }: AdminSettingsClientPageProps) {
    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const result = await updateUserSettingsAction(settings);
            if (result.success) {
                toast.success("Settings saved successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to save settings");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                        Manage how you receive alerts and updates.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex items-start space-x-4">
                            <div className="mt-1 p-2 bg-muted rounded-full">
                                <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email-notifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Email Notifications
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive critical updates and system alerts via email.
                                </p>
                            </div>
                        </div>
                        <Switch 
                            id="email-notifications" 
                            checked={settings.emailNotifications}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex items-start space-x-4">
                            <div className="mt-1 p-2 bg-muted rounded-full">
                                <Bell className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="in-app-notifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    In-App Notifications
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive notifications within the dashboard.
                                </p>
                            </div>
                        </div>
                        <Switch 
                            id="in-app-notifications" 
                            checked={settings.inAppNotifications}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, inAppNotifications: checked }))}
                        />
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Preferences"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
