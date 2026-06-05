"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sword, Users, BarChart3, ListOrdered, Repeat2,
  MessageSquare, Settings, ClipboardList, Calendar, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeagueSidebarProps {
  leagueId: string;
  leagueName: string;
  isCommissioner: boolean;
  currentWeek: number;
}

export function LeagueSidebar({ leagueId, leagueName, isCommissioner, currentWeek }: LeagueSidebarProps) {
  const pathname = usePathname();
  const base = `/leagues/${leagueId}`;

  const navItems = [
    { label: "Matchup", href: `${base}/matchup`, icon: Sword, sub: `Week ${currentWeek}` },
    { label: "My Roster", href: `${base}/roster`, icon: Users },
    { label: "Players", href: `${base}/players`, icon: ListOrdered },
    { label: "Standings", href: `${base}/standings`, icon: BarChart3 },
    { label: "Schedule", href: `${base}/schedule`, icon: Calendar },
    { label: "Trades", href: `${base}/trades`, icon: Repeat2 },
    { label: "Chat", href: `${base}/chat`, icon: MessageSquare },
    { label: "Draft", href: `${base}/draft`, icon: ClipboardList },
  ];

  if (isCommissioner) {
    navItems.push({ label: "Commissioner", href: `${base}/admin`, icon: Shield });
    navItems.push({ label: "Settings", href: `${base}/settings`, icon: Settings });
  }

  return (
    <nav className="w-52 shrink-0 bg-[#0d0d14] border-r border-[#2a2a3e] flex flex-col h-full py-4 px-3">
      <p className="text-xs text-[#8b8ba7] font-medium uppercase tracking-wider px-3 mb-2 truncate">{leagueName}</p>
      <div className="space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, sub }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
              pathname === href
                ? "bg-[#7c3aed]/20 text-white font-medium"
                : "text-[#8b8ba7] hover:bg-[#1e1e2e] hover:text-white"
            )}
          >
            <span className="flex items-center gap-3">
              <Icon size={15} />
              {label}
            </span>
            {sub && <span className="text-xs text-[#8b8ba7]">{sub}</span>}
          </Link>
        ))}
      </div>
    </nav>
  );
}
