"use client"

import { useState } from "react"
import { banUserAction, unbanUserAction, removeUserAction, impersonateUserAction, listUserAccountsAction, adminUnlinkUserAccountAction } from "@/lib/server/admin-actions"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ProhibitIcon, KeyIcon, UserCheckIcon, TrashIcon, LinkBreakIcon } from "@phosphor-icons/react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { useRouter } from "next/navigation"

export interface AdminUser {
    id: string
    name: string
    email: string
    role?: string
    banned?: boolean
    image?: string | null
    createdAt: Date
    updatedAt: Date
}

interface LinkedAccount {
    id: string
    providerId: string
    accountId: string
    userId: string
}

export default function AdminUsersClientPage({ initialUsers: users }: { initialUsers: AdminUser[] }) {
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [userAccounts, setUserAccounts] = useState<LinkedAccount[]>([])
    const [isAccountsOpen, setIsAccountsOpen] = useState(false)
    const router = useRouter()

    const handleBan = async (userId: string) => {
        try {
            await banUserAction(userId, "Admin action")
            toast.success("User banned")
            router.refresh()
        } catch {
            toast.error("Failed to ban user")
        }
    }

    const handleUnban = async (userId: string) => {
        try {
            await unbanUserAction(userId)
            toast.success("User unbanned")
            router.refresh()
        } catch {
            toast.error("Failed to unban user")
        }
    }

    const handleRemove = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return
        try {
            await removeUserAction(userId)
            toast.success("User removed")
            router.refresh()
        } catch {
            toast.error("Failed to remove user")
        }
    }

    const handleImpersonate = async (userId: string) => {
        try {
            await impersonateUserAction(userId)
            toast.success("Impersonating user...")
            router.push("/dashboard")
            router.refresh()
        } catch{
            toast.error("Failed to impersonate user")
        }
    }

    const handleViewAccounts = async (user: AdminUser) => {
        setSelectedUser(user)
        try {
            const { data } = await listUserAccountsAction(user.id)
            setUserAccounts(data as LinkedAccount[] || [])
            setIsAccountsOpen(true)
        } catch  {
            toast.error("Failed to load accounts")
        }
    }

    const handleUnlinkAccount = async (providerId: string) => {
        if (!selectedUser) return
        try {
            await adminUnlinkUserAccountAction(selectedUser.id, providerId)
            toast.success("Account unlinked")
            // Refresh accounts
            const { data } = await listUserAccountsAction(selectedUser.id)
            setUserAccounts(data as LinkedAccount[] || [])
        } catch  {
            toast.error("Failed to unlink account")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Users Management</h2>
                <p className="text-muted-foreground">Manage users, bans, and account linking.</p>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    {user.banned ? (
                                        <Badge variant="destructive">Banned</Badge>
                                    ) : (
                                        <Badge variant="outline">Active</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="flex gap-2">
                                    {user.banned ? (
                                        <Button variant="ghost" size="icon" onClick={() => handleUnban(user.id)} title="Unban">
                                            <UserCheckIcon className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="icon" onClick={() => handleBan(user.id)} title="Ban">
                                            <ProhibitIcon className="h-4 w-4 text-orange-500" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => handleImpersonate(user.id)} title="Impersonate">
                                        <KeyIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleViewAccounts(user)} title="Unlink Accounts">
                                        <LinkBreakIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(user.id)} title="Delete">
                                        <TrashIcon className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Linked Accounts for {selectedUser?.name}</DialogTitle>
                        <DialogDescription>Manage linked providers for this user.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {userAccounts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No linked accounts found.</p>
                        ) : (
                            <div className="grid gap-4">
                                {userAccounts.map((account) => (
                                    <div key={account.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium capitalize">{account.providerId}</span>
                                            <span className="text-xs text-muted-foreground">{account.accountId}</span>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => handleUnlinkAccount(account.providerId)}>
                                            Unlink
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
