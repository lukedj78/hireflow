import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, MapPin, Clock, DollarSign, Building } from "lucide-react"
import { PageLayout } from "@/components/page-layout"

export default function CandidateJobsPage() {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Find Your Next Role</h1>
          <p className="text-muted-foreground">
            Search and apply for jobs that match your skills and experience.
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-3 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search jobs, skills, or companies..."
                className="pl-8"
              />
            </div>
            <Button>Search</Button>
          </div>

          <div className="space-y-4">
            {/* Job Card Placeholder 1 */}
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
                <div className="flex gap-2 mt-4">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Next.js</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-xs text-muted-foreground">Posted 2 days ago</p>
                <div className="flex gap-2">
                    <Button variant="outline">Save</Button>
                    <Button>Apply Now</Button>
                </div>
              </CardFooter>
            </Card>

            {/* Job Card Placeholder 2 */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Product Designer</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building className="h-3 w-3" /> Creative Solutions
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Hybrid</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> New York, NY
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Contract
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> $80 - $120 / hr

                  </div>
                </div>
                <p className="text-sm line-clamp-2">
                  Join our design team to create intuitive and beautiful user experiences. You will work closely with product managers and engineers to deliver top-notch designs.
                </p>
                 <div className="flex gap-2 mt-4">
                  <Badge variant="secondary">Figma</Badge>
                  <Badge variant="secondary">UI/UX</Badge>
                  <Badge variant="secondary">Prototyping</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                 <p className="text-xs text-muted-foreground">Posted 5 hours ago</p>
                <div className="flex gap-2">
                    <Button variant="outline">Save</Button>
                    <Button>Apply Now</Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Job Type</h4>
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm font-normal">
                        <input type="checkbox" className="rounded border-gray-300" /> Full-time
                    </label>
                    <label className="flex items-center gap-2 text-sm font-normal">
                        <input type="checkbox" className="rounded border-gray-300" /> Part-time
                    </label>
                    <label className="flex items-center gap-2 text-sm font-normal">
                        <input type="checkbox" className="rounded border-gray-300" /> Contract
                    </label>
                    <label className="flex items-center gap-2 text-sm font-normal">
                        <input type="checkbox" className="rounded border-gray-300" /> Internship
                    </label>
                </div>
              </div>
              <Separator />
               <div className="space-y-2">
                <h4 className="font-medium text-sm">Remote</h4>
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm font-normal">
                        <input type="checkbox" className="rounded border-gray-300" /> Remote
                    </label>
                    <label className="flex items-center gap-2 text-sm font-normal">
                        <input type="checkbox" className="rounded border-gray-300" /> Hybrid
                    </label>
                    <label className="flex items-center gap-2 text-sm font-normal">
                        <input type="checkbox" className="rounded border-gray-300" /> On-site
                    </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
