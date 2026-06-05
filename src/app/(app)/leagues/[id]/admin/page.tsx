"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shield, Plus, Trash2, CheckCircle2, Calendar, Users } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";

interface Player { id: string; firstName: string; lastName: string; position: string; teamName?: string; jerseyNumber?: number }
interface Member { id: string; teamName: string; user: { displayName: string }; wins: number; losses: number }
interface League { id: string; currentWeek: number; regularSeasonWeeks: number }

export default function AdminPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [tab, setTab] = useState<"players"|"stats"|"schedule"|"roster">("players");
  const [addPlayerModal, setAddPlayerModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ firstName: "", lastName: "", position: "QB", teamName: "", jerseyNumber: "" });
  const [statWeek, setStatWeek] = useState(1);
  const [statEntry, setStatEntry] = useState<Record<string, Partial<{ passYds: number; passTDs: number; passInts: number; rushYds: number; rushTDs: number; recYds: number; recTDs: number; receptions: number; fumbles: number }>>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/leagues/${id}/players`).then(r => r.json()),
      fetch(`/api/leagues/${id}/members`).then(r => r.json()),
      fetch(`/api/leagues/${id}`).then(r => r.json()),
    ]).then(([p, m, l]) => {
      if (Array.isArray(p)) setPlayers(p);
      if (Array.isArray(m)) setMembers(m);
      if (l?.id) { setLeague(l); setStatWeek(l.currentWeek); }
    });
  }, [id]);

  async function addPlayer() {
    const res = await fetch(`/api/leagues/${id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newPlayer, jerseyNumber: newPlayer.jerseyNumber ? Number(newPlayer.jerseyNumber) : null }),
    });
    if (res.ok) {
      const p = await res.json();
      setPlayers(prev => [...prev, p]);
      setAddPlayerModal(false);
      setNewPlayer({ firstName: "", lastName: "", position: "QB", teamName: "", jerseyNumber: "" });
      toast("Player added!", { type: "success" });
    } else toast("Failed to add player", { type: "error" });
  }

  async function deletePlayer(playerId: string) {
    const res = await fetch(`/api/leagues/${id}/players`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    if (res.ok) { setPlayers(prev => prev.filter(p => p.id !== playerId)); toast("Player removed", { type: "success" }); }
    else toast("Failed to remove player", { type: "error" });
  }

  async function submitStats() {
    const playerStats = Object.entries(statEntry).map(([playerId, stats]) => ({ playerId, ...stats }));
    if (playerStats.length === 0) { toast("No stats entered", { type: "error" }); return; }
    const res = await fetch(`/api/leagues/${id}/stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week: statWeek, playerStats }),
    });
    if (res.ok) { toast(`Week ${statWeek} stats saved!`, { type: "success" }); setStatEntry({}); }
    else toast("Failed to save stats", { type: "error" });
  }

  async function finalizeWeek() {
    const res = await fetch(`/api/leagues/${id}/stats`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week: statWeek }),
    });
    if (res.ok) { toast(`Week ${statWeek} finalized!`, { type: "success" }); }
    else toast("Failed to finalize week", { type: "error" });
  }

  async function generateSchedule() {
    const res = await fetch(`/api/leagues/${id}/schedule`, { method: "POST" });
    if (res.ok) toast("Schedule generated!", { type: "success" });
    else toast("Failed to generate schedule", { type: "error" });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">Commissioner Tools</h1>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-[#161622] border border-[#2a2a3e] rounded-xl p-1">
        {(["players","stats","schedule","roster"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors capitalize ${tab === t ? "bg-[#7c3aed] text-white" : "text-[#8b8ba7] hover:text-white"}`}>
            {t === "players" ? "Manage Players" : t === "stats" ? "Enter Stats" : t === "schedule" ? "Schedule" : "Rosters"}
          </button>
        ))}
      </div>

      {/* Manage Players */}
      {tab === "players" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#8b8ba7] text-sm">{players.length} players in league</p>
            <button onClick={() => setAddPlayerModal(true)}
              className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
              <Plus size={14} /> Add Player
            </button>
          </div>
          <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden">
            {players.length === 0 && (
              <p className="text-[#8b8ba7] text-sm px-5 py-6 text-center">No players yet. Add players to get started.</p>
            )}
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#2a2a3e] last:border-0 hover:bg-[#1e1e2e]">
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase ${p.position === "QB" ? "bg-red-500/20 text-red-300" : p.position === "RB" ? "bg-green-500/20 text-green-300" : p.position === "WR" ? "bg-blue-500/20 text-blue-300" : p.position === "TE" ? "bg-yellow-500/20 text-yellow-300" : "bg-gray-500/20 text-gray-300"}`}>
                  {p.position}
                </span>
                <span className="text-white text-sm font-medium flex-1">{p.firstName} {p.lastName}</span>
                {p.jerseyNumber && <span className="text-[#8b8ba7] text-xs">#{p.jerseyNumber}</span>}
                {p.teamName && <span className="text-[#8b8ba7] text-xs">{p.teamName}</span>}
                <button onClick={() => deletePlayer(p.id)}
                  className="text-[#8b8ba7] hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enter Stats */}
      {tab === "stats" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-[#8b8ba7]">Week:</label>
            <select value={statWeek} onChange={e => setStatWeek(Number(e.target.value))}
              className="bg-[#161622] border border-[#2a2a3e] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]">
              {Array.from({ length: league?.regularSeasonWeeks ?? 13 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
            <button onClick={submitStats}
              className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
              <CheckCircle2 size={14} /> Save Stats
            </button>
            <button onClick={finalizeWeek}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
              Finalize Week
            </button>
          </div>

          <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a3e]">
                  <th className="text-left px-4 py-3 text-[#8b8ba7] font-medium text-xs uppercase">Player</th>
                  {["Pass Yds","Pass TDs","INTs","Rush Yds","Rush TDs","Rec Yds","Rec TDs","Rec","Fumbles"].map(h => (
                    <th key={h} className="text-center px-2 py-3 text-[#8b8ba7] font-medium text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map(p => {
                  const s = statEntry[p.id] ?? {};
                  const upd = (key: string, val: string) => setStatEntry(prev => ({ ...prev, [p.id]: { ...prev[p.id], [key]: val === "" ? undefined : Number(val) } }));
                  const qbFields = p.position === "QB";
                  return (
                    <tr key={p.id} className="border-b border-[#2a2a3e] last:border-0 hover:bg-[#1e1e2e]">
                      <td className="px-4 py-2.5 text-white whitespace-nowrap">{p.firstName} {p.lastName} <span className="text-[#8b8ba7] text-xs ml-1">({p.position})</span></td>
                      {[
                        ["passYds", qbFields], ["passTDs", qbFields], ["passInts", qbFields],
                        ["rushYds", true], ["rushTDs", true],
                        ["recYds", p.position !== "QB"], ["recTDs", p.position !== "QB"], ["receptions", p.position !== "QB"],
                        ["fumbles", true],
                      ].map(([field, show]) => (
                        <td key={field as string} className="px-2 py-2.5 text-center">
                          {show ? (
                            <input type="number" value={(s[field as keyof typeof s] as number) ?? ""} onChange={e => upd(field as string, e.target.value)}
                              placeholder="0" min={0}
                              className="w-14 bg-[#0d0d14] border border-[#2a2a3e] rounded px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-[#7c3aed]" />
                          ) : <span className="text-[#4a4a6a]">—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule */}
      {tab === "schedule" && (
        <div>
          <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-2">Generate Round-Robin Schedule</h3>
            <p className="text-[#8b8ba7] text-sm mb-4">Automatically creates matchups for all regular season weeks based on current league members.</p>
            <button onClick={generateSchedule}
              className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors">
              <Calendar size={14} /> Generate Schedule
            </button>
          </div>
        </div>
      )}

      {/* Rosters overview */}
      {tab === "roster" && (
        <div className="grid gap-3">
          {members.map(m => (
            <div key={m.id} className="bg-[#161622] border border-[#2a2a3e] rounded-xl px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#7c3aed]/20 flex items-center justify-center text-xs font-bold text-[#7c3aed]">
                {m.user.displayName[0]}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{m.teamName}</p>
                <p className="text-[#8b8ba7] text-xs">{m.user.displayName} · {m.wins}-{m.losses}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Player Modal */}
      <Modal open={addPlayerModal} onClose={() => setAddPlayerModal(false)} title="Add Player">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[["First Name","firstName"],["Last Name","lastName"]].map(([label,key]) => (
              <div key={key}>
                <label className="text-sm text-[#8b8ba7] mb-1.5 block">{label}</label>
                <input value={newPlayer[key as keyof typeof newPlayer]} onChange={e => setNewPlayer(f => ({ ...f, [key]: e.target.value }))} required
                  className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[#8b8ba7] mb-1.5 block">Position</label>
              <select value={newPlayer.position} onChange={e => setNewPlayer(f => ({ ...f, position: e.target.value }))}
                className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]">
                {["QB","RB","WR","TE","K"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-[#8b8ba7] mb-1.5 block">Jersey #</label>
              <input type="number" value={newPlayer.jerseyNumber} onChange={e => setNewPlayer(f => ({ ...f, jerseyNumber: e.target.value }))}
                className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]" />
            </div>
          </div>
          <div>
            <label className="text-sm text-[#8b8ba7] mb-1.5 block">Real-World Team</label>
            <input value={newPlayer.teamName} onChange={e => setNewPlayer(f => ({ ...f, teamName: e.target.value }))} placeholder="Eagles, Raiders, etc."
              className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed]" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddPlayerModal(false)}
              className="flex-1 border border-[#2a2a3e] text-[#8b8ba7] hover:text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
            <button onClick={addPlayer} disabled={!newPlayer.firstName || !newPlayer.lastName}
              className="flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
              Add Player
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
