"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Trophy } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("Invalid email or password"); return; }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#7c3aed] flex items-center justify-center mb-3">
            <Trophy size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GridIron</h1>
          <p className="text-[#8b8ba7] text-sm mt-1">Fantasy League Manager</p>
        </div>

        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Welcome back</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8b8ba7] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed] transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8b8ba7] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 pr-10 text-white placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed] transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-[#8b8ba7]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 transition-colors text-sm mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-[#8b8ba7] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#7c3aed] hover:text-[#a78bfa] font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
