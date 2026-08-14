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
        "peer size-5 shrink-0 cursor-pointer rounded-[5px] border border-input bg-card shadow-sm transition-all",
        "outline-none hover:border-primary/70 hover:bg-accent",
        "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/35",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[checked=true]:border-primary data-[checked=true]:bg-primary data-[checked=true]:text-primary-foreground",
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