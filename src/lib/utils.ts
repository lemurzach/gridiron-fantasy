import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calcFantasyPoints(stats: {
  passYds?: number; passTDs?: number; passInts?: number;
  rushYds?: number; rushTDs?: number;
  recYds?: number; recTDs?: number; receptions?: number;
  fumbles?: number; twoPointConversions?: number;
}, scoring: {
  scoringPassYds: number; scoringPassTD: number; scoringPassInt: number;
  scoringRushYds: number; scoringRushTD: number;
  scoringRecYds: number; scoringRecTD: number; scoringReception: number;
  scoringFumble: number; scoring2pt: number;
}): number {
  return (
    (stats.passYds ?? 0) * scoring.scoringPassYds +
    (stats.passTDs ?? 0) * scoring.scoringPassTD +
    (stats.passInts ?? 0) * scoring.scoringPassInt +
    (stats.rushYds ?? 0) * scoring.scoringRushYds +
    (stats.rushTDs ?? 0) * scoring.scoringRushTD +
    (stats.recYds ?? 0) * scoring.scoringRecYds +
    (stats.recTDs ?? 0) * scoring.scoringRecTD +
    (stats.receptions ?? 0) * scoring.scoringReception +
    (stats.fumbles ?? 0) * scoring.scoringFumble +
    (stats.twoPointConversions ?? 0) * scoring.scoring2pt
  );
}

export function getPositionColor(position: string): string {
  const map: Record<string, string> = {
    QB: "text-red-400",
    RB: "text-green-400",
    WR: "text-blue-400",
    TE: "text-yellow-400",
    K: "text-gray-400",
    DEF: "text-purple-400",
    FLEX: "text-orange-400",
  };
  return map[position] ?? "text-gray-400";
}

export function getPositionBg(position: string): string {
  const map: Record<string, string> = {
    QB: "bg-red-500/20 text-red-300",
    RB: "bg-green-500/20 text-green-300",
    WR: "bg-blue-500/20 text-blue-300",
    TE: "bg-yellow-500/20 text-yellow-300",
    K: "bg-gray-500/20 text-gray-300",
    DEF: "bg-purple-500/20 text-purple-300",
    FLEX: "bg-orange-500/20 text-orange-300",
  };
  return map[position] ?? "bg-gray-500/20 text-gray-300";
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "text-green-400",
    injured: "text-red-400",
    suspended: "text-yellow-400",
    inactive: "text-gray-500",
  };
  return map[status] ?? "text-gray-400";
}

export function getRecordStr(wins: number, losses: number, ties: number): string {
  if (ties > 0) return `${wins}-${losses}-${ties}`;
  return `${wins}-${losses}`;
}

export function formatPoints(pts: number): string {
  return pts.toFixed(2);
}

export function snakeDraftOrder(
  members: string[],
  totalRounds: number
): { memberId: string; round: number; pick: number }[] {
  const picks: { memberId: string; round: number; pick: number }[] = [];
  let pickNum = 1;
  for (let round = 1; round <= totalRounds; round++) {
    const order = round % 2 === 1 ? members : [...members].reverse();
    for (const memberId of order) {
      picks.push({ memberId, round, pick: pickNum++ });
    }
  }
  return picks;
}
