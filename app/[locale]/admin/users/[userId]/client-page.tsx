"use client";

import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, EnvelopeIcon, CalendarIcon, UserIcon, ShieldIcon, LinkBreakIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { format } from "date-fns";
import { InferSelectModel } from "drizzle-orm";
import { user, account } from "@/lib/db/schema";
import { useState, useEffect } from "react";
import { listUserAccountsAction, adminUnlinkUserAccountAction } from "@/lib/server/admin-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type User = InferSelectModel<typeof user>;

interface LinkedAccount {
    id: string;
    providerId: string;
    accountId: string;
    userId: string;
}

interface AdminUserDetailClientPageProps {
    user: User;
}

export default function AdminUserDetailClientPage({ user }: AdminUserDetailClientPageProps) {
    const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
    const [accountToUnlink, setAccountToUnlink] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const { data } = await listUserAccountsAction(user.id);
                setAccounts(data as LinkedAccount[] || []);
            } catch (error) {
                toast.error("Failed to load linked accounts");
            } finally {
                setIsLoadingAccounts(false);
            }
        };
        fetchAccounts();
    }, [user.id]);

    const confirmUnlink = async () => {
        if (!accountToUnlink) return;
        
        try {
            await adminUnlinkUserAccountAction(user.id, accountToUnlink);
            toast.success("Account unlinked");
            // Refresh accounts
            const { data } = await listUserAccountsAction(user.id);
            setAccounts(data as LinkedAccount[] || []);
        } catch {
            toast.error("Failed to unlink account");
        } finally {
            setAccountToUnlink(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link 
                    href="/admin/users" 
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                    <p className="text-muted-foreground">User Details</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Basic details about the user.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center gap-4 sm:flex-row">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user.image || ""} />
                                <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1 text-center sm:text-left">
                                <h3 className="text-xl font-medium">{user.name}</h3>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="flex justify-center gap-2 sm:justify-start">
                                    <Badge variant={user.banned ? "destructive" : "outline"}>
                                        {user.banned ? "Banned" : "Active"}
                                    </Badge>
                                    <Badge variant="secondary" className="capitalize">
                                        {user.role || "user"}
                                    </Badge>
                                    {user.isPremium && (
                                        <Badge className="bg-gradient-to-r from-orange-400 to-orange-600">
                                            Premium
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <ShieldIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">ID:</span>
                                <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono">{user.id}</code>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Joined:</span>
                                <span className="font-medium">
                                    {user.createdAt ? format(new Date(user.createdAt), "PPP") : "N/A"}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Linked Accounts</CardTitle>
                        <CardDescription>External providers connected to this account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAccounts ? (
                            <div className="flex justify-center py-4">
                                <span className="loading loading-spinner loading-sm"></span>
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <LinkBreakIcon className="h-8 w-8 mb-2 opacity-50" />
                                <p>No linked accounts found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {accounts.map((account) => (
                                    <div key={account.id} className="flex items-center justify-between rounded-md border p-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium capitalize">{account.providerId}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{account.accountId}</span>
                                        </div>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            onClick={() => setAccountToUnlink(account.providerId)}
                                        >
                                            Unlink
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

             <AlertDialog open={!!accountToUnlink} onOpenChange={(open) => !open && setAccountToUnlink(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unlink Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unlink this account? The user may lose access if this is their only login method.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmUnlink}>
                            Unlink Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
