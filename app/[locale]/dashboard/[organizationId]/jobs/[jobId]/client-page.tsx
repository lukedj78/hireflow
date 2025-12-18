"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateJobAction } from "@/lib/server/jobs-actions"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { JobPosting } from "@/lib/db/schema"
import Link from "next/link"
import { UsersIcon, SparkleIcon, CircleNotchIcon } from "@phosphor-icons/react"
import { buttonVariants } from "@/components/ui/button"
import { triggerJobParsingAction } from "@/lib/server/ai-actions"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  location: z.string().min(1, "Location is required"),
  type: z.enum(["remote", "onsite", "hybrid"]),
  salaryRange: z.string().min(1, "Salary range is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["draft", "published", "closed"]),
})

type JobFormValues = z.infer<typeof jobSchema>

interface EditJobClientPageProps {
  job: JobPosting
}

export default function EditJobClientPage({ job }: EditJobClientPageProps) {
  const t = useTranslations("Jobs")
  const router = useRouter()
  const params = useParams()
  const organizationId = params?.organizationId as string
  const [isParsing, setIsParsing] = useState(false)

  async function handleParseJob() {
      setIsParsing(true)
      try {
          await triggerJobParsingAction(job.id)
          toast.success("AI Analysis triggered. Updates will appear shortly.")
          router.refresh()
      } catch {
          toast.error("Failed to trigger analysis")
      } finally {
          setIsParsing(false)
      }
  }

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job.title,
      location: job.location || "",
      type: (job.type as "remote" | "onsite" | "hybrid") || "onsite",
      salaryRange: job.salaryRange || "",
      description: job.description || "",
      status: (job.status as "draft" | "published" | "closed") || "draft",
    },
  })

  async function onSubmit(data: JobFormValues) {
    try {
      const result = await updateJobAction(job.id, data)
      if (result.success) {
          toast.success("Job updated successfully")
          router.push(`/dashboard/${organizationId}/jobs`)
          router.refresh()
      } else {
          toast.error(result.error || "Failed to update job")
      }
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex gap-2">
            <Link 
                href={`/dashboard/${organizationId}/jobs/${job.id}/suggestions`}
                className={buttonVariants({ variant: "secondary" })}
            >
                <SparkleIcon className="h-4 w-4" />
                AI Suggestions
            </Link>
            <Link 
                href={`/dashboard/${organizationId}/jobs/${job.id}/pipeline`}
                className={buttonVariants({ variant: "default" })}
            >
                <UsersIcon className="h-4 w-4" />
                Pipeline View
            </Link>
            <Link 
                href={`/dashboard/${organizationId}/jobs/${job.id}/applications`}
                className={buttonVariants({ variant: "outline" })}
            >
                <UsersIcon className="h-4 w-4" />
                List View
            </Link>
        </div>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">{t("form.title")}</Label>
            <Input 
              id="title" 
              placeholder="Senior Frontend Developer" 
              {...form.register("title")} 
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">{t("form.location")}</Label>
              <Input 
                id="location" 
                placeholder="San Francisco, CA" 
                {...form.register("location")} 
              />
              {form.formState.errors.location && (
                <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>{t("form.type")}</Label>
              <Select 
                onValueChange={(val) => form.setValue("type", val as "remote" | "onsite" | "hybrid", { shouldValidate: true })} 
                value={form.watch("type")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">{t("form.remote")}</SelectItem>
                  <SelectItem value="onsite">{t("form.onsite")}</SelectItem>
                  <SelectItem value="hybrid">{t("form.hybrid")}</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salaryRange">{t("form.salaryMin")} / {t("form.salaryMax")}</Label>
            <Input 
              id="salaryRange" 
              placeholder="$100k - $150k" 
              {...form.register("salaryRange")} 
            />
            <p className="text-sm text-muted-foreground">Provide a range or fixed amount.</p>
            {form.formState.errors.salaryRange && (
              <p className="text-sm text-destructive">{form.formState.errors.salaryRange.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("form.description")}</Label>
            <Textarea
              id="description"
              placeholder="Job description..."
              className="min-h-[150px]"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              onValueChange={(val) => form.setValue("status", val as "draft" | "published" | "closed", { shouldValidate: true })} 
              value={form.watch("status")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t("form.submitting") : t("form.submit")}
            </Button>
          </div>
      </form>

      <div className="mt-8">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                      <SparkleIcon className="h-5 w-5 text-purple-500" />
                      AI Job Analysis
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleParseJob} disabled={isParsing}>
                      {isParsing ? <CircleNotchIcon className="h-4 w-4 animate-spin mr-2" /> : <SparkleIcon className="h-4 w-4 mr-2" />}
                      {job.parsedRequirements ? "Re-analyze" : "Analyze Job"}
                  </Button>
              </CardHeader>
              <CardContent>
                  {job.parsedRequirements ? (
                      <div className="space-y-4">
                          {(() => {
                              try {
                                  const reqs = typeof job.parsedRequirements === 'string'
                                      ? JSON.parse(job.parsedRequirements)
                                      : job.parsedRequirements;
                                  
                                  if (reqs && typeof reqs === 'object') {
                                      return (
                                          <div className="grid gap-4">
                                              {Object.entries(reqs).map(([key, value]) => (
                                                  <div key={key}>
                                                      <h4 className="font-semibold capitalize mb-1">{key.replace(/_/g, ' ')}</h4>
                                                      {Array.isArray(value) ? (
                                                          <div className="flex flex-wrap gap-2">
                                                              {value.map((v: unknown, i: number) => (
                                                                  <Badge key={i} variant="secondary">{String(v)}</Badge>
                                                              ))}
                                                          </div>
                                                      ) : (
                                                          <p className="text-sm text-muted-foreground">{String(value)}</p>
                                                      )}
                                                  </div>
                                              ))}
                                          </div>
                                      )
                                  }
                                  return <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(reqs, null, 2)}</pre>
                              } catch (e) {
                                   return <p className="text-sm text-muted-foreground">Error parsing requirements</p>
                              }
                          })()}
                      </div>
                  ) : (
                      <div className="text-center py-6 text-muted-foreground">
                           <SparkleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                           <p>No AI analysis available yet.</p>
                           <p className="text-sm">Analyze the job description to extract structured requirements.</p>
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>
    </div>
  )
}
