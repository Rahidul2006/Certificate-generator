"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  FileImage,
  Award,
  Users,
  Settings,
  Mail,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Send,
  },
  {
    name: "Templates",
    href: "/templates",
    icon: FileImage,
  },
  {
    name: "Certificates",
    href: "/certificates",
    icon: Award,
  },
  {
    name: "Recipients",
    href: "/recipients",
    icon: Users,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/60 backdrop-blur-md lg:block">
      <div className="flex h-full flex-col">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 font-bold shadow-sm">
            <Mail size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-foreground">
              CertiMail
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">
              SaaS Suite
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800/80 text-foreground border border-zinc-700/60 shadow-xs"
                    : "text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-white" : "text-muted-foreground"}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Settings Footer */}
        <div className="border-t border-border p-3">
          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              pathname.startsWith("/settings")
                ? "bg-zinc-800/80 text-foreground border border-zinc-700/60"
                : "text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
            }`}
          >
            <Settings size={18} />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}