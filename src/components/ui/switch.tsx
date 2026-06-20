"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Sized to the prototype's publish toggle (46x27, 21px knob).
        "peer inline-flex h-[27px] w-[46px] shrink-0 items-center rounded-full border border-transparent px-[3px] outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-[#D4D7DD]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Travel is direction-gated so the knob moves toward the inline-end
          // in both RTL and LTR (this app runs RTL).
          "pointer-events-none block size-[21px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,.22)] ring-0 transition-transform data-[state=unchecked]:translate-x-0 data-[state=checked]:ltr:translate-x-[19px] data-[state=checked]:rtl:-translate-x-[19px]"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
