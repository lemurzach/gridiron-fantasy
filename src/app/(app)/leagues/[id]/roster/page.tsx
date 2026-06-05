"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPositionBg, formatPoints } from "@/lib/utils";
import { Users, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface RosterPlayer {
  id: string; isStarter: boolean; slot: string;
  player: { id: string; firstName: string; lastName: string; position: string; status: string; teamName?: string; weekStats: { fantasyPoints: number }[] };
}

export default function RosterPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [starters, setStarters] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/leagues/${id}/roster`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRoster(data);
          setStarters(new Set(data.filter((r: RosterPlayer) => r.isStarter).map((r: RosterPlayer) => r.player.id)));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function saveLineup() {
    setSaving(true);
    const starterList = roster
      .filter(r => starters.has(r.player.id))
      .map(r => ({ playerId: r.player.id, slot: r.player.position }));
    const benchList = roster
      .filter(r => !starters.has(r.player.id))
      .map(r => r.player.id);

    const res = await fetch(`/api/leagues/${id}/roster`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starters: starterList, bench: benchList }),
    });
    setSaving(false);
    if (res.ok) toast("Lineup saved!", { type: "success" });
    else toast("Failed to save lineup", { type: "error" });
  }

  function toggle(playerId: string) {
    setStarters(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId); else next.add(playerId);
      return next;
    });
  }

  if (loading) return <div className="p-8 text-[#8b8ba7]">Loading roster...</div>;

  const starterRoster = roster.filter(r => starters.has(r.player.id));
  const benchRoster = roster.filter(r => !starters.has(r.player.id));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">My Roster</h1>
        <button onClick={saveLineup} disabled={saving}
          className="ml-auto bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
          {saving ? "Saving..." : "Save Lineup"}
        </button>
      </div>

      {roster.length === 0 ? (
        <div className="bg-[#161622] border border-dashed border-[#2a2a3e] rounded-2xl p-10 text-center">
          <p className="text-[#8b8ba7]">Your roster is empty. Add players from the Players page.</p>
        </div>
      ) : (
        <>
          <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-[#2a2a3e] flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-400" />
              <span className="text-sm font-semibold text-white">Starters ({starterRoster.length})</span>
            </div>
            {starterRoster.length === 0 && (
              <p className="text-[#8b8ba7] text-sm px-5 py-4">No starters set — click players below to start them.</p>
            )}
            {starterRoster.map(r => (
              <PlayerRow key={r.id} rp={r} isStarter onClick={() => toggle(r.player.id)} />
            ))}
          </div>

          <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2a2a3e] flex items-center gap-2">
              <XCircle size={14} className="text-[#8b8ba7]" />
              <span className="text-sm font-semibold text-white">Bench ({benchRoster.length})</span>
            </div>
            {benchRoster.map(r => (
              <PlayerRow key={r.id} rp={r} isStarter={false} onClick={() => toggle(r.player.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PlayerRow({ rp, isStarter, onClick }: { rp: RosterPlayer; isStarter: boolean; onClick: () => void }) {
  const pts = rp.player.weekStats[0]?.fantasyPoints ?? 0;
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-[#2a2a3e] last:border-0 hover:bg-[#1e1e2e] transition-colors text-left group">
      <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${getPositionBg(rp.player.position)}`}>
        {rp.player.position}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {rp.player.firstName} {rp.player.lastName}
        </p>
        {rp.player.teamName && <p className="text-[#8b8ba7] text-xs">{rp.player.teamName}</p>}
      </div>
      <span className={`text-sm font-semibold tabular-nums ${pts > 0 ? "text-[#7c3aed]" : "text-[#8b8ba7]"}`}>
        {formatPoints(pts)}
      </span>
      <span className={`text-xs ml-2 ${isStarter ? "text-green-400" : "text-[#4a4a6a] group-hover:text-[#8b8ba7]"}`}>
        {isStarter ? "Starter" : "→ Start"}
      </span>
    </button>
  );
}
