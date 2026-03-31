"use client"

import { JobPosting } from "@/lib/db/schema"
import { useTranslations } from "next-intl"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, MoreHorizontal, Trash, Pencil, Sparkles, Search } from "lucide-react";
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteJobAction } from "@/lib/server/jobs-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { useQueryState, parseAsString } from 'nuqs'

interface JobsClientPageProps {
  initialJobs: JobPosting[]
  organizationId: string
  currentUserRole: string
}

export default function JobsClientPage({ initialJobs, organizationId, currentUserRole }: JobsClientPageProps) {
  const t = useTranslations("Jobs")
  const router = useRouter()
  
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault('').withOptions({ throttleMs: 500, shallow: false }))
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault('all').withOptions({ shallow: false }))
  const [type, setType] = useQueryState('type', parseAsString.withDefault('all').withOptions({ shallow: false }))

  const canManageJobs = ["owner", "admin", "hr"].includes(currentUserRole);

  const handleDelete = async (jobId: string) => {
    try {
        const result = await deleteJobAction(jobId)
        if (result.success) {
            toast.success("Job deleted successfully")
            router.refresh()
        } else {
            toast.error(result.error || "Failed to delete job")
        }
    } catch {
        toast.error("An unexpected error occurred")
    }
  }

  const columns: ColumnDef<JobPosting>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("form.title")} />
      ),
      cell: ({ row }) => {
        const job = row.original
        return (
             <Link href={`/dashboard/${organizationId}/jobs/${job.id}`} className="hover:underline">
                {job.title}
             </Link>
        )
      }
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("form.location")} />
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("form.type")} />
      ),
      cell: ({ row }) => {
          const type = row.getValue("type") as string
          return <span className="capitalize">{type ? t(`form.${type}`) : type}</span>
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const job = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
            }/>
            <DropdownMenuContent align="end">
              {canManageJobs && (
                <>
                  <DropdownMenuItem>
                      <Link href={`/dashboard/${organizationId}/jobs/${job.id}`} className="flex w-full items-center">
                          <Pencil className="h-4 w-4" />
                          {t("edit")}
                      </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(job.id)}>
                    <Trash className="h-4 w-4" />
                    {t("delete")}
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
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canManageJobs ? (
          <div className="flex gap-2">
            <Link href={`/dashboard/${organizationId}/jobs/ai-new`} className={buttonVariants({ variant: "secondary" })}>
              <Sparkles className="h-4 w-4" />
              AI Create
            </Link>
            <Link href={`/dashboard/${organizationId}/jobs/new`} className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              {t("create")}
            </Link>
          </div>
          ) : null
        }
      />

      <div className="flex gap-4 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  aria-label={t("searchPlaceholder")}
              />
          </div>
          <Select value={status} onValueChange={(val) => setStatus(val)} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="published">{t("status.published")}</SelectItem>
                  <SelectItem value="draft">{t("status.draft")}</SelectItem>
                  <SelectItem value="closed">{t("status.closed")}</SelectItem>
              </SelectContent>
          </Select>
          <Select value={type} onValueChange={(val) => setType(val)} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("allTypes")} />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">{t("allTypes")}</SelectItem>
                  <SelectItem value="remote">{t("form.remote")}</SelectItem>
                  <SelectItem value="onsite">{t("form.onsite")}</SelectItem>
                  <SelectItem value="hybrid">{t("form.hybrid")}</SelectItem>
              </SelectContent>
          </Select>
      </div>

      <DataTable columns={columns} data={initialJobs} />
    </div>
  )
}
