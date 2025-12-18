"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CircleNotchIcon, DotsThreeIcon, TrashIcon } from "@phosphor-icons/react"
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

export default function MembersClientPage({ initialMembers: members, activeOrgId }: { initialMembers: Member[], activeOrgId: string }) {

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [isInviting, setIsInviting] = useState(false)
  const router = useRouter()
  
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



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">
            Manage your organization members and their roles.
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger className={buttonVariants()}>
            Invite Member
          </DialogTrigger>
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
                {isInviting && <CircleNotchIcon className="mr-2 h-4 w-4 animate-spin" />}
                Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback>{member.user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{member.user.name}</span>
                      <span className="text-xs text-muted-foreground">{member.user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(member.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}>
                      <DotsThreeIcon className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "admin")}>
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "member")}>
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveMember(member.id)}>
                        <TrashIcon className="h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
