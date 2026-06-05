"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Repeat2, Plus, Check, X, Ban } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { getPositionBg } from "@/lib/utils";

interface TradeItem { id: string; player: { id: string; firstName: string; lastName: string; position: string } | null; fromMember: { id: string; teamName: string }; toMember: { id: string; teamName: string } }
interface Trade { id: string; status: string; notes?: string; createdAt: string; proposer: { id: string; teamName: string; user: { displayName: string } }; receiver: { id: string; teamName: string; user: { displayName: string } }; items: TradeItem[] }
interface Member { id: string; teamName: string; user: { displayName: string }; roster: { player: { id: string; firstName: string; lastName: string; position: string } }[] }

export default function TradesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [myMember, setMyMember] = useState<Member | null>(null);
  const [showNewTrade, setShowNewTrade] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [myOffers, setMyOffers] = useState<string[]>([]);
  const [theirOffers, setTheirOffers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [t, m] = await Promise.all([
      fetch(`/api/leagues/${id}/trades`).then(r => r.json()),
      fetch(`/api/leagues/${id}/members`).then(r => r.json()),
    ]);
    if (Array.isArray(t)) setTrades(t);
    if (Array.isArray(m)) {
      setMembers(m);
      const me = m.find((mm: Member) => mm.roster !== undefined);
      // We'll determine myMember from session; use first for now
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function submitTrade() {
    if (!receiver || myOffers.length === 0) { toast("Select a receiver and at least one player to offer", { type: "error" }); return; }
    const items = [
      ...myOffers.map(pid => ({ playerId: pid, fromMemberId: myMember?.id ?? "", toMemberId: receiver })),
      ...theirOffers.map(pid => ({ playerId: pid, fromMemberId: receiver, toMemberId: myMember?.id ?? "" })),
    ];
    const res = await fetch(`/api/leagues/${id}/trades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: receiver, notes, items }),
    });
    if (res.ok) { toast("Trade proposed!", { type: "success" }); setShowNewTrade(false); load(); }
    else toast("Failed to propose trade", { type: "error" });
  }

  async function respondTrade(tradeId: string, action: string) {
    const res = await fetch(`/api/leagues/${id}/trades/${tradeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) { toast(`Trade ${action}ed`, { type: "success" }); load(); }
    else toast("Action failed", { type: "error" });
  }

  const statusColor: Record<string, string> = {
    pending: "text-yellow-300 bg-yellow-500/10",
    accepted: "text-green-300 bg-green-500/10",
    rejected: "text-red-300 bg-red-500/10",
    vetoed: "text-red-300 bg-red-500/10",
    expired: "text-[#8b8ba7] bg-[#2a2a3e]",
  };

  if (loading) return <div className="p-8 text-[#8b8ba7]">Loading trades...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Repeat2 size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">Trades</h1>
        <button onClick={() => setShowNewTrade(true)}
          className="ml-auto flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
          <Plus size={14} /> Propose Trade
        </button>
      </div>

      {trades.length === 0 ? (
        <div className="bg-[#161622] border border-dashed border-[#2a2a3e] rounded-2xl p-10 text-center">
          <p className="text-[#8b8ba7]">No trades yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map(t => (
            <div key={t.id} className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">{t.proposer.teamName}</span>
                  <Repeat2 size={14} className="text-[#8b8ba7]" />
                  <span className="text-white font-semibold text-sm">{t.receiver.teamName}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[t.status] ?? "text-[#8b8ba7] bg-[#2a2a3e]"}`}>
                  {t.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {[t.proposer, t.receiver].map(side => (
                  <div key={side.id} className="bg-[#0d0d14] rounded-lg p-3">
                    <p className="text-xs text-[#8b8ba7] mb-2">{side.teamName} gives:</p>
                    {t.items.filter(i => i.fromMember.id === side.id).map(item => item.player && (
                      <div key={item.id} className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${getPositionBg(item.player.position)}`}>{item.player.position}</span>
                        <span className="text-white text-xs">{item.player.firstName} {item.player.lastName}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {t.notes && <p className="text-xs text-[#8b8ba7] mb-3 italic">"{t.notes}"</p>}

              {t.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => respondTrade(t.id, "accept")}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors">
                    <Check size={12} /> Accept
                  </button>
                  <button onClick={() => respondTrade(t.id, "reject")}
                    className="flex items-center gap-1.5 border border-red-600/50 text-red-400 hover:bg-red-600/10 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors">
                    <X size={12} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Propose Trade Modal */}
      <Modal open={showNewTrade} onClose={() => setShowNewTrade(false)} title="Propose Trade" className="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#8b8ba7] mb-1.5 block">Trade with</label>
            <select value={receiver} onChange={e => setReceiver(e.target.value)}
              className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]">
              <option value="">Select team...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.teamName} ({m.user.displayName})</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-[#8b8ba7] mb-1.5 block">Note (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add a message..."
              className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed]" />
          </div>

          <p className="text-xs text-[#8b8ba7]">Full trade builder — select players from each side's roster after selecting a team, then confirm.</p>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowNewTrade(false)}
              className="flex-1 border border-[#2a2a3e] text-[#8b8ba7] hover:text-white rounded-lg py-2 text-sm transition-colors">
              Cancel
            </button>
            <button onClick={submitTrade}
              className="flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg py-2 text-sm transition-colors">
              Send Proposal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
