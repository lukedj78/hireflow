"use client"

import * as React from "react"
import {
  User,
  Briefcase,
  Gear,
  FileText
} from "@phosphor-icons/react"

import Link from "next/link"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavUser } from "@/components/dashboard/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar"
import { useSession } from "@/lib/auth-client"

export function CandidateSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard/candidate",
      icon: User,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard/candidate",
        },
      ],
    },
    {
      title: "Jobs",
      url: "/dashboard/candidate/jobs",
      icon: Briefcase,
      items: [
        {
          title: "Search Jobs",
          url: "/dashboard/candidate/jobs",
        },
        {
          title: "My Applications",
          url: "/dashboard/candidate/applications",
        },
        {
          title: "Saved Jobs",
          url: "/dashboard/candidate/saved",
        },
      ],
    },
    {
      title: "Profile",
      url: "/dashboard/candidate/profile",
      icon: FileText,
      items: [
        {
          title: "My Profile",
          url: "/dashboard/candidate/profile",
        },
        {
            title: "Resume",
            url: "/dashboard/candidate/profile/resume",
        }
      ]
    },
    {
      title: "Settings",
      url: "/dashboard/candidate/settings",
      icon: Gear,
      items: [
        {
          title: "Account",
          url: "/dashboard/candidate/settings",
        },
      ],
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={
              <Link href="/dashboard/candidate">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <User className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Candidate Portal</span>
                  <span className="truncate text-xs">HireFlow</span>
                </div>
              </Link>
            } />
          </SidebarMenuItem>
        </SidebarMenu>
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
