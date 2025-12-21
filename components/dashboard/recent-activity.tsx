import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface RecentActivityProps {
  applications: {
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

export function RecentActivity({ applications }: RecentActivityProps) {
  return (
    <div className="space-y-8">
      {applications.map((app) => (
        <Link 
          key={app.id} 
          href={`/dashboard/${app.organizationId}/jobs/${app.jobId}/applications/${app.id}`}
          className="flex items-center hover:bg-muted/50 p-2 rounded-md transition-colors"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={app.candidateAvatarUrl} alt={app.candidateName} />
            <AvatarFallback>{app.candidateName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{app.candidateName}</p>
            <p className="text-sm text-muted-foreground">
              Applied for <span className="font-medium text-foreground">{app.jobTitle}</span>
            </p>
          </div>
          <div className="ml-auto font-medium">
             <Badge variant="outline" className="capitalize">{app.status}</Badge>
          </div>
        </Link>
      ))}
      {applications.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
      )}
    </div>
  )
}
