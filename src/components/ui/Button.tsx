import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-[#7c3aed] hover:bg-[#6d28d9] text-white": variant === "primary",
            "bg-[#1e1e2e] hover:bg-[#2a2a3e] text-white border border-[#2a2a3e]": variant === "secondary",
            "hover:bg-[#1e1e2e] text-[#8b8ba7] hover:text-white": variant === "ghost",
            "bg-red-600 hover:bg-red-700 text-white": variant === "danger",
            "border border-[#2a2a3e] hover:border-[#7c3aed] text-white bg-transparent": variant === "outline",
          },
          {
            "text-xs px-3 py-1.5": size === "sm",
            "text-sm px-4 py-2": size === "md",
            "text-base px-6 py-3": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
