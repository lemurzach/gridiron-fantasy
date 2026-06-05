"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Trophy } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", displayName: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, username: form.username, displayName: form.displayName, password: form.password }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Registration failed");
      setLoading(false);
      return;
    }

    const login = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (login?.error) { setError("Account created but login failed — try signing in manually"); return; }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#7c3aed] flex items-center justify-center mb-3">
            <Trophy size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GridIron</h1>
          <p className="text-[#8b8ba7] text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "displayName", label: "Display Name", placeholder: "John Doe", type: "text" },
              { key: "username", label: "Username", placeholder: "johndoe", type: "text" },
              { key: "email", label: "Email", placeholder: "you@example.com", type: "email" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-[#8b8ba7] mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed] transition-colors text-sm"
                />
              </div>
            ))}
            {["password", "confirm"].map(key => (
              <div key={key}>
                <label className="block text-sm font-medium text-[#8b8ba7] mb-1.5">
                  {key === "password" ? "Password" : "Confirm Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded-lg px-4 py-2.5 pr-10 text-white placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed] transition-colors text-sm"
                  />
                  {key === "password" && (
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-[#8b8ba7]">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 transition-colors text-sm mt-2"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-[#8b8ba7] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#7c3aed] hover:text-[#a78bfa] font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
