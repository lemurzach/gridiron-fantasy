"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPositionBg, formatPoints } from "@/lib/utils";
import { Search, UserPlus, UserMinus, ListOrdered } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";

interface Player {
  id: string; firstName: string; lastName: string; position: string; status: string; teamName?: string;
  weekStats: { fantasyPoints: number }[];
  rosterSlots: { leagueMember: { teamName: string; user: { displayName: string } } }[];
}

export default function PlayersPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState<Player | null>(null);
  const [dropPlayerId, setDropPlayerId] = useState("");
  const [myRoster, setMyRoster] = useState<{ player: Player }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/leagues/${id}/players`).then(r => r.json()),
      fetch(`/api/leagues/${id}/roster`).then(r => r.json()),
    ]).then(([p, r]) => {
      if (Array.isArray(p)) setPlayers(p);
      if (Array.isArray(r)) setMyRoster(r);
    }).finally(() => setLoading(false));
  }, [id]);

  const positions = ["ALL", "QB", "RB", "WR", "TE", "K"];
  const filtered = players.filter(p => {
    const matchPos = filter === "ALL" || p.position === filter;
    const matchSearch = search === "" || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
    return matchPos && matchSearch;
  });

  async function addPlayer() {
    if (!addModal) return;
    const res = await fetch(`/api/leagues/${id}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addPlayerId: addModal.id, dropPlayerId: dropPlayerId || undefined }),
    });
    if (res.ok) {
      toast(`${addModal.firstName} ${addModal.lastName} added!`, { type: "success" });
      setAddModal(null);
      setDropPlayerId("");
      // Refresh
      const [p, r] = await Promise.all([
        fetch(`/api/leagues/${id}/players`).then(r2 => r2.json()),
        fetch(`/api/leagues/${id}/roster`).then(r2 => r2.json()),
      ]);
      if (Array.isArray(p)) setPlayers(p);
      if (Array.isArray(r)) setMyRoster(r);
    } else {
      const d = await res.json();
      toast(d.error ?? "Failed to add player", { type: "error" });
    }
  }

  if (loading) return <div className="p-8 text-[#8b8ba7]">Loading players...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <ListOrdered size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">Players</h1>
        <span className="text-xs text-[#8b8ba7] ml-2">{players.length} total</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a6a]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players..."
            className="w-full bg-[#161622] border border-[#2a2a3e] rounded-lg pl-9 pr-4 py-2 text-white text-sm placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed]" />
        </div>
        <div className="flex gap-1">
          {positions.map(pos => (
            <button key={pos} onClick={() => setFilter(pos)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === pos ? "bg-[#7c3aed] text-white" : "bg-[#161622] border border-[#2a2a3e] text-[#8b8ba7] hover:text-white"}`}>
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Player list */}
      <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-2.5 border-b border-[#2a2a3e] text-xs text-[#8b8ba7] uppercase tracking-wider">
          <span className="col-span-5">Player</span>
          <span className="col-span-3">Team</span>
          <span className="col-span-2 text-center">Pts</span>
          <span className="col-span-2 text-center">Status</span>
        </div>
        {filtered.length === 0 && (
          <p className="text-[#8b8ba7] text-sm px-5 py-6 text-center">No players found.</p>
        )}
        {filtered.map(p => {
          const owner = p.rosterSlots[0]?.leagueMember;
          const onMyRoster = myRoster.some(r => r.player.id === p.id);
          const pts = p.weekStats[0]?.fantasyPoints ?? 0;
          return (
            <div key={p.id}
              className="grid grid-cols-12 items-center px-5 py-3 border-b border-[#2a2a3e] last:border-0 hover:bg-[#1e1e2e] transition-colors">
              <div className="col-span-5 flex items-center gap-3">
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${getPositionBg(p.position)}`}>{p.position}</span>
                <span className="text-white text-sm font-medium truncate">{p.firstName} {p.lastName}</span>
              </div>
              <span className="col-span-3 text-[#8b8ba7] text-xs truncate">{p.teamName ?? "—"}</span>
              <span className="col-span-2 text-center text-sm text-white tabular-nums">{formatPoints(pts)}</span>
              <div className="col-span-2 flex justify-center">
                {owner ? (
                  <span className="text-xs text-[#8b8ba7] truncate text-center">{owner.teamName}</span>
                ) : (
                  <button onClick={() => { if (!onMyRoster) setAddModal(p); }}
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 font-medium transition-colors">
                    <UserPlus size={12} /> Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Player Modal */}
      <Modal open={!!addModal} onClose={() => { setAddModal(null); setDropPlayerId(""); }}
        title={`Add ${addModal?.firstName} ${addModal?.lastName}`}>
        <div className="space-y-4">
          <p className="text-[#8b8ba7] text-sm">Add this player to your roster.</p>
          {myRoster.length > 0 && (
            <div>
              <label className="block text-sm text-[#8b8ba7] mb-1.5">Drop a player (optional)</label>
              <select value={dropPlayerId} onChange={e => setDropPlayerId(e.target.value)}
                className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]">
                <option value="">— No drop —</option>
                {myRoster.map(r => (
                  <option key={r.player.id} value={r.player.id}>
                    {r.player.firstName} {r.player.lastName} ({r.player.position})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddModal(null)}
              className="flex-1 border border-[#2a2a3e] text-[#8b8ba7] hover:text-white rounded-lg py-2 text-sm transition-colors">
              Cancel
            </button>
            <button onClick={addPlayer}
              className="flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg py-2 text-sm transition-colors">
              Confirm Add
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
