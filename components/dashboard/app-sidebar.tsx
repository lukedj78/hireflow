"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
  Building2,
  ShieldCheck
} from "lucide-react"

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: session } = useSession()
    
    // Build navigation based on role
    const navMain = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: PieChart,
            isActive: true,
            items: [
                {
                    title: "Overview",
                    url: "/dashboard",
                },
            ],
        },
        {
            title: "Organization",
            url: "/dashboard/organization",
            icon: Building2,
            items: [
                {
                    title: "Settings",
                    url: "/dashboard/organization/settings",
                },
                {
                    title: "Members",
                    url: "/dashboard/organization/members",
                },
                {
                    title: "Teams",
                    url: "/dashboard/organization/teams",
                },
            ],
        },
    ]

    // Admin nav
    if (session?.user.role === "admin") {
        navMain.push({
            title: "Admin",
            url: "/dashboard/admin",
            icon: ShieldCheck,
            items: [
                {
                    title: "Users",
                    url: "/dashboard/admin/users",
                },
                {
                    title: "Organizations",
                    url: "/dashboard/admin/organizations",
                }
            ]
        })
    }

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
