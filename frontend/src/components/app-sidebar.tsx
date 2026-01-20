"use client"

import * as React from "react"
import {
  AudioWaveform,
  GalleryVerticalEnd,
  Map,
  PieChart,
  LayoutDashboard,
  Database,
  Frame,
  Users
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Sample data for Master Admin
const data = {
  user: {
    name: "Master Admin",
    email: "master@agency.com",
    avatar: "https://github.com/shadcn.png",
  },
  teams: [
    {
      name: "Agency Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Dev Team",
      logo: AudioWaveform,
      plan: "Startup",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/master",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/master",
        },
        {
          title: "Analytics",
          url: "/master/analytics",
        },
      ],
    },
    {
      title: "Clientes",
      url: "/master/users",
      icon: Users,
      items: [
        {
          title: "Todos os Clientes",
          url: "/master/users",
        },
        {
          title: "Novo Cliente",
          url: "/master/users/new",
        },
      ],
    },
    {
      title: "Sistema",
      url: "/master/logs",
      icon: Database,
      items: [
        {
          title: "Logs de Auditoria",
          url: "/master/logs",
        },
        {
          title: "Configurações",
          url: "/master/settings",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
