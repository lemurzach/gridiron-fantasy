import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPoints, getPositionBg } from "@/lib/utils";
import { Sword } from "lucide-react";

export default async function MatchupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return null;
  const { id } = await params;

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) notFound();

  const myMember = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
    include: { user: true },
  });
  if (!myMember) notFound();

  const schedule = await prisma.seasonSchedule.findUnique({
    where: { leagueId_week: { leagueId: id, week: league.currentWeek } },
    include: {
      matchups: {
        include: {
          homeTeam: {
            include: {
              user: true,
              roster: {
                include: {
                  player: {
                    include: {
                      weekStats: {
                        where: { leagueId: id },
                        orderBy: { schedule: { week: "desc" } },
                        take: 1,
                      },
                    },
                  },
                },
                orderBy: [{ isStarter: "desc" }],
              },
            },
          },
          awayTeam: {
            include: {
              user: true,
              roster: {
                include: {
                  player: {
                    include: {
                      weekStats: {
                        where: { leagueId: id },
                        orderBy: { schedule: { week: "desc" } },
                        take: 1,
                      },
                    },
                  },
                },
                orderBy: [{ isStarter: "desc" }],
              },
            },
          },
        },
      },
    },
  });

  const myMatchup = schedule?.matchups.find(
    m => m.homeTeamId === myMember.id || m.awayTeamId === myMember.id
  );

  const otherMatchups = schedule?.matchups.filter(
    m => m.homeTeamId !== myMember.id && m.awayTeamId !== myMember.id
  ) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Sword size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">Week {league.currentWeek} Matchup</h1>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
          schedule?.status === "complete" ? "bg-green-500/20 text-green-300" :
          schedule?.status === "in_progress" ? "bg-yellow-500/20 text-yellow-300" :
          "bg-[#2a2a3e] text-[#8b8ba7]"
        }`}>
          {schedule?.status?.replace("_", " ") ?? "Upcoming"}
        </span>
      </div>

      {/* My matchup */}
      {myMatchup ? (
        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden">
          {/* Score header */}
          <div className="grid grid-cols-3 gap-4 px-6 py-5 border-b border-[#2a2a3e]">
            <div className="text-center">
              <p className="text-white font-bold text-sm truncate">{myMatchup.homeTeam.teamName}</p>
              <p className="text-[#8b8ba7] text-xs">{myMatchup.homeTeam.user.displayName}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-white">
                {formatPoints(myMatchup.homePoints)} <span className="text-[#4a4a6a] text-xl">–</span> {formatPoints(myMatchup.awayPoints)}
              </p>
              {myMatchup.winnerId && (
                <p className="text-xs text-[#8b8ba7] mt-1">Final</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm truncate">{myMatchup.awayTeam.teamName}</p>
              <p className="text-[#8b8ba7] text-xs">{myMatchup.awayTeam.user.displayName}</p>
            </div>
          </div>

          {/* Rosters side by side */}
          <div className="grid grid-cols-2 divide-x divide-[#2a2a3e]">
            {[myMatchup.homeTeam, myMatchup.awayTeam].map(team => (
              <div key={team.id} className="p-4">
                <p className="text-xs text-[#8b8ba7] font-medium mb-3 uppercase tracking-wider">
                  {team.teamName}
                </p>
                <div className="space-y-1.5">
                  {team.roster.filter(r => r.isStarter).map(r => (
                    <div key={r.id} className="flex items-center gap-2.5 py-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase ${getPositionBg(r.player.position)}`}>
                        {r.player.position}
                      </span>
                      <span className="text-white text-sm flex-1 truncate">
                        {r.player.firstName[0]}. {r.player.lastName}
                      </span>
                      <span className="text-[#8b8ba7] text-sm tabular-nums">
                        {formatPoints(r.player.weekStats[0]?.fantasyPoints ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
                {team.roster.filter(r => !r.isStarter).length > 0 && (
                  <>
                    <p className="text-xs text-[#4a4a6a] mt-3 mb-2 uppercase tracking-wider">Bench</p>
                    <div className="space-y-1">
                      {team.roster.filter(r => !r.isStarter).map(r => (
                        <div key={r.id} className="flex items-center gap-2.5 py-1 opacity-60">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase ${getPositionBg(r.player.position)}`}>
                            {r.player.position}
                          </span>
                          <span className="text-[#8b8ba7] text-sm flex-1 truncate">
                            {r.player.firstName[0]}. {r.player.lastName}
                          </span>
                          <span className="text-[#8b8ba7] text-sm tabular-nums">
                            {formatPoints(r.player.weekStats[0]?.fantasyPoints ?? 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-10 text-center">
          <p className="text-[#8b8ba7]">No matchup scheduled for this week yet.</p>
        </div>
      )}

      {/* Other matchups */}
      {otherMatchups.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[#8b8ba7] uppercase tracking-wider mb-3">Other Matchups</h2>
          <div className="space-y-2">
            {otherMatchups.map(m => (
              <div key={m.id} className="bg-[#161622] border border-[#2a2a3e] rounded-xl px-5 py-3 flex items-center">
                <span className="flex-1 text-white text-sm font-medium truncate">{m.homeTeam.teamName}</span>
                <span className="text-[#8b8ba7] text-sm tabular-nums px-4">
                  {formatPoints(m.homePoints)} – {formatPoints(m.awayPoints)}
                </span>
                <span className="flex-1 text-right text-white text-sm font-medium truncate">{m.awayTeam.teamName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
