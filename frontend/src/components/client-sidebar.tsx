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
  LayoutDashboard,
  FileText,
  Settings,
  LifeBuoy,
  Send,
  Database
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Sample data for Client
const data = {
  user: {
    name: "Client User",
    email: "client@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "My Business",
      logo: GalleryVerticalEnd,
      plan: "Client",
    },
  ],
  navMain: [
    {
      title: "Meu Painel",
      url: "/client",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Visão Geral",
          url: "/client",
        },
        {
          title: "Relatórios",
          url: "/client/reports",
        },
      ],
    },
    {
      title: "Serviços",
      url: "/client/services",
      icon: SquareTerminal,
      items: [
        {
          title: "Meus Contratos",
          url: "/client/services",
        },
        {
          title: "Faturas",
          url: "/client/invoices",
        },
      ],
    },
    {
      title: "Suporte",
      url: "/client/support",
      icon: LifeBuoy,
      items: [
        {
          title: "Abrir Ticket",
          url: "/client/support/new",
        },
        {
          title: "Meus Tickets",
          url: "/client/support",
        },
      ],
    },
  ],
}

export function ClientSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
