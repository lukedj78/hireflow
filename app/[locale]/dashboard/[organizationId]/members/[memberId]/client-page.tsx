"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { removeMemberAction, updateMemberRoleAction } from "@/lib/server/organization-actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeftIcon, EnvelopeIcon, CalendarBlankIcon, ShieldIcon, TrashIcon, BriefcaseIcon, ClockIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface MemberClientPageProps {
  member: {
    id: string
    userId: string
    role: string
    createdAt: Date
    user: {
      id: string
      name: string
      email: string
      image?: string | null
    }
  }
  organizationId: string
}

export default function MemberClientPage({ member, organizationId }: MemberClientPageProps) {
  const router = useRouter()
  const [role, setRole] = useState(member.role)
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())

  const handleUpdateRole = async (newRole: string | null) => {
    if (!newRole) return
    try {
      setIsLoading(true)
      await updateMemberRoleAction({
        organizationId,
        memberId: member.id,
        role: newRole as "admin" | "member" | "owner"
      })
      setRole(newRole)
      toast.success("Role updated successfully")
      router.refresh()
    } catch {
      toast.error("Failed to update role")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async () => {
    try {
      setIsLoading(true)
      await removeMemberAction({
        organizationId,
        memberIdOrEmail: member.id
      })
      toast.success("Member removed successfully")
      router.push(`/dashboard/${organizationId}/members`)
    } catch (error) {
      toast.error("Failed to remove member")
      setIsLoading(false)
    }
  }

  // Mock data for UI demonstration
  const assignedJobs = [
    { id: 1, title: "Senior Frontend Developer", status: "Active", applicants: 12 },
    { id: 2, title: "Product Designer", status: "Draft", applicants: 0 },
  ]

  const scheduledInterviews = [
    { id: 1, candidate: "Alice Smith", role: "Senior Frontend Developer", time: "10:00 AM", type: "Video Call" },
    { id: 2, candidate: "Bob Jones", role: "Product Designer", time: "2:30 PM", type: "On-site" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/${organizationId}/members`}>
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{member.user.name}</h2>
          <p className="text-muted-foreground">Manage member details, jobs, and schedule</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Assigned Jobs</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Personal details of the member</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={member.user.image || ""} />
                    <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{member.user.name}</h3>
                    <p className="text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{member.user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarBlankIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldIcon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="capitalize">{role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permissions & Actions</CardTitle>
                <CardDescription>Manage role and access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={role} onValueChange={handleUpdateRole} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Admins can manage members and job postings. Members can only view.
                  </p>
                </div>
                
                <Separator />
                
                <div className="pt-4">
                  <h4 className="text-sm font-medium text-destructive mb-2">Danger Zone</h4>
                  <AlertDialog>
                    <AlertDialogTrigger className={buttonVariants({ variant: "destructive", className: "w-full sm:w-auto" })}>
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Remove Member
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently remove {member.user.name} from the organization.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Jobs</CardTitle>
              <CardDescription>Jobs managed by this member</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedJobs.length > 0 ? (
                <div className="space-y-4">
                  {assignedJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <BriefcaseIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{job.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant={job.status === "Active" ? "default" : "secondary"}>{job.status}</Badge>
                            <span>• {job.applicants} applicants</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No jobs assigned to this member.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="mt-4">
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <Card className="h-fit">
              <CardContent className="p-0">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule for {date?.toLocaleDateString()}</CardTitle>
                <CardDescription>Upcoming interviews and meetings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduledInterviews.map((interview) => (
                    <div key={interview.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="mt-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                          <ClockIcon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{interview.time}</h4>
                          <Badge variant="outline">{interview.type}</Badge>
                        </div>
                        <p className="font-medium">{interview.candidate}</p>
                        <p className="text-sm text-muted-foreground">
                          Interview for <span className="text-foreground">{interview.role}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Empty state placeholder if needed */}
                  {/* <div className="text-center py-8 text-muted-foreground">No interviews scheduled for this date.</div> */}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
