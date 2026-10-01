import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 border border-indigo-500/30",
        secondary:
          "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/60 shadow-sm",
        outline:
          "border border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800 hover:text-white backdrop-blur-sm",
        ghost:
          "text-slate-300 hover:bg-slate-800/80 hover:text-white",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/25 border border-rose-500/30",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 border border-emerald-500/30",
      },
      size: {
        default: "h-11 px-5 py-2.5 min-h-[44px]",
        sm: "h-10 sm:h-9 rounded-lg px-3.5 text-xs min-h-[44px] sm:min-h-0",
        lg: "h-12 rounded-xl px-7 text-base min-h-[44px]",
        icon: "h-11 w-11 sm:h-10 sm:w-10 p-0 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
