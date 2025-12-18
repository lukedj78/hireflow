import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface RecentActivityProps {
  applications: {
    id: string
    candidateName: string
    candidateEmail: string
    jobTitle: string
    status: string
    appliedAt: Date
  }[]
}

export function RecentActivity({ applications }: RecentActivityProps) {
  return (
    <div className="space-y-8">
      {applications.map((app) => (
        <div key={app.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://avatar.vercel.sh/${app.candidateEmail}`} alt={app.candidateName} />
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
        </div>
      ))}
      {applications.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
      )}
    </div>
  )
}
