import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { jobPosting, application, candidate, user } from "@/lib/db/schema"
import { eq, count, desc, sql } from "drizzle-orm"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Users, Briefcase, FileText, CheckCircle } from "lucide-react"

interface DashboardStats {
  totalJobs: number
  totalApplications: number
  interviewsScheduled: number
  hiredCandidates: number
  applicationsByStatus: { name: string; total: number }[]
  recentApplications: {
    id: string
    candidateName: string
    candidateEmail: string
    candidateAvatarUrl: string
    jobTitle: string
    jobId: string
    organizationId: string
    status: string
    appliedAt: Date
  }[]
}

async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  // 1. Total Active Jobs
  const [jobsCount] = await db
    .select({ count: count() })
    .from(jobPosting)
    .where(eq(jobPosting.organizationId, organizationId));

  // 2. Total Applications
  const [appsCount] = await db
    .select({ count: count() })
    .from(application)
    .innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
    .where(eq(jobPosting.organizationId, organizationId));

  // 3. Interviews Scheduled
  const [interviewsCount] = await db
    .select({ count: count() })
    .from(application)
    .innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
    .where(
      sql`${jobPosting.organizationId} = ${organizationId} AND ${application.status} = 'interview'`
    );

  // 4. Hired Candidates
  const [hiredCount] = await db
    .select({ count: count() })
    .from(application)
    .innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
    .where(
      sql`${jobPosting.organizationId} = ${organizationId} AND ${application.status} = 'hired'`
    );

  // 5. Applications by Status (for Chart)
  const appsByStatus = await db
    .select({
      status: application.status,
      count: count(),
    })
    .from(application)
    .innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
    .where(eq(jobPosting.organizationId, organizationId))
    .groupBy(application.status);

  // Format for Chart
  const chartData = appsByStatus.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    total: item.count,
  }));

  // 6. Recent Applications
  const recentApps = await db
    .select({
      id: application.id,
      status: application.status,
      appliedAt: application.createdAt,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      candidateAvatarUrl: user.image,
      jobTitle: jobPosting.title,
      jobId: jobPosting.id,
      organizationId: jobPosting.organizationId,
    })
    .from(application)
    .innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
    .innerJoin(candidate, eq(application.candidateId, candidate.id))
    .leftJoin(user, eq(candidate.userId, user.id))
    .where(eq(jobPosting.organizationId, organizationId))
    .orderBy(desc(application.createdAt))
    .limit(5);

  return {
    totalJobs: jobsCount?.count ?? 0,
    totalApplications: appsCount?.count ?? 0,
    interviewsScheduled: interviewsCount?.count ?? 0,
    hiredCandidates: hiredCount?.count ?? 0,
    applicationsByStatus: chartData,
    recentApplications: recentApps.map(app => ({
        ...app,
        candidateAvatarUrl: app.candidateAvatarUrl || "",
        appliedAt: app.appliedAt || new Date()
    })),
  };
}

export default async function OrganizationDashboardPage({
  params,
}: {
  params: Promise<{ organizationId: string }>
}) {
  const { organizationId } = await params;
  const stats = await getDashboardStats(organizationId);

  return (
    <PageLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="animate-fade-in-up stagger-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                Active job postings
              </p>
            </CardContent>
          </Card>
          <Card className="animate-fade-in-up stagger-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="animate-fade-in-up stagger-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interviewsScheduled}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for this week
              </p>
            </CardContent>
          </Card>
          <Card className="animate-fade-in-up stagger-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hired</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hiredCandidates}</div>
              <p className="text-xs text-muted-foreground">
                Candidates hired this year
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Pipeline Overview Chart */}
          <Card className="col-span-4 animate-fade-in-up stagger-5">
            <CardHeader>
              <CardTitle>Pipeline Overview</CardTitle>
              <CardDescription>
                Distribution of applications across different stages.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <OverviewChart data={stats.applicationsByStatus} />
            </CardContent>
          </Card>

          {/* Recent Activity List */}
          <Card className="col-span-3 animate-fade-in-up stagger-6">
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>
                Latest candidates who applied to your jobs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivity applications={stats.recentApplications} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
