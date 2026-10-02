"use client";

import { AuthGuard } from "@/components/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Building2, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api/auth";
import { toast } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      router.push("/login");
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
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex w-full flex-col flex-1 overflow-hidden">
            {/* Desktop Header */}
            <header className="hidden md:flex h-16 shrink-0 items-center gap-2 border-b border-border/40 px-4 bg-background/95 backdrop-blur z-10 sticky top-0">
              <SidebarTrigger className="-ml-1" />
            </header>

            {/* Mobile Header */}
            <header className="flex md:hidden h-16 shrink-0 items-center justify-between border-b border-border/40 px-4 bg-background/95 backdrop-blur z-10 sticky top-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-lg tracking-tight">Punarnava Muliya</span>
              </div>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLoggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
              {children}
            </main>
            <MobileNav />
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
