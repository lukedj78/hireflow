"use client"

import { JobPosting } from "@/lib/db/schema"
import { useTranslations } from "next-intl"
import { Button, buttonVariants } from "@/components/ui/button"
import { PlusIcon, DotsThreeIcon, TrashIcon, PencilIcon,  } from "@phosphor-icons/react";
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

interface JobsClientPageProps {
  initialJobs: JobPosting[]
  organizationId: string
}

export default function JobsClientPage({ initialJobs, organizationId }: JobsClientPageProps) {
  const t = useTranslations("Jobs")
  const router = useRouter()

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
                  <DotsThreeIcon className="h-4 w-4" />
                </Button>
            }/>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                  <Link href={`/dashboard/${organizationId}/jobs/${job.id}`} className="flex w-full items-center">
                      <PencilIcon className="mr-2 h-4 w-4" />
                      {t("edit")}
                  </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(job.id)}>
                <TrashIcon className="mr-2 h-4 w-4" />
                {t("delete")}
              </DropdownMenuItem>
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
          <Link href={`/dashboard/${organizationId}/jobs/new`} className={buttonVariants()}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t("create")}
          </Link>
        }
      />

      <DataTable columns={columns} data={initialJobs} />
    </div>
  )
}
