"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Wrench, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tenants",
    url: "/dashboard/tenants",
    icon: Users,
  },
  {
    title: "Fees",
    url: "/dashboard/fees",
    icon: CreditCard,
  },
  {
    title: "Issues",
    url: "/dashboard/maintenance",
    icon: Wrench,
  },
  {
    title: "Notices",
    url: "/dashboard/notices",
    icon: Megaphone,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background pb-safe pt-1">
      {items.map((item) => {
        const isActive = pathname === item.url;
        return (
          <Link
            key={item.title}
            href={item.url}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground transition-colors",
              isActive && "text-primary"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-14 items-center justify-center rounded-full transition-all",
                isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
              {item.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
