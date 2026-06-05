import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { formatPoints } from "@/lib/utils";

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return null;
  const { id } = await params;

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) notFound();

  const schedules = await prisma.seasonSchedule.findMany({
    where: { leagueId: id },
    include: {
      matchups: {
        include: {
          homeTeam: { include: { user: true } },
          awayTeam: { include: { user: true } },
        },
      },
    },
    orderBy: { week: "asc" },
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Calendar size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">Full Schedule</h1>
      </div>

      <div className="space-y-4">
        {schedules.map(s => {
          const isCurrent = s.week === league.currentWeek;
          const isPlayoff = s.week >= league.playoffStartWeek;
          return (
            <div key={s.id}
              className={`bg-[#161622] border rounded-2xl overflow-hidden ${isCurrent ? "border-[#7c3aed]/50" : "border-[#2a2a3e]"}`}>
              <div className={`px-5 py-3 border-b border-[#2a2a3e] flex items-center justify-between ${isCurrent ? "bg-[#7c3aed]/10" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">Week {s.week}</span>
                  {isPlayoff && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full font-medium">Playoffs</span>}
                  {isCurrent && <span className="text-xs bg-[#7c3aed]/20 text-[#a78bfa] px-2 py-0.5 rounded-full font-medium">Current</span>}
                </div>
                <span className="flex items-center gap-1.5 text-xs text-[#8b8ba7]">
                  {s.status === "complete" ? <><CheckCircle size={12} className="text-green-400" /> Complete</> :
                    s.status === "in_progress" ? <><Clock size={12} className="text-yellow-400" /> In Progress</> :
                    "Upcoming"}
                </span>
              </div>
              {s.matchups.length === 0 ? (
                <p className="text-[#8b8ba7] text-xs px-5 py-4">No matchups scheduled.</p>
              ) : (
                <div>
                  {s.matchups.map(m => (
                    <div key={m.id} className="flex items-center px-5 py-3 border-b border-[#2a2a3e] last:border-0">
                      <span className={`flex-1 text-sm font-medium ${m.winnerId === m.homeTeamId ? "text-white" : m.winnerId ? "text-[#8b8ba7]" : "text-white"}`}>
                        {m.homeTeam.teamName}
                      </span>
                      <div className="text-center px-6">
                        {s.status === "complete" || m.homePoints > 0 || m.awayPoints > 0 ? (
                          <span className="text-white text-sm tabular-nums font-semibold">
                            {formatPoints(m.homePoints)} – {formatPoints(m.awayPoints)}
                          </span>
                        ) : (
                          <span className="text-[#4a4a6a] text-xs">vs</span>
                        )}
                      </div>
                      <span className={`flex-1 text-right text-sm font-medium ${m.winnerId === m.awayTeamId ? "text-white" : m.winnerId ? "text-[#8b8ba7]" : "text-white"}`}>
                        {m.awayTeam.teamName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
