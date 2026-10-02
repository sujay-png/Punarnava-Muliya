"use client";

import { Building2, LayoutDashboard, Users, CreditCard, Wrench, Bell, LogOut, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

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
  useSidebar,
} from "@/components/ui/sidebar";
import { authService } from "@/lib/api/auth";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tenants", url: "/dashboard/tenants", icon: Users },
  { title: "Fees", url: "/dashboard/fees", icon: CreditCard },
  { title: "Maintenance", url: "/dashboard/maintenance", icon: Wrench },
  { title: "Notice Board", url: "/dashboard/notices", icon: Bell },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      router.push("/login");
      
      // Delay sign out slightly to allow React to unmount dashboard components 
      // and cleanly unsubscribe from all active Firebase listeners.
      setTimeout(async () => {
        await authService.signOut();
        toast.success("Logged out successfully");
        setIsLoggingOut(false);
      }, 500);
    } catch (error) {
      toast.error("Failed to log out");
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="h-16 flex items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-3 w-full transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground truncate">Punarnava Muliya</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 px-6">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3 mt-2">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url || (pathname.startsWith(item.url) && item.url !== "/dashboard");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      render={<Link href={item.url} className="flex items-center gap-3 w-full" />} 
                      isActive={isActive}
                      onClick={() => setOpenMobile(false)}
                      tooltip={item.title}
                      className={`h-10 px-3 flex items-center gap-3 rounded-md transition-colors ${
                        isActive 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="h-10 px-3 flex items-center gap-3 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full cursor-pointer"
            >
              {isLoggingOut ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <LogOut className="h-4 w-4 shrink-0" />}
              <span className="truncate">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
