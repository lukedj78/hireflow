"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Mail, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotificationsAction, markNotificationAsReadAction, markAllNotificationsAsReadAction } from "@/lib/server/notification-actions";
import { formatDistanceToNow } from "date-fns";
import { useParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export type Notification = {
    id: string;
    type: "email" | "notification" | "interest";
    subject: string | null;
    content: string | null;
    createdAt: Date | string;
    readAt: Date | string | null;
    metadata: Record<string, unknown> | null;
    jobPosting?: {
        id: string;
        title: string;
        organization: {
            name: string;
        }
    } | null;
};

export const NOTIFICATIONS_UPDATED_EVENT = "notifications:updated";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const organizationId = params?.organizationId as string | undefined;

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getNotificationsAction(organizationId);
                const typedData = data as unknown as Notification[];
                setNotifications(typedData);
                setUnreadCount(typedData.filter(n => !n.readAt).length);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        
        // Listen for updates from other components
        const handleUpdate = () => fetchNotifications();
        window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
        };
    }, [organizationId]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markNotificationAsReadAction(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllAsRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await markAllNotificationsAsReadAction(organizationId);
        setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.readAt) {
            await markNotificationAsReadAction(notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, readAt: new Date() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        let targetPath = '/dashboard/candidate/notifications';
        
        if (organizationId) {
            targetPath = `/dashboard/${organizationId}/notifications`;
        } else if (pathname?.startsWith('/admin')) {
            targetPath = '/admin/notifications';
        }

        router.push(targetPath);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "interest": return <Star className="h-4 w-4 text-warning flex-shrink-0" />;
            case "email": return <Mail className="h-4 w-4 text-info flex-shrink-0" />;
            default: return <Bell className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
        }
    };

    let viewAllPath = '/dashboard/candidate/notifications';
    if (organizationId) {
        viewAllPath = `/dashboard/${organizationId}/notifications`;
    } else if (pathname?.startsWith('/admin')) {
        viewAllPath = '/admin/notifications';
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="relative min-h-11 min-w-11" aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs" aria-hidden="true">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            } />
            <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))]">
                <div className="flex items-center justify-between px-4 py-2">
                    <span className="font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={handleMarkAllAsRead}>
                            <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {isLoading ? (
                        <div className="space-y-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-start gap-3 p-4">
                                    <Skeleton className="h-4 w-4 mt-1 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No notifications
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem 
                                key={notification.id} 
                                className={`flex flex-col items-start gap-1 p-4 cursor-pointer ${!notification.readAt ? 'bg-muted/50' : ''}`}
                                onSelect={() => handleNotificationClick(notification)}
                            >
                                <div className="flex w-full items-start gap-3">
                                    <div className="mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex w-full justify-between items-start">
                                            <span className="font-medium text-sm line-clamp-1">{notification.subject}</span>
                                            {!notification.readAt && (
                                                <div className="h-2 w-2 rounded-full bg-info mt-1.5 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.content}
                                        </p>
                                        <div className="flex w-full justify-between items-center mt-2">
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                    {!notification.readAt && (
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            className="min-h-7 min-w-7 flex-shrink-0 -mr-1 -mt-1"
                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            aria-label="Mark as read"
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer justify-center text-center py-2" onSelect={() => router.push(viewAllPath)}>
                    <Link href={viewAllPath} className="text-sm font-medium text-primary">View all notifications</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
