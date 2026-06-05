import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default async function NotificationsPage() {
  const session = await getAuth();
  if (!session) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const typeIcon: Record<string, string> = {
    trade_proposal: "🤝",
    waiver_result: "📋",
    lineup_lock: "🔒",
    matchup_start: "🏈",
    chat_mention: "💬",
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bell size={20} className="text-[#7c3aed]" />
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        <form action="/api/notifications" method="POST" className="ml-auto">
          <button type="submit"
            className="flex items-center gap-1.5 text-xs text-[#8b8ba7] hover:text-white transition-colors">
            <CheckCheck size={14} /> Mark all read
          </button>
        </form>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-12 text-center">
          <Bell size={32} className="text-[#2a2a3e] mx-auto mb-3" />
          <p className="text-[#8b8ba7]">No notifications yet.</p>
        </div>
      ) : (
        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden">
          {notifications.map(n => (
            <div key={n.id}
              className={`flex items-start gap-4 px-5 py-4 border-b border-[#2a2a3e] last:border-0 ${!n.isRead ? "bg-[#7c3aed]/5" : "hover:bg-[#1e1e2e]"} transition-colors`}>
              <span className="text-xl mt-0.5">{typeIcon[n.type] ?? "📣"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{n.title}</p>
                <p className="text-[#8b8ba7] text-xs mt-0.5">{n.body}</p>
                <p className="text-[#4a4a6a] text-xs mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#7c3aed] mt-1.5 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
