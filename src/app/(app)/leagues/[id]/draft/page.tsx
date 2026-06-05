"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ClipboardList, Play, ChevronRight, Clock } from "lucide-react";
import { getPositionBg, formatPoints } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";

interface DraftPick {
  id: string; round: number; pickNumber: number; pickedAt?: string; isAutoPick: boolean;
  player?: { id: string; firstName: string; lastName: string; position: string };
  leagueMember: { id: string; teamName: string; user: { displayName: string } };
}
interface Draft {
  id: string; type: string; status: string; currentPick: number; totalPicks: number; pickTimer: number;
  draftOrder: string; picks: DraftPick[];
}
interface Player { id: string; firstName: string; lastName: string; position: string; teamName?: string }

export default function DraftPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [myMemberId, setMyMemberId] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  async function load() {
    const [draftRes, leagueRes, playersRes] = await Promise.all([
      fetch(`/api/leagues/${id}/draft`),
      fetch(`/api/leagues/${id}`),
      fetch(`/api/leagues/${id}/players`),
    ]);
    const [draftData, leagueData, playersData] = await Promise.all([
      draftRes.json(), leagueRes.json(), playersRes.json()
    ]);
    if (draftData) setDraft(draftData);
    if (leagueData?.myMemberId) setMyMemberId(leagueData.myMemberId);
    if (leagueData?.myRole === "commissioner") setIsCommissioner(true);
    if (Array.isArray(playersData)) setPlayers(playersData);
    setLoading(false);
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  // Pick timer
  useEffect(() => {
    if (draft?.status !== "in_progress") return;
    setTimeLeft(draft.pickTimer);
    timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [draft?.currentPick, draft?.status]);

  async function startDraft() {
    const res = await fetch(`/api/leagues/${id}/draft/start`, { method: "POST" });
    if (res.ok) { toast("Draft started!", { type: "success" }); load(); }
    else toast("Failed to start draft", { type: "error" });
  }

  async function makePick(playerId: string) {
    if (!draft) return;
    const res = await fetch(`/api/leagues/${id}/draft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId: draft.id, playerId }),
    });
    if (res.ok) load();
    else { const d = await res.json(); toast(d.error ?? "Pick failed", { type: "error" }); }
  }

  const draftedIds = new Set(draft?.picks.filter(p => p.player).map(p => p.player!.id));
  const availablePlayers = players.filter(p => !draftedIds.has(p.id));
  const filteredPlayers = availablePlayers.filter(p => {
    const pos = posFilter === "ALL" || p.position === posFilter;
    const s = search === "" || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
    return pos && s;
  });

  const currentPick = draft?.picks.find(p => !p.player);
  const isMyTurn = currentPick?.leagueMember.id === myMemberId;

  if (loading) return <div className="p-8 text-[#8b8ba7]">Loading draft...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">Draft Room</h1>
        {draft && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ml-2 ${
            draft.status === "in_progress" ? "bg-green-500/20 text-green-300" :
            draft.status === "complete" ? "bg-blue-500/20 text-blue-300" :
            "bg-yellow-500/20 text-yellow-300"
          }`}>
            {draft.status.replace("_", " ")}
          </span>
        )}
        {draft?.status === "in_progress" && (
          <div className="ml-auto flex items-center gap-2 bg-[#1e1e2e] border border-[#2a2a3e] rounded-lg px-3 py-1.5">
            <Clock size={14} className={timeLeft < 15 ? "text-red-400" : "text-[#8b8ba7]"} />
            <span className={`text-sm font-mono font-bold ${timeLeft < 15 ? "text-red-400" : "text-white"}`}>{timeLeft}s</span>
          </div>
        )}
      </div>

      {!draft && isCommissioner && (
        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-8 text-center mb-6">
          <p className="text-[#8b8ba7] mb-4">No draft created yet. Create one to get started.</p>
          <button onClick={async () => {
            const res = await fetch(`/api/leagues/${id}/draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "snake", pickTimer: 90 }) });
            if (res.ok) { toast("Draft created!", { type: "success" }); load(); }
          }} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors">
            Create Snake Draft
          </button>
        </div>
      )}

      {draft?.status === "pre_draft" && isCommissioner && (
        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">{draft.type.charAt(0).toUpperCase() + draft.type.slice(1)} Draft</p>
            <p className="text-[#8b8ba7] text-sm">{draft.totalPicks} total picks · {draft.pickTimer}s per pick</p>
          </div>
          <button onClick={startDraft}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors">
            <Play size={14} /> Start Draft
          </button>
        </div>
      )}

      {draft?.status === "in_progress" && (
        <div className={`rounded-2xl p-4 mb-6 ${isMyTurn ? "bg-[#7c3aed]/15 border border-[#7c3aed]/40" : "bg-[#161622] border border-[#2a2a3e]"}`}>
          <p className="text-white font-semibold text-sm">
            {isMyTurn ? "🏈 It's your turn to pick!" : `On the clock: ${currentPick?.leagueMember.teamName}`}
          </p>
          <p className="text-[#8b8ba7] text-xs mt-0.5">
            Pick {(draft.currentPick) + 1} of {draft.totalPicks} · Round {currentPick?.round}
          </p>
        </div>
      )}

      <div className="grid grid-cols-5 gap-5">
        {/* Available players */}
        <div className="col-span-3">
          <h2 className="text-sm font-semibold text-white mb-3">
            Available Players ({availablePlayers.length})
          </h2>
          <div className="flex gap-2 mb-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="flex-1 bg-[#161622] border border-[#2a2a3e] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed]" />
            <div className="flex gap-1">
              {["ALL","QB","RB","WR","TE","K"].map(pos => (
                <button key={pos} onClick={() => setPosFilter(pos)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${posFilter === pos ? "bg-[#7c3aed] text-white" : "bg-[#161622] border border-[#2a2a3e] text-[#8b8ba7]"}`}>
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#161622] border border-[#2a2a3e] rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
            {filteredPlayers.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a3e] last:border-0 hover:bg-[#1e1e2e] transition-colors">
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${getPositionBg(p.position)}`}>{p.position}</span>
                <span className="text-white text-sm flex-1">{p.firstName} {p.lastName}</span>
                {p.teamName && <span className="text-[#8b8ba7] text-xs">{p.teamName}</span>}
                {(draft?.status === "in_progress" && isMyTurn) && (
                  <button onClick={() => makePick(p.id)}
                    className="text-xs bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-3 py-1 rounded-lg transition-colors font-medium shrink-0">
                    Draft
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Draft board */}
        <div className="col-span-2">
          <h2 className="text-sm font-semibold text-white mb-3">Draft Board</h2>
          <div className="bg-[#161622] border border-[#2a2a3e] rounded-xl overflow-hidden max-h-[560px] overflow-y-auto">
            {draft?.picks.filter(p => p.player).slice(-20).reverse().map(pick => (
              <div key={pick.id} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[#2a2a3e] last:border-0">
                <span className="text-xs text-[#8b8ba7] w-8 shrink-0">
                  {pick.round}.{pick.pickNumber % (draft?.picks.filter(p => p.leagueMember.id === pick.leagueMember.id).length || 1) + 1}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${getPositionBg(pick.player!.position)}`}>
                  {pick.player!.position}
                </span>
                <span className="text-white text-xs flex-1 truncate">{pick.player!.firstName} {pick.player!.lastName}</span>
                <span className="text-[#8b8ba7] text-xs shrink-0 truncate">{pick.leagueMember.teamName}</span>
              </div>
            ))}
            {(!draft || draft.picks.filter(p => p.player).length === 0) && (
              <p className="text-[#8b8ba7] text-sm px-4 py-6 text-center">No picks yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
