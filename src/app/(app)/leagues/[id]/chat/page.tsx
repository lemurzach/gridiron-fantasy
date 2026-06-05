"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Send, Smile, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatMsg {
  id: string; content: string; type: string; createdAt: string;
  user: { id: string; displayName: string; username: string };
  reactions: { id: string; emoji: string; userId: string; user: { displayName: string } }[];
}

const QUICK_EMOJIS = ["👍","🔥","😂","💯","🏈","😭","🤣","😤"];

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  async function loadMessages() {
    const res = await fetch(`/api/leagues/${id}/chat`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
    // Poll every 3s for new messages (replace with WebSocket in production)
    pollRef.current = setInterval(loadMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    await fetch(`/api/leagues/${id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, type: "text" }),
    });
    setSending(false);
    loadMessages();
  }

  async function react(messageId: string, emoji: string) {
    await fetch(`/api/leagues/${id}/chat/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji }),
    });
    loadMessages();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#2a2a3e] flex items-center gap-2 bg-[#0d0d14]">
        <MessageSquare size={18} className="text-[#7c3aed]" />
        <h1 className="text-white font-semibold">League Chat</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-xs text-[#8b8ba7]">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading && <p className="text-[#8b8ba7] text-sm text-center py-8">Loading chat...</p>}
        {!loading && messages.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare size={32} className="text-[#2a2a3e] mx-auto mb-3" />
            <p className="text-[#8b8ba7] text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.user.id === session?.user?.id;
          const showAvatar = i === 0 || messages[i - 1].user.id !== msg.user.id;
          const reactionGroups = msg.reactions.reduce<Record<string, { count: number; users: string[]; mine: boolean }>>((acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [], mine: false };
            acc[r.emoji].count++;
            acc[r.emoji].users.push(r.user.displayName);
            if (r.userId === session?.user?.id) acc[r.emoji].mine = true;
            return acc;
          }, {});

          return (
            <div key={msg.id} className={`flex gap-3 group ${isMe ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className={`shrink-0 ${!showAvatar ? "invisible" : ""}`}>
                <div className="w-8 h-8 rounded-full bg-[#7c3aed]/40 flex items-center justify-center text-xs font-bold text-white">
                  {msg.user.displayName[0]}
                </div>
              </div>

              <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {showAvatar && (
                  <span className={`text-xs text-[#8b8ba7] ${isMe ? "text-right" : ""}`}>
                    {msg.user.displayName} · {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? "bg-[#7c3aed] text-white rounded-tr-sm"
                    : msg.type === "system"
                    ? "bg-[#1e1e2e] text-[#8b8ba7] italic text-xs"
                    : "bg-[#1e1e2e] text-white rounded-tl-sm border border-[#2a2a3e]"
                }`}>
                  {msg.content}
                </div>

                {/* Reactions */}
                {Object.entries(reactionGroups).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(reactionGroups).map(([emoji, data]) => (
                      <button key={emoji} onClick={() => react(msg.id, emoji)}
                        title={data.users.join(", ")}
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${data.mine ? "bg-[#7c3aed]/20 border-[#7c3aed]/50 text-white" : "bg-[#1e1e2e] border-[#2a2a3e] text-[#8b8ba7] hover:border-[#7c3aed]/30"}`}>
                        {emoji} {data.count}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick react */}
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${isMe ? "flex-row-reverse" : ""}`}>
                  {QUICK_EMOJIS.slice(0, 4).map(e => (
                    <button key={e} onClick={() => react(msg.id, e)}
                      className="text-sm hover:scale-110 transition-transform p-0.5">
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#2a2a3e] px-5 py-4 bg-[#0d0d14]">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <div className="flex gap-1">
            {QUICK_EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => setInput(v => v + e)}
                className="text-base hover:scale-110 transition-transform">
                {e}
              </button>
            ))}
          </div>
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 bg-[#161622] border border-[#2a2a3e] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#4a4a6a] focus:outline-none focus:border-[#7c3aed]" />
          <button type="submit" disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 flex items-center justify-center transition-colors shrink-0">
            <Send size={14} className="text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
