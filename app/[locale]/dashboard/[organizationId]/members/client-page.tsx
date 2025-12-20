"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CircleNotchIcon, DotsThreeIcon, TrashIcon, EyeIcon, ShieldIcon, UserIcon } from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { removeMemberAction, updateMemberRoleAction, inviteMemberAction } from "@/lib/server/organization-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"

export interface Member {
  id: string
  userId: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  createdAt: Date
}

export default function MembersClientPage({ 
  initialMembers: members, 
  activeOrgId,
  currentUserRole 
}: { 
  initialMembers: Member[], 
  activeOrgId: string,
  currentUserRole: string
}) {

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [isInviting, setIsInviting] = useState(false)
  const router = useRouter()

  const canManageMembers = ["owner", "admin"].includes(currentUserRole);

  const handleRemoveMember = async (memberId: string) => {
    if (!activeOrgId) return
    try {
      await removeMemberAction({
        organizationId: activeOrgId,
        memberIdOrEmail: memberId
      })
      toast.success("Member removed")
      router.refresh()
    } catch {
      toast.error("Failed to remove member")
    }
  }

  const handleUpdateRole = async (memberId: string, role: string) => {
    if (!activeOrgId) return
    try {
      await updateMemberRoleAction({
        organizationId: activeOrgId,
        memberId,
        role: role as "admin" | "member" | "owner"
      })
      toast.success("Role updated")
      router.refresh()
    } catch {
      toast.error("Failed to update role")
    }
  }

  const handleInvite = async () => {
    if (!activeOrgId) return
    setIsInviting(true)
    try {
      await inviteMemberAction({
        organizationId: activeOrgId,
        email: inviteEmail,
        role: inviteRole as "admin" | "member" | "owner"
      })
      toast.success("Invitation sent")
      setIsInviteOpen(false)
      setInviteEmail("")
      setInviteRole("member")
      router.refresh()
    } catch {
      toast.error("Failed to invite member")
    } finally {
      setIsInviting(false)
    }
  }

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "user",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={member.user.image || ""} />
              <AvatarFallback>{member.user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <Link href={`/dashboard/${activeOrgId}/members/${member.id}`} className="hover:underline">
                <p className="font-medium">{member.user.name}</p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </Link>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        return (
          <Badge variant="outline" className="capitalize">
            {row.getValue("role")}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString()
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsThreeIcon className="h-4 w-4" />
              </Button>
            }/>
            <DropdownMenuContent align="end" className="w-full">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/${activeOrgId}/members/${member.id}`)}>
                <EyeIcon className="h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {canManageMembers && (
                <>
                  <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "admin")}>
                    <ShieldIcon className="h-4 w-4" />
                    Make Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "member")}>
                    <UserIcon className="h-4 w-4" />
                    Make Member
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveMember(member.id)}>
                    <TrashIcon className="h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">
            Manage your organization members and their roles.
          </p>
        </div>
        {canManageMembers && (
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger render={
             <Button className={buttonVariants()}>
               Invite Member
             </Button>
          }/>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
              <DialogDescription>
                Invite a new member to your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="m@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(val) => val && setInviteRole(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={isInviting}>
                {isInviting && <CircleNotchIcon className="h-4 w-4 animate-spin" />}
                Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>
      <DataTable columns={columns} data={members} />
    </div>
  )
}
