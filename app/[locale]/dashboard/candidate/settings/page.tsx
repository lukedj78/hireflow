import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { PageLayout } from "@/components/page-layout"

export default function CandidateSettingsPage() {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and security.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[250px_1fr]">
        <div className="hidden md:block">
            <nav className="flex flex-col space-y-1">
                <Button variant="secondary" className="justify-start">General</Button>
                <Button variant="ghost" className="justify-start">Security</Button>
                <Button variant="ghost" className="justify-start">Notifications</Button>
                <Button variant="ghost" className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10">Delete Account</Button>
            </nav>
        </div>
        
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>
                        Configure when you want to receive emails.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="new-jobs" className="flex flex-col space-y-1">
                            <span>New Job Alerts</span>
                            <span className="font-normal text-xs text-muted-foreground">Receive emails when new jobs match your profile.</span>
                        </Label>
                        <Switch id="new-jobs" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="app-updates" className="flex flex-col space-y-1">
                            <span>Application Updates</span>
                            <span className="font-normal text-xs text-muted-foreground">Receive emails when the status of your application changes.</span>
                        </Label>
                        <Switch id="app-updates" defaultChecked />
                    </div>
                    <Separator />
                     <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="marketing" className="flex flex-col space-y-1">
                            <span>Marketing Emails</span>
                            <span className="font-normal text-xs text-muted-foreground">Receive news and special offers.</span>
                        </Label>
                        <Switch id="marketing" />
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button>Save Preferences</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button>Update Password</Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </PageLayout>
  )
}
