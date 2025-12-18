"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createJobAction } from "@/lib/server/jobs-actions"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  location: z.string().min(1, "Location is required"),
  type: z.enum(["remote", "onsite", "hybrid"]),
  salaryRange: z.string().min(1, "Salary range is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["draft", "published", "closed"]),
})

type JobFormValues = z.infer<typeof jobSchema>

interface CreateJobClientPageProps {
  activeOrgId: string
}

export default function CreateJobClientPage({ activeOrgId }: CreateJobClientPageProps) {
  const t = useTranslations("Jobs")
  const router = useRouter()

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      location: "",
      type: "onsite",
      salaryRange: "",
      description: "",
      status: "draft",
    },
  })

  async function onSubmit(data: JobFormValues) {
    try {
      const result = await createJobAction({
        ...data,
        organizationId: activeOrgId,
      })

      if (result.success) {
        toast.success("Job created successfully")
        router.push(`/dashboard/${activeOrgId}/jobs`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create job")
      }
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("create")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
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
                defaultValue={form.getValues("type")}
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
              defaultValue={form.getValues("status")}
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
    </div>
  )
}
