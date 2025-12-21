"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { toast } from "sonner"
import { CircleNotchIcon, TrashIcon, DotsThreeIcon } from "@phosphor-icons/react"

import { createTeamAction, deleteTeamAction } from "@/lib/server/organization-actions"

import { useRouter } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Team {
    id: string
    name: string
    createdAt: Date
    updatedAt?: Date | null
}

export default function TeamsClientPage({ initialTeams: teams, activeOrgId }: { initialTeams: Team[], activeOrgId: string }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleCreateTeam = async () => {
      if (!activeOrgId) return
      setIsCreating(true)
      try {
          await createTeamAction({
              name: teamName,
              organizationId: activeOrgId
          })
          toast.success("Team created")
          setIsCreateOpen(false)
          setTeamName("")
          router.refresh()
      } catch {
          toast.error("Failed to create team")
      } finally {
          setIsCreating(false)
      }
  }

  const handleDeleteTeam = async (teamId: string) => {
      if (!activeOrgId) return
      try {
          await deleteTeamAction({
              organizationId: activeOrgId,
              teamId
          })
          toast.success("Team deleted")
          router.refresh()
      } catch {
          toast.error("Failed to delete team")
      }
  }

  const columns: ColumnDef<Team>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString()
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const team = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsThreeIcon className="h-4 w-4" />
              </Button>
            }/>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDeleteTeam(team.id)} className="text-destructive">
                <TrashIcon className="h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
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
          <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
          <p className="text-muted-foreground">
            Manage your organization teams.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
                <Button className={buttonVariants()}>
                    Create Team
                </Button>
            }/>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Team</DialogTitle>
                    <DialogDescription>
                        Create a new team within your organization.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Team Name</Label>
                        <Input
                            id="name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateTeam} disabled={isCreating}>
                        {isCreating && <CircleNotchIcon className="h-4 w-4 animate-spin" />}
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      <DataTable columns={columns} data={teams} />
    </div>
  )
}
