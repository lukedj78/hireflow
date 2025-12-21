"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { updateOrganizationAction, leaveOrganizationAction } from "@/lib/server/organization-actions"
import { WarningIcon, CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"

interface Organization {
    id: string
    name: string
    slug: string
    createdAt: Date
    logo?: string | null
}

export default function OrganizationSettingsClientPage({ initialOrg: org, currentUserRole }: { initialOrg: Organization | null, currentUserRole: string }) {
  const [name, setName] = useState(org?.name || "")
  const [slug, setSlug] = useState(org?.slug || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const router = useRouter()

  const canUpdateOrg = ["owner", "admin", "hr"].includes(currentUserRole)

  useEffect(() => {
    if (org) {
        setName(org.name)
        setSlug(org.slug)
    }
  }, [org])

  const handleUpdate = async () => {
    if (!org?.id) return
    setIsLoading(true)
    try {
        await updateOrganizationAction({
            organizationId: org.id,
            data: {
                name: name.trim(),
                slug: slug.trim()
            }
        })
        toast.success("Organization updated")
        router.refresh()
    } catch {
        toast.error("Failed to update organization")
    } finally {
        setIsLoading(false)
    }
  }

  const handleLeave = async () => {
      if (!org?.id) return
      setIsLeaving(true)
      try {
          await leaveOrganizationAction(org.id)
          toast.success("Left organization")
          router.push("/dashboard")
      } catch {
          toast.error("Failed to leave organization")
      } finally {
          setIsLeaving(false)
      }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organization Settings</h2>
        <p className="text-muted-foreground">
          Manage your organization details.
        </p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Update your organization name and slug.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    disabled={!canUpdateOrg}
                  />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input 
                    id="slug" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    disabled={!canUpdateOrg}
                  />
              </div>
          </CardContent>
          {canUpdateOrg && (
          <CardFooter>
              <Button onClick={handleUpdate} disabled={isLoading}>
                  {isLoading && <CircleNotchIcon className="h-4 w-4 animate-spin" />}
                  Save Changes
              </Button>
          </CardFooter>
          )}
      </Card>

      <Card className="border-red-200">
          <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                  <WarningCircleIcon className="h-5 w-5" />
                  Danger Zone
              </CardTitle>
              <CardDescription>
                  Actions that can remove your access or delete the organization.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="flex items-center justify-between">
                  <div>
                      <p className="font-medium">Leave Organization</p>
                      <p className="text-sm text-muted-foreground">
                          Revoke your access to this organization.
                      </p>
                  </div>
                  <Button variant="destructive" onClick={handleLeave} disabled={isLeaving}>
                      {isLeaving && <CircleNotchIcon className="h-4 w-4 animate-spin" />}
                      Leave Organization
                  </Button>
              </div>
          </CardContent>
      </Card>
    </div>
  )
}
