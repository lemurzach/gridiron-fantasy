"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Settings, Copy, Check } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface League {
  id: string; name: string; description?: string; inviteCode: string; status: string;
  maxRosters: number; currentWeek: number; season: number;
  rosterQB: number; rosterRB: number; rosterWR: number; rosterTE: number; rosterFLEX: number; rosterK: number; rosterBench: number; rosterIR: number;
  scoringPassYds: number; scoringPassTD: number; scoringPassInt: number;
  scoringRushYds: number; scoringRushTD: number;
  scoringRecYds: number; scoringRecTD: number; scoringReception: number;
  scoringFumble: number; scoring2pt: number;
  waiverType: string; waiverBudget: number; waiverDays: number;
  tradeDeadlineWeek: number; tradeReviewDays: number; tradeVeto: string;
  playoffStartWeek: number; playoffTeams: number; regularSeasonWeeks: number;
}

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [league, setLeague] = useState<League | null>(null);
  const [form, setForm] = useState<Partial<League>>({});
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"general"|"roster"|"scoring"|"waivers"|"schedule">("general");

  useEffect(() => {
    fetch(`/api/leagues/${id}`).then(r => r.json()).then(d => { setLeague(d); setForm(d); });
  }, [id]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    const res = await fetch(`/api/leagues/${id}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); toast("Settings saved!", { type: "success" }); }
    else toast("Failed to save settings", { type: "error" });
  }

  function copyInvite() {
    if (league) {
      navigator.clipboard.writeText(league.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!league) return <div className="p-8 text-[#8b8ba7]">Loading settings...</div>;

  const tabs = [
    { key: "general", label: "General" },
    { key: "roster", label: "Roster" },
    { key: "scoring", label: "Scoring" },
    { key: "waivers", label: "Waivers" },
    { key: "schedule", label: "Schedule" },
  ] as const;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">League Settings</h1>
        <button onClick={save}
          className={`ml-auto flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2 transition-colors ${saved ? "bg-green-600 text-white" : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white"}`}>
          {saved ? <><Check size={14} /> Saved!</> : "Save Changes"}
        </button>
      </div>

      {/* Invite Code */}
      <div className="bg-[#161622] border border-[#2a2a3e] rounded-xl p-4 mb-5">
        <p className="text-xs text-[#8b8ba7] mb-1.5">Invite Code</p>
        <div className="flex items-center gap-3">
          <code className="text-[#a78bfa] text-sm font-mono flex-1">{league.inviteCode}</code>
          <button onClick={copyInvite}
            className="flex items-center gap-1.5 text-xs text-[#8b8ba7] hover:text-white transition-colors">
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-5 bg-[#161622] border border-[#2a2a3e] rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${tab === t.key ? "bg-[#7c3aed] text-white" : "text-[#8b8ba7] hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-6 space-y-5">
        {tab === "general" && <>
          <Field label="League Name" value={form.name ?? ""} onChange={v => set("name", v)} />
          <Field label="Description" value={form.description ?? ""} onChange={v => set("description", v)} textarea />
          <NumField label="Season Year" value={form.season ?? 2025} onChange={v => set("season", v)} min={2020} max={2100} />
          <NumField label="Max Teams" value={form.maxRosters ?? 10} onChange={v => set("maxRosters", v)} min={2} max={32} />
          <SelectField label="League Status" value={form.status ?? "pre_draft"} onChange={v => set("status", v)}
            options={[["pre_draft","Pre-Draft"],["drafting","Drafting"],["in_season","In Season"],["off_season","Off Season"],["complete","Complete"]]} />
        </>}

        {tab === "roster" && <>
          {[["QB","rosterQB",0,4],["RB","rosterRB",0,6],["WR","rosterWR",0,8],["TE","rosterTE",0,4],
            ["FLEX","rosterFLEX",0,4],["K","rosterK",0,2],["Bench","rosterBench",2,20],["IR","rosterIR",0,10]].map(([label,key,min,max]) => (
            <NumField key={key as string} label={`${label} Spots`} value={form[key as keyof typeof form] as number ?? 0} onChange={v => set(key as string, v)} min={min as number} max={max as number} />
          ))}
        </>}

        {tab === "scoring" && <>
          {[["Pass Yards (per yd)","scoringPassYds",0,1,0.01],["Pass TDs","scoringPassTD",0,10,0.5],["Interceptions","scoringPassInt",-10,0,0.5],
            ["Rush Yards (per yd)","scoringRushYds",0,1,0.01],["Rush TDs","scoringRushTD",0,10,0.5],
            ["Rec Yards (per yd)","scoringRecYds",0,1,0.01],["Rec TDs","scoringRecTD",0,10,0.5],
            ["Receptions (PPR)","scoringReception",0,2,0.25],["Fumbles","scoringFumble",-5,0,0.5],["2-Pt Conversions","scoring2pt",0,4,0.5]].map(([label,key,min,max,step]) => (
            <NumField key={key as string} label={label as string} value={form[key as keyof typeof form] as number ?? 0} onChange={v => set(key as string, v)} min={min as number} max={max as number} step={step as number} />
          ))}
        </>}

        {tab === "waivers" && <>
          <SelectField label="Waiver System" value={form.waiverType ?? "rolling"} onChange={v => set("waiverType", v)}
            options={[["rolling","Rolling Waivers"],["reverse_standings","Reverse Standings"],["faab","FAAB Bidding"]]} />
          <NumField label="FAAB Budget" value={form.waiverBudget ?? 100} onChange={v => set("waiverBudget", v)} min={0} max={1000} />
          <NumField label="Waiver Processing Days" value={form.waiverDays ?? 2} onChange={v => set("waiverDays", v)} min={0} max={7} />
          <NumField label="Trade Deadline (Week)" value={form.tradeDeadlineWeek ?? 12} onChange={v => set("tradeDeadlineWeek", v)} min={1} max={18} />
          <NumField label="Trade Review Period (Days)" value={form.tradeReviewDays ?? 1} onChange={v => set("tradeReviewDays", v)} min={0} max={3} />
          <SelectField label="Trade Veto" value={form.tradeVeto ?? "commissioner"} onChange={v => set("tradeVeto", v)}
            options={[["commissioner","Commissioner"],["majority","Majority Vote"],["disabled","Disabled"]]} />
        </>}

        {tab === "schedule" && <>
          <NumField label="Regular Season Weeks" value={form.regularSeasonWeeks ?? 13} onChange={v => set("regularSeasonWeeks", v)} min={1} max={18} />
          <NumField label="Playoff Start Week" value={form.playoffStartWeek ?? 14} onChange={v => set("playoffStartWeek", v)} min={1} max={20} />
          <NumField label="Playoff Teams" value={form.playoffTeams ?? 4} onChange={v => set("playoffTeams", v)} min={2} max={8} />
        </>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = "w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]";
  return (
    <div>
      <label className="block text-sm text-[#8b8ba7] mb-1.5">{label}</label>
      {textarea ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className={cls + " resize-none"} />
        : <input value={value} onChange={e => onChange(e.target.value)} className={cls} />}
    </div>
  );
}

function NumField({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  return (
    <div>
      <label className="block text-sm text-[#8b8ba7] mb-1.5">{label}</label>
      <input type="number" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="block text-sm text-[#8b8ba7] mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
