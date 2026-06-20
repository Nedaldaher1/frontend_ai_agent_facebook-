"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { brand } from "@/constants/theme";
import { Gem, Menu } from "lucide-react";
import type { PropsWithChildren } from "react";
import { AppSidebar } from "./sidebar";

/**
 * App shell from the design prototype: a light canvas holding the content
 * (right, in RTL) and the dark sidebar (left). The sidebar is sticky and
 * full-height on desktop; on smaller screens it collapses behind a top bar
 * and opens in a sheet — a responsiveness gap the static prototype left open.
 */
export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-app-bg lg:grid lg:grid-cols-[1fr_268px]">
      <div className="flex min-w-0 flex-col">
        <MobileBar />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1200px] px-5 py-7 pb-20 sm:px-8 lg:px-[38px] lg:py-[30px]">
            {children}
          </div>
        </main>
      </div>

      <AppSidebar className="sticky top-0 hidden h-screen lg:flex" />
    </div>
  );
}

function MobileBar() {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 bg-[#14161B] px-4 py-3 text-white lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="فتح القائمة"
            className="flex size-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
          >
            <Menu className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[268px] border-none bg-[#14161B] p-0 [&>button]:text-white/70 [&>button:hover]:text-white"
        >
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          <AppSidebar className="h-full w-full" />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <div
          className="flex size-7 items-center justify-center rounded-lg text-white"
          style={{ background: brand.accent }}
        >
          <Gem className="size-4" />
        </div>
        <span className="text-sm font-semibold">{brand.name}</span>
      </div>
    </header>
  );
}

Layout.displayName = "Layout";
