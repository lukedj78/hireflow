"use client"

import { authClient } from "@/lib/auth-client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Loader2 } from "lucide-react"

import { createTeamAction, deleteTeamAction } from "@/lib/server/organization-actions"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

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
            <DialogTrigger className={buttonVariants()}>
                Create Team
            </DialogTrigger>
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
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams?.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell>
                    {new Date(team.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                   <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.id)}>
                       <Trash2 className="h-4 w-4 text-destructive" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
            {teams.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center">No teams found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
