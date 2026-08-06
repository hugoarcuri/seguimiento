"use client";

import * as CheckboxBase from "@base-ui/react/checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({
  className,
  ...props
}: CheckboxBase.Checkbox.Root.Props) {
  return (
    <CheckboxBase.Checkbox.Root
      className={cn(
        "peer size-5 shrink-0 rounded-sm border border-input shadow-sm shadow-black/[.04]",
        "outline-none transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:data-[checked=true]:bg-muted data-[checked=true]:bg-primary data-[checked=true]:border-primary data-[checked=true]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxBase.Checkbox.Indicator className="flex items-center justify-center text-current">
        <Check className="size-4" strokeWidth={3} />
      </CheckboxBase.Checkbox.Indicator>
    </CheckboxBase.Checkbox.Root>
  );
}

export { Checkbox };