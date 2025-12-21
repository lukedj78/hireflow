import { getJobBySlugAction } from "@/lib/server/jobs-actions"
import { notFound } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Clock, DollarSign, Building, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { JobApplicationForm } from "@/components/dashboard/candidate/job-application-form"
import { Separator } from "@/components/ui/separator"

interface JobDetailsPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const { slug } = await params
  const { data: job } = await getJobBySlugAction(slug)

  if (!job) {
    notFound()
  }

  return (
    <PageLayout>
      <div className="mb-6">
        <Link 
            href="/dashboard/candidate/jobs" 
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">{job.organization.name}</span>
                </div>
            </div>
            <JobApplicationForm jobSlug={job.slug} jobTitle={job.title}  />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                        {job.description}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Posted</span>
                        </div>
                        <span className="font-medium">{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>Location</span>
                        </div>
                        <span className="font-medium">{job.location || "Not specified"}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="h-4 w-4" />
                            <span>Type</span>
                        </div>
                        <Badge variant="secondary" className="capitalize">{job.type}</Badge>
                    </div>
                    <Separator />
                    {job.salaryRange && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                <span>Salary</span>
                            </div>
                            <span className="font-medium">{job.salaryRange}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </PageLayout>
  )
}
