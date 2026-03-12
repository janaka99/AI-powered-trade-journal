"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  ChartCandlestick,
  Home,
  LayoutDashboard,
  Shield,
  UserCircle2,
} from "lucide-react";

import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { title: "Home", href: "/", icon: Home },
  { title: "Journal", href: "/journal", icon: ChartCandlestick },
  // { title: "Manual Journal", href: "/manual-journal", icon: BookOpenText },
  { title: "Profile", href: "/profile", icon: UserCircle2 },
  // { title: "Admin", href: "/admin", icon: Shield },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild tooltip={"Trading Journal"}>
            <Link href="/">
              <LayoutDashboard className="ml-[2px] size-7! p-1 bg-primary text-white rounded-md" />
              <span className="text-xl font-bold">TRD Journal</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
