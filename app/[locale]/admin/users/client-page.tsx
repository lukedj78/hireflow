"use client"

import { useState } from "react"
import { banUserAction, unbanUserAction, removeUserAction, impersonateUserAction, listUserAccountsAction, adminUnlinkUserAccountAction } from "@/lib/server/admin-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ProhibitIcon, KeyIcon, UserCheckIcon, TrashIcon, LinkBreakIcon, DotsThreeIcon, EyeIcon } from "@phosphor-icons/react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    
    // Confirmation states
    const [userToDelete, setUserToDelete] = useState<string | null>(null)
    const [userToBan, setUserToBan] = useState<string | null>(null)
    const [accountToUnlink, setAccountToUnlink] = useState<string | null>(null)

    const router = useRouter()

    const confirmBan = async () => {
        if (!userToBan) return
        try {
            await banUserAction(userToBan, "Admin action")
            toast.success("User banned")
            router.refresh()
        } catch {
            toast.error("Failed to ban user")
        } finally {
            setUserToBan(null)
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

    const confirmRemove = async () => {
        if (!userToDelete) return
        try {
            await removeUserAction(userToDelete)
            toast.success("User removed")
            router.refresh()
        } catch {
            toast.error("Failed to remove user")
        } finally {
            setUserToDelete(null)
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

    const confirmUnlink = async () => {
        if (!selectedUser || !accountToUnlink) return
        try {
            await adminUnlinkUserAccountAction(selectedUser.id, accountToUnlink)
            toast.success("Account unlinked")
            // Refresh accounts
            const { data } = await listUserAccountsAction(selectedUser.id)
            setUserAccounts(data as LinkedAccount[] || [])
        } catch  {
            toast.error("Failed to unlink account")
        } finally {
            setAccountToUnlink(null)
        }
    }

    const columns: ColumnDef<AdminUser>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => {
                const user = row.original
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: "email",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Email" />
            ),
        },
        {
            accessorKey: "role",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Role" />
            ),
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const user = row.original
                return user.banned ? (
                    <Badge variant="destructive">Banned</Badge>
                ) : (
                    <Badge variant="outline">Active</Badge>
                )
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <DotsThreeIcon className="h-4 w-4" />
                            </Button>
                        }/>
                        <DropdownMenuContent align="end" className="w-full">
                            <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                <EyeIcon className="h-4 w-4" />
                                View details
                            </DropdownMenuItem>
                            {user.banned ? (
                                <DropdownMenuItem onClick={() => handleUnban(user.id)}>
                                    <UserCheckIcon className="h-4 w-4" />
                                    Unban
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => setUserToBan(user.id)} className="text-orange-500">
                                    <ProhibitIcon className="h-4 w-4" />
                                    Ban
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleImpersonate(user.id)}>
                                <KeyIcon className="h-4 w-4" />
                                Impersonate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAccounts(user)}>
                                <LinkBreakIcon className="h-4 w-4" />
                                View Accounts
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setUserToDelete(user.id)}>
                                <TrashIcon className="h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Users Management</h2>
                <p className="text-muted-foreground">Manage users, bans, and account linking.</p>
            </div>

            <DataTable columns={columns} data={users} />

            <Dialog open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Linked Accounts</DialogTitle>
                        <DialogDescription>
                            Manage linked accounts for {selectedUser?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {userAccounts.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground">No linked accounts found.</p>
                        ) : (
                            <div className="space-y-4">
                                {userAccounts.map((account) => (
                                    <div key={account.id} className="flex items-center justify-between rounded-md border p-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium capitalize">{account.providerId}</span>
                                            <span className="text-xs text-muted-foreground">{account.accountId}</span>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => setAccountToUnlink(account.providerId)}>
                                            Unlink
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={confirmRemove}>
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!userToBan} onOpenChange={(open) => !open && setUserToBan(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ban User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to ban this user? They will no longer be able to access the platform.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={confirmBan}>
                            Ban User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={confirmUnlink}>
                            Unlink Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
