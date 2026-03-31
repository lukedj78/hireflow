"use client"

import { useState, useEffect } from "react"
import { jobPosting, organization } from "@/lib/db/schema"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Clock, DollarSign, Building, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useDebounce } from "use-debounce"
import { cn } from "@/lib/utils"

interface CandidateJobListProps {
  jobs: (typeof jobPosting.$inferSelect & { organization: typeof organization.$inferSelect })[]
  pagination: {
    page: number
    limit: number
    totalJobs: number
    totalPages: number
  }
}

export function CandidateJobList({ jobs, pagination }: CandidateJobListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)

  // Handle search update
  useEffect(() => {
    const currentSearch = searchParams.get("search") || ""
    if (debouncedSearchQuery === currentSearch) return

    const params = new URLSearchParams(searchParams)
    if (debouncedSearchQuery) {
      params.set("search", debouncedSearchQuery)
    } else {
      params.delete("search")
    }
    params.set("page", "1") // Reset to page 1 on search
    router.replace(`${pathname}?${params.toString()}`)
  }, [debouncedSearchQuery, pathname, router, searchParams]) // Removed searchParams from dependency to avoid loop if not needed, but safe here.

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search jobs, companies, or keywords..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search jobs, companies, or keywords"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {jobs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No jobs found matching your criteria.
          </div>
        ) : (
          jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      <Link href={`/dashboard/candidate/jobs/${job.slug}`} className="hover:underline">
                        {job.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building className="h-3 w-3" /> {job.organization.name}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {job.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {job.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </div>
                  {job.salaryRange && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" /> {job.salaryRange}
                    </div>
                  )}
                </div>
                <p className="text-sm line-clamp-2 text-muted-foreground">
                  {job.description}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline">Save</Button>
                  <Link 
                    href={`/dashboard/candidate/jobs/${job.slug}`}
                    className={cn(buttonVariants({ variant: "default" }))}
                  >
                    Apply Now
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
