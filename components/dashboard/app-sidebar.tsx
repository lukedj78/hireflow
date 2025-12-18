"use client"

import * as React from "react"
import {
  ChartPieIcon,
  BuildingsIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react"

import { NavMain } from "@/components/dashboard/nav-main"
import { NavUser } from "@/components/dashboard/nav-user"
import { OrgSwitcher } from "@/components/dashboard/org-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { authClient, useSession } from "@/lib/auth-client"
import { useParams } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: session } = useSession()
    const params = useParams()
    const organizationId = params?.organizationId as string
    
    // Build navigation based on role
    const navMain = [
        {
            title: "Dashboard",
            url: `/dashboard/${organizationId}`,
            icon: ChartPieIcon,
            isActive: true,
            items: [
                {
                    title: "Overview",
                    url: `/dashboard/${organizationId}`,
                },
            ],
        },
        {
            title: "Organization",
            url: `/dashboard/${organizationId}`,
            icon: BuildingsIcon,
            items: [
                {
                    title: "Settings",
                    url: `/dashboard/${organizationId}/settings`,
                },
                {
                    title: "Members",
                    url: `/dashboard/${organizationId}/members`,
                },
                {
                    title: "Teams",
                    url: `/dashboard/${organizationId}/teams`,
                },
                {
                    title: "Jobs",
                    url: `/dashboard/${organizationId}/jobs`,
                },
            ],
        },
    ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
