"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { submitApplicationAction, checkApplicationStatusAction } from "@/lib/server/application-actions"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"

interface JobApplicationFormProps {
  jobSlug: string
  jobTitle: string
}

export function JobApplicationForm({ jobSlug, jobTitle }: JobApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { hasApplied } = await checkApplicationStatusAction(jobSlug)
        setHasApplied(hasApplied)
      } catch (error) {
        console.error("Failed to check application status:", error)
      } finally {
        setIsLoading(false)
      }
    }
    checkStatus()
  }, [jobSlug])

  const handleApply = async () => {
    setIsSubmitting(true)
    try {
      // For now, we assume the candidate applies with their existing profile.
      // In a more complex version, we would allow file upload here.
      await submitApplicationAction({ jobSlug })
      setHasApplied(true)
      toast.success(`Application sent for ${jobTitle}!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Button disabled variant="outline" className="w-full md:w-auto">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking status...
      </Button>
    )
  }

  if (hasApplied) {
    return (
      <Button disabled variant="secondary" className="w-full md:w-auto text-green-600 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Applied
      </Button>
    )
  }

  return (
    <Button onClick={handleApply} disabled={isSubmitting} className="w-full md:w-auto">
      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
      Apply Now
    </Button>
  )
}
