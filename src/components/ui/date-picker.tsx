"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  type?: "date" | "datetime-local" | "time";
  error?: boolean;
  icon?: React.ReactNode;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, type = "date", error, disabled, icon, onClick, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (onClick) {
        onClick(e as any);
      }
      try {
        if (internalRef.current && typeof internalRef.current.showPicker === "function") {
          internalRef.current.showPicker();
        }
      } catch (err) {
        // Fallback if browser restricts showPicker
      }
    };

    return (
      <div
        onClick={handleContainerClick}
        className={cn(
          "relative flex items-center justify-between w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white transition-all cursor-pointer hover:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 [color-scheme:dark]",
          disabled && "opacity-50 cursor-not-allowed hover:border-slate-800",
          error && "border-rose-500/80 focus-within:border-rose-500 focus-within:ring-rose-500/20",
          className
        )}
      >
        <input
          ref={internalRef}
          type={type}
          disabled={disabled}
          className="w-full bg-transparent text-white text-xs sm:text-sm outline-none cursor-pointer disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          {...props}
        />
        <div className="pointer-events-none ml-2 text-indigo-400 shrink-0">
          {icon || <Calendar className="w-4 h-4" />}
        </div>
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
