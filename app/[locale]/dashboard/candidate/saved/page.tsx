import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, DollarSign, Building, Trash2 } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { PageHeader } from "@/components/page-header"

export default function CandidateSavedJobsPage() {
  return (
    <PageLayout>
      <PageHeader
        title="Saved Jobs"
        description="Manage your saved job listings."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Saved Job Card 1 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Senior Frontend Developer</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Building className="h-3 w-3" /> TechCorp Inc.
                </CardDescription>
              </div>
              <Badge variant="outline">Remote</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> San Francisco, CA
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Full-time
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> $120k - $160k
              </div>
            </div>
            <p className="text-sm line-clamp-2">
              We are looking for an experienced Frontend Developer to join our team. You will be responsible for building high-quality, scalable web applications using React and Next.js.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
            </Button>
            <Button>Apply Now</Button>
          </CardFooter>
        </Card>

        {/* Saved Job Card 2 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Backend Engineer</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Building className="h-3 w-3" /> DataSystems
                </CardDescription>
              </div>
              <Badge variant="outline">On-site</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Austin, TX
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Full-time
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> $110k - $150k
              </div>
            </div>
            <p className="text-sm line-clamp-2">
              Join our backend team to build robust APIs and data pipelines. Experience with Node.js and PostgreSQL is required.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
            </Button>
            <Button>Apply Now</Button>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  )
}
