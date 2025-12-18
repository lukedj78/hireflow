import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PageLayout } from "@/components/page-layout"

export default function CandidateProfilePage() {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your public profile information.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[250px_1fr]">
        <Card>
            <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder-user.jpg" alt="@johndoe" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">Change Avatar</Button>
            </CardContent>
        </Card>

        <div className="space-y-4">
            <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                Update your personal details.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" defaultValue="Doe" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Input id="headline" placeholder="Software Engineer | React Enthusiast" defaultValue="Software Engineer" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="about">About</Label>
                    <Textarea
                        id="about"
                        placeholder="Tell us about yourself"
                        className="min-h-[100px]"
                        defaultValue="I am a passionate software engineer with 5 years of experience..."
                    />
                </div>
            </CardContent>
            <CardFooter className="justify-end">
                <Button>Save Changes</Button>
            </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="john@example.com" defaultValue="john@example.com" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" placeholder="City, Country" defaultValue="New York, USA" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" type="url" placeholder="https://johndoe.com" />
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </PageLayout>
  )
}
