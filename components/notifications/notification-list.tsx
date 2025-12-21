"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck, Mail, Bell, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    markNotificationAsReadAction, 
    markAllNotificationsAsReadAction,
    deleteNotificationAction,
    deleteAllNotificationsAction
} from "@/lib/server/notification-actions";
import { toast } from "sonner";
import { Notification, NOTIFICATIONS_UPDATED_EVENT } from "./notification-bell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NotificationListProps {
    initialNotifications: Notification[];
    organizationId?: string;
}

interface NotificationMetadata {
    jobTitle?: string;
    organizationName?: string;
    [key: string]: unknown;
}

export function NotificationList({ initialNotifications, organizationId }: NotificationListProps) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.readAt).length;

    const handleMarkAsRead = async (id: string) => {
        const res = await markNotificationAsReadAction(id);
        if (res.success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
            window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
        } else {
            toast.error("Failed to mark as read");
        }
    };

    const handleMarkAllAsRead = async () => {
        const res = await markAllNotificationsAsReadAction(organizationId);
        if (res.success) {
            setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
            window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
            toast.success("All marked as read");
        } else {
            toast.error("Failed to mark all as read");
        }
    };

    const handleDelete = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        const res = await deleteNotificationAction(id);
        if (res.success) {
            window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
            toast.success("Notification deleted");
        } else {
            // Revert on failure (simplified, ideally would fetch fresh data)
            toast.error("Failed to delete notification");
            // Optionally refresh from server here if needed
        }
    };

    const handleDeleteAll = async () => {
        setIsDeleteDialogOpen(false);
        // Optimistic update
        setNotifications([]);
        
        const res = await deleteAllNotificationsAction(organizationId);
        if (res.success) {
            window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
            toast.success("All notifications deleted");
        } else {
            toast.error("Failed to delete all notifications");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "interest": return <Star className="h-5 w-5 text-yellow-500" />;
            case "email": return <Mail className="h-5 w-5 text-blue-500" />;
            default: return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    You have {unreadCount} unread notifications
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                            <CheckCheck className="h-4 w-4" /> Mark all as read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogTrigger render={
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" /> Delete all
                                </Button>
                            } />
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete all your notifications.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">
                                        Delete All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            <div className="grid gap-4">
                {notifications.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            No notifications found
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((notification) => {
                        const metadata = notification.metadata as unknown as NotificationMetadata | null;
                        return (
                        <Card key={notification.id} className={`${!notification.readAt ? 'border-l-4 border-l-blue-500 bg-blue-50/10' : ''}`}>
                            <CardContent className="p-4 flex gap-4">
                                <div className="mt-1">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-sm font-semibold ${!notification.readAt ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {notification.subject}
                                        </h4>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {notification.content}
                                    </p>
                                    {metadata?.jobTitle ? (
                                        <div className="pt-2 flex gap-2">
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {String(metadata.organizationName || "")}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {String(metadata.jobTitle || "")}
                                            </Badge>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex flex-col gap-2 justify-center">
                                    {!notification.readAt && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            title="Mark as read"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                        >
                                            <Check className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        </Button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger render={
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                title="Delete"
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        } />
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete notification?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(notification.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
