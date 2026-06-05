import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-[#2a2a3e] text-[#8b8ba7]": variant === "default",
          "bg-green-500/20 text-green-300": variant === "success",
          "bg-yellow-500/20 text-yellow-300": variant === "warning",
          "bg-red-500/20 text-red-300": variant === "danger",
          "bg-blue-500/20 text-blue-300": variant === "info",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
