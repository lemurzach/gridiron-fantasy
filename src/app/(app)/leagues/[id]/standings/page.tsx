import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getRecordStr, formatPoints } from "@/lib/utils";
import { BarChart3, Trophy } from "lucide-react";

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return null;
  const { id } = await params;

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) notFound();

  const members = await prisma.leagueMember.findMany({
    where: { leagueId: id },
    include: { user: true },
    orderBy: [{ wins: "desc" }, { pointsFor: "desc" }],
  });

  const myMember = members.find(m => m.userId === session.user.id);
  const myRank = members.findIndex(m => m.userId === session.user.id) + 1;

  const playoffCutoff = league.playoffTeams;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">Standings</h1>
        <span className="ml-auto text-xs text-[#8b8ba7]">Week {league.currentWeek}</span>
      </div>

      {myMember && (
        <div className="bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-xl px-5 py-3 mb-5 flex items-center gap-4">
          <span className="text-2xl font-black text-[#7c3aed]">#{myRank}</span>
          <div>
            <p className="text-white font-semibold text-sm">{myMember.teamName}</p>
            <p className="text-[#8b8ba7] text-xs">{getRecordStr(myMember.wins, myMember.losses, myMember.ties)} · {formatPoints(myMember.pointsFor)} pts</p>
          </div>
          {myRank <= playoffCutoff && (
            <span className="ml-auto text-xs bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full font-medium">Playoff</span>
          )}
        </div>
      )}

      <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 px-5 py-2.5 border-b border-[#2a2a3e] text-xs text-[#8b8ba7] font-medium uppercase tracking-wider">
          <span className="col-span-1">#</span>
          <span className="col-span-5">Team</span>
          <span className="col-span-2 text-center">W-L</span>
          <span className="col-span-2 text-center">PF</span>
          <span className="col-span-2 text-center">PA</span>
        </div>

        {members.map((m, i) => {
          const rank = i + 1;
          const isMe = m.userId === session.user.id;
          const isPlayoff = rank <= playoffCutoff;
          return (
            <div key={m.id}>
              {rank === playoffCutoff + 1 && (
                <div className="px-5 py-1.5 bg-[#0d0d14] border-y border-[#2a2a3e]">
                  <p className="text-xs text-[#8b8ba7]">— Playoff cutoff —</p>
                </div>
              )}
              <div className={`grid grid-cols-12 items-center px-5 py-3.5 border-b border-[#2a2a3e] last:border-0 transition-colors ${isMe ? "bg-[#7c3aed]/5" : "hover:bg-[#1e1e2e]"}`}>
                <span className="col-span-1 text-sm">
                  {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : <span className="text-[#8b8ba7]">{rank}</span>}
                </span>
                <div className="col-span-5 flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isPlayoff ? "bg-green-500/20 text-green-300" : "bg-[#2a2a3e] text-[#8b8ba7]"}`}>
                    {m.user.displayName[0]}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isMe ? "text-[#a78bfa]" : "text-white"}`}>{m.teamName}</p>
                    <p className="text-[#8b8ba7] text-xs">{m.user.displayName}</p>
                  </div>
                </div>
                <span className="col-span-2 text-center text-sm text-white">{getRecordStr(m.wins, m.losses, m.ties)}</span>
                <span className="col-span-2 text-center text-sm text-white tabular-nums">{formatPoints(m.pointsFor)}</span>
                <span className="col-span-2 text-center text-sm text-[#8b8ba7] tabular-nums">{formatPoints(m.pointsAgainst)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#4a4a6a] mt-4 text-center">
        Top {playoffCutoff} teams qualify for playoffs (Week {league.playoffStartWeek})
      </p>
    </div>
  );
}
