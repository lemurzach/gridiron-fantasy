"use client";
import * as Toast from "@radix-ui/react-toast";
import { createContext, useContext, useState, useCallback } from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface ToastMsg { id: string; title: string; description?: string; type: ToastType; }

const ToastCtx = createContext<{
  toast: (title: string, opts?: { description?: string; type?: ToastType }) => void;
}>({ toast: () => {} });

export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const toast = useCallback((title: string, opts?: { description?: string; type?: ToastType }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, title, description: opts?.description, type: opts?.type ?? "info" }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map(t => (
          <Toast.Root
            key={t.id}
            open
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl animate-fade-in ${
              t.type === "success" ? "bg-green-900/80 border-green-700" :
              t.type === "error"   ? "bg-red-900/80 border-red-700" :
              "bg-[#1e1e2e] border-[#2a2a3e]"
            }`}
          >
            <div className="flex-1">
              <Toast.Title className="font-semibold text-white text-sm">{t.title}</Toast.Title>
              {t.description && (
                <Toast.Description className="text-xs text-[#8b8ba7] mt-0.5">{t.description}</Toast.Description>
              )}
            </div>
            <Toast.Close className="text-[#8b8ba7] hover:text-white transition-colors">
              <X size={14} />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-[9999] w-80" />
      </Toast.Provider>
    </ToastCtx.Provider>
  );
}
