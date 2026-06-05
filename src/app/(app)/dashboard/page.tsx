import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Trophy, Users, ChevronRight } from "lucide-react";
import { getRecordStr } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getAuth();
  if (!session) return null;

  const memberships = await prisma.leagueMember.findMany({
    where: { userId: session.user.id },
    include: {
      league: {
        include: { members: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const unreadNotifs = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {session.user.name} 👋
        </h1>
        <p className="text-[#8b8ba7] mt-1 text-sm">
          {memberships.length === 0
            ? "You're not in any leagues yet. Create one to get started."
            : `You're in ${memberships.length} league${memberships.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {unreadNotifs > 0 && (
        <Link
          href="/notifications"
          className="flex items-center gap-3 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-xl px-5 py-3 mb-6 hover:bg-[#7c3aed]/20 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
          <span className="text-[#a78bfa] text-sm font-medium">
            {unreadNotifs} unread notification{unreadNotifs !== 1 ? "s" : ""}
          </span>
          <ChevronRight size={14} className="ml-auto text-[#7c3aed]" />
        </Link>
      )}

      {/* My Leagues */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">My Leagues</h2>
        <Link
          href="/leagues/create"
          className="flex items-center gap-1.5 text-sm text-[#7c3aed] hover:text-[#a78bfa] font-medium"
        >
          <Plus size={14} /> New League
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="bg-[#161622] border border-[#2a2a3e] border-dashed rounded-2xl p-12 flex flex-col items-center">
          <Trophy size={36} className="text-[#4a4a6a] mb-4" />
          <p className="text-[#8b8ba7] text-sm mb-4">No leagues yet</p>
          <Link
            href="/leagues/create"
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
          >
            Create your first league
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {memberships.map(m => (
            <Link
              key={m.id}
              href={`/leagues/${m.league.id}/matchup`}
              className="bg-[#161622] border border-[#2a2a3e] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[#7c3aed]/50 hover:bg-[#1a1a2a] transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center shrink-0">
                <Trophy size={18} className="text-[#7c3aed]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{m.league.name}</p>
                <p className="text-[#8b8ba7] text-xs mt-0.5">
                  {m.teamName} &middot; {m.league.members.length} teams &middot;{" "}
                  <span className={m.role === "commissioner" ? "text-[#7c3aed]" : ""}>
                    {m.role === "commissioner" ? "Commissioner" : "Member"}
                  </span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white text-sm font-semibold">{getRecordStr(m.wins, m.losses, m.ties)}</p>
                <p className="text-[#8b8ba7] text-xs">{m.league.status.replace("_", " ")}</p>
              </div>
              <ChevronRight size={16} className="text-[#4a4a6a] group-hover:text-[#7c3aed] transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Join League */}
      <div className="mt-6 bg-[#161622] border border-[#2a2a3e] rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Join a League</h3>
        <JoinByInviteClient />
      </div>
    </div>
  );
}

function JoinByInviteClient() {
  return (
    <form action="/api/leagues/join" method="GET" className="flex gap-2">
      <input
        name="code"
        placeholder="Enter invite code"
        className="flex-1 bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2 text-white placeholder-[#4a4a6a] text-sm focus:outline-none focus:border-[#7c3aed]"
      />
      <Link
        href="/leagues/join"
        className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
      >
        Join
      </Link>
    </form>
  );
}
