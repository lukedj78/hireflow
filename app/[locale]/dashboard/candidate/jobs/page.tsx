import { getPublicJobsAction } from "@/lib/server/jobs-actions"
import { PageLayout } from "@/components/page-layout"
import { PageHeader } from "@/components/page-header"

import { CandidateJobList } from "@/components/dashboard/candidate/job-list"

export default async function CandidateJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { page, search } = await searchParams
  const currentPage = Number(page) || 1
  const searchQuery = typeof search === "string" ? search : undefined

  const { data: jobs, pagination } = await getPublicJobsAction(currentPage, 10, searchQuery)

  return (
    <PageLayout>
      <PageHeader title="Find Your Next Role" description="Search and apply for jobs that match your skills and experience." />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-3 space-y-4">
          <CandidateJobList 
            jobs={jobs || []} 
            pagination={pagination || {
              page: 1,
              limit: 10,
              totalJobs: 0,
              totalPages: 1
            }}
          />
        </div>

        {/* Sidebar Filters - Placeholder for future implementation or moved to CandidateJobList */}
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
             <h3 className="font-semibold mb-4">Filters</h3>
             <p className="text-sm text-muted-foreground">
               Advanced filtering coming soon. Use the search bar to find relevant positions.
             </p>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
