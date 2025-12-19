"use client"

import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DotsThreeIcon, EyeIcon, TrashIcon } from "@phosphor-icons/react"

type Application = {
  id: string
  role: string
  company: string
  status: string
  date: string
  location: string
}

const applications: Application[] = [
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

export default function CandidateApplicationsClientPage() {
    const columns: ColumnDef<Application>[] = [
        {
            accessorKey: "role",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Role" />
            ),
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.role}</div>
                    <div className="text-sm text-muted-foreground">{row.original.location}</div>
                </div>
            )
        },
        {
            accessorKey: "company",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Company" />
            ),
        },
        {
            accessorKey: "date",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Date Applied" />
            ),
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const status = row.original.status
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
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <DotsThreeIcon className="h-4 w-4" />
                            </Button>
                        }/>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Withdraw
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
                    <p className="text-muted-foreground">
                        Track the status of your job applications.
                    </p>
                </div>
            </div>
            <DataTable columns={columns} data={applications} />
        </div>
    )
}
