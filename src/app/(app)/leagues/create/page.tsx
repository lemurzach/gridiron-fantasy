"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { Trophy, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CreateLeaguePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    description: "",
    season: new Date().getFullYear(),
    teamName: "",
    maxRosters: 10,
    waiverType: "rolling",
    scoringReception: 1,
    rosterQB: 1, rosterRB: 2, rosterWR: 2, rosterTE: 1, rosterFLEX: 1, rosterK: 1, rosterBench: 6,
    playoffTeams: 4,
  });

  const set = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) { toast("Failed to create league", { type: "error" }); return; }
    const league = await res.json();
    toast(`${league.name} created!`, { type: "success" });
    router.push(`/leagues/${league.id}/settings`);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard" className="flex items-center gap-2 text-[#8b8ba7] hover:text-white text-sm mb-6 transition-colors">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center">
          <Trophy size={20} className="text-[#7c3aed]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Create a League</h1>
          <p className="text-[#8b8ba7] text-sm">Step {step} of 2</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#2a2a3e] rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-[#7c3aed] rounded-full transition-all" style={{ width: `${(step / 2) * 100}%` }} />
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-semibold">League Details</h2>
            <div>
              <label className="block text-sm text-[#8b8ba7] mb-1.5">League Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} required placeholder="Monday Night Warriors"
                className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed]" />
            </div>
            <div>
              <label className="block text-sm text-[#8b8ba7] mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} placeholder="Our local league..."
                className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed] resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#8b8ba7] mb-1.5">Season Year *</label>
                <input type="number" value={form.season} onChange={e => set("season", Number(e.target.value))} min={2020} max={2100}
                  className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]" />
              </div>
              <div>
                <label className="block text-sm text-[#8b8ba7] mb-1.5">Max Teams</label>
                <select value={form.maxRosters} onChange={e => set("maxRosters", Number(e.target.value))}
                  className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]">
                  {[4,6,8,10,12,14,16].map(n => <option key={n} value={n}>{n} teams</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#8b8ba7] mb-1.5">Your Team Name *</label>
              <input value={form.teamName} onChange={e => set("teamName", e.target.value)} required placeholder="My Dream Team"
                className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed]" />
            </div>
            <button type="button" onClick={() => setStep(2)} disabled={!form.name || !form.teamName}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm mt-2 transition-colors">
              Next: Scoring & Roster →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-semibold">Scoring & Roster</h2>

            <div>
              <label className="block text-sm text-[#8b8ba7] mb-2">Scoring Format</label>
              <div className="grid grid-cols-3 gap-2">
                {[["standard","Standard",0],["half","Half PPR",0.5],["ppr","Full PPR",1]].map(([id,label,val]) => (
                  <button key={id} type="button" onClick={() => set("scoringReception", val)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.scoringReception === val ? "bg-[#7c3aed] border-[#7c3aed] text-white" : "border-[#2a2a3e] text-[#8b8ba7] hover:border-[#7c3aed]/50"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#8b8ba7] mb-3">Starting Roster</label>
              <div className="grid grid-cols-3 gap-3">
                {[["QB","rosterQB",1,3],["RB","rosterRB",1,6],["WR","rosterWR",1,6],["TE","rosterTE",0,4],["FLEX","rosterFLEX",0,4],["K","rosterK",0,2],["Bench","rosterBench",2,12]].map(([label, key, min, max]) => (
                  <div key={key as string}>
                    <label className="text-xs text-[#8b8ba7] mb-1 block">{label}</label>
                    <input type="number" min={min as number} max={max as number} value={form[key as keyof typeof form] as number}
                      onChange={e => set(key as string, Number(e.target.value))}
                      className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-[#7c3aed]" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#8b8ba7] mb-2">Waiver System</label>
              <select value={form.waiverType} onChange={e => set("waiverType", e.target.value)}
                className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]">
                <option value="rolling">Rolling Waivers</option>
                <option value="reverse_standings">Reverse Standings</option>
                <option value="faab">FAAB Bidding</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#8b8ba7] mb-2">Playoff Teams</label>
              <select value={form.playoffTeams} onChange={e => set("playoffTeams", Number(e.target.value))}
                className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]">
                {[2,4,6,8].map(n => <option key={n} value={n}>{n} teams</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 border border-[#2a2a3e] text-[#8b8ba7] hover:text-white rounded-lg py-2.5 text-sm transition-colors">
                ← Back
              </button>
              <button type="submit" disabled={loading}
                className="flex-2 flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors">
                {loading ? "Creating..." : "Create League 🎉"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
