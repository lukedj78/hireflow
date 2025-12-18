import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageLayout } from "@/components/page-layout"

export default function CandidateApplicationsPage() {
  const applications = [
    {
      id: "APP-001",
      role: "Senior Frontend Developer",
      company: "TechCorp Inc.",
      status: "Interview",
      date: "2023-10-25",
      location: "Remote",
    },
    {
      id: "APP-002",
      role: "Product Designer",
      company: "Creative Solutions",
      status: "Applied",
      date: "2023-10-28",
      location: "New York, NY",
    },
    {
      id: "APP-003",
      role: "Full Stack Engineer",
      company: "StartupXYZ",
      status: "Rejected",
      date: "2023-10-15",
      location: "San Francisco, CA",
    },
    {
      id: "APP-004",
      role: "UX Researcher",
      company: "DesignCo",
      status: "Offer",
      date: "2023-10-30",
      location: "Remote",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Applied":
        return <Badge variant="outline">Applied</Badge>
      case "Interview":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Interview</Badge>
      case "Offer":
        return <Badge className="bg-green-500 hover:bg-green-600">Offer</Badge>
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">
            Track the status of your job applications.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            You have applied to {applications.length} jobs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    <div>{app.role}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{app.location}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span>{app.company}</span>
                        <span className="text-xs text-muted-foreground hidden md:inline">{app.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>{app.date}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center p-0 hover:bg-muted rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Withdraw Application</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
