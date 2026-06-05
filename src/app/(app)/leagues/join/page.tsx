"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { ChevronLeft, LogIn } from "lucide-react";
import Link from "next/link";

export default function JoinLeaguePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/leagues/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code.trim(), teamName }),
    });
    setLoading(false);
    if (res.ok) {
      const { leagueId } = await res.json();
      toast("Joined league!", { type: "success" });
      router.push(`/leagues/${leagueId}/matchup`);
    } else {
      const d = await res.json();
      toast(d.error ?? "Failed to join", { type: "error" });
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <Link href="/dashboard" className="flex items-center gap-2 text-[#8b8ba7] hover:text-white text-sm mb-6 transition-colors">
        <ChevronLeft size={16} /> Back
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <LogIn size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">Join a League</h1>
      </div>
      <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-6">
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm text-[#8b8ba7] mb-1.5">Invite Code</label>
            <input value={code} onChange={e => setCode(e.target.value)} required placeholder="Paste invite code here..."
              className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed]" />
          </div>
          <div>
            <label className="block text-sm text-[#8b8ba7] mb-1.5">Your Team Name</label>
            <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="My Team Name"
              className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed]" />
          </div>
          <button type="submit" disabled={!code || loading}
            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors">
            {loading ? "Joining..." : "Join League"}
          </button>
        </form>
      </div>
    </div>
  );
}
