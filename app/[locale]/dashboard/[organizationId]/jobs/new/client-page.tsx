"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
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
import { parseJobDescriptionAction } from "@/lib/server/ai-actions"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sparkles } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"


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
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [aiInput, setAiInput] = useState("")
  const [isAILoading, setIsAILoading] = useState(false)

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

  async function handleAIFill() {
    if (!aiInput.trim()) return

    setIsAILoading(true)
    try {
        const result = await parseJobDescriptionAction(aiInput)
        if (result.success && result.data) {
            form.setValue("title", result.data.title)
            form.setValue("location", result.data.location)
            form.setValue("type", result.data.type as "remote" | "onsite" | "hybrid")
            form.setValue("salaryRange", result.data.salaryRange)
            form.setValue("description", result.data.description)
            toast.success("Job details filled with AI")
            setIsAIDialogOpen(false)
        } else {
            toast.error(result.error || "Failed to parse job description")
        }
    } catch (error) {
        toast.error("An error occurred while parsing")
    } finally {
        setIsAILoading(false)
    }
  }

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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("create")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
            <DialogTrigger render={
                <Button variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    Auto-fill with AI
                </Button>
            } />
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Auto-fill from Description</DialogTitle>
                    <DialogDescription>
                        Paste the full job description below. AI will extract the details and fill the form for you.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea 
                        placeholder="Paste job description here..." 
                        className="min-h-[300px]"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAIFill} disabled={!aiInput.trim() || isAILoading}>
                        {isAILoading ? (
                            <>
                                <Spinner className="mr-2" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
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
                )}
              />
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
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
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
              )}
            />
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
