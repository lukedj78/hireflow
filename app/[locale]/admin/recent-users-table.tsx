"use client"

import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export interface RecentUser {
  id: string
  name: string
  email: string
  role?: string | null
  banned?: boolean | null
  isPremium?: boolean | null
  image?: string | null
  createdAt: Date | string
}

export function RecentUsersTable({ users }: { users: RecentUser[] }) {
  const columns: ColumnDef<RecentUser>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
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
      cell: ({ row }) => <div className="capitalize">{row.original.role || "user"}</div>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const user = row.original
        if (user.banned) {
          return <Badge variant="destructive">Banned</Badge>
        }
        if (user.isPremium) {
          return <Badge className="bg-gradient-to-r from-orange-400 to-orange-600">Premium</Badge>
        }
        return <Badge variant="secondary">Free</Badge>
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => {
        return <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>
      },
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={users} />
    </div>
  )
}
