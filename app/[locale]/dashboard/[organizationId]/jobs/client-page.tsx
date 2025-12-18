"use client"

import { JobPosting } from "@/lib/db/schema"
import { useTranslations } from "next-intl"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { useRouter, useParams } from "next/navigation"

interface JobsClientPageProps {
  initialJobs: JobPosting[]
}

export default function JobsClientPage({ initialJobs }: JobsClientPageProps) {
  const t = useTranslations("Jobs")
  const router = useRouter()
  const params = useParams()
  const organizationId = params?.organizationId as string

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Link href={`/dashboard/${organizationId}/jobs/new`} className={buttonVariants()}>
            <PlusIcon className="h-4 w-4" />
            {t("create")}
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("form.title")}</TableHead>
              <TableHead>{t("form.location")}</TableHead>
              <TableHead>{t("form.type")}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {t("list.empty")}
                </TableCell>
              </TableRow>
            ) : (
              initialJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/${organizationId}/jobs/${job.id}`}>{job.title}</Link>                  </TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell className="capitalize">{job.type ? t(`form.${job.type}`) : job.type}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}>
                          <span className="sr-only">Open menu</span>
                          <DotsThreeIcon className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Link href={`/dashboard/${organizationId}/jobs/${job.id}`} className="flex w-full items-center">
                                <PencilIcon className="h-4 w-4" />
                                {t("edit")}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(job.id)}>
                          <TrashIcon className="h-4 w-4" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
