import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-[#d4f77f] shadow-[0_0_0_1px_rgba(198,242,106,0.25),0_8px_24px_rgba(198,242,106,0.12)]",
  secondary:
    "bg-surface-raised text-foreground border border-border hover:bg-surface-hover",
  outline:
    "border border-border-strong bg-transparent text-foreground hover:bg-surface-raised",
  ghost: "bg-transparent text-muted-strong hover:bg-surface-raised hover:text-foreground",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
  link: "bg-transparent text-accent hover:text-[#d4f77f] p-0 h-auto",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-11 px-5 text-sm rounded-xl gap-2",
  icon: "h-10 w-10 rounded-xl justify-center",
  "icon-sm": "h-8 w-8 rounded-lg justify-center",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background whitespace-nowrap",
    variants[variant],
    sizes[size],
    className,
  );
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
