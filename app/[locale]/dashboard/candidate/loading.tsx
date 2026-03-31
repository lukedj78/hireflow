import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CandidateDashboardLoading() {
  return (
    <PageLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-9 w-48" />

        {/* Metric Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommended Jobs Skeleton */}
        <Card className="col-span-7">
          <CardHeader>
            <Skeleton className="h-5 w-44 mb-1" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
