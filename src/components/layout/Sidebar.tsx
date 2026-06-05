"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Trophy, LayoutDashboard, Users, Bell, LogOut, ChevronRight, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Leagues", href: "/leagues", icon: Users },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-60 shrink-0 bg-[#0d0d14] border-r border-[#2a2a3e] flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#2a2a3e]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center shrink-0">
            <Trophy size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">GridIron</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-[#7c3aed]/20 text-white font-medium"
                : "text-[#8b8ba7] hover:bg-[#1e1e2e] hover:text-white"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        <div className="pt-4">
          <Link
            href="/leagues/create"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#7c3aed] hover:bg-[#7c3aed]/10 transition-colors font-medium"
          >
            <Plus size={16} />
            Create League
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-[#2a2a3e] px-3 py-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{session?.user?.name}</p>
            <p className="text-[#8b8ba7] text-xs truncate">@{session?.user?.username}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[#8b8ba7] hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
