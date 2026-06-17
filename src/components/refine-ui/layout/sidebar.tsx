"use client";

/**
 * Masa Fashion sidebar — the dark navigation rail from the design prototype
 * (the_goal.html). It is intentionally dark in every theme (a brand choice), so
 * its palette is hard-coded here rather than driven by the shadcn theme tokens.
 *
 * Behaviour stays wired to Refine: nav comes from `useMenu()` (resources in
 * `src/config/resources.tsx`), the footer identity from `useGetIdentity`, and
 * logout from `useLogout`. Resources without a route render as disabled
 * "قريباً" (soon) entries — the Phase 2 placeholders.
 */

import { brand } from "@/constants/theme";
import { cn } from "@/lib/utils";
import {
  useGetIdentity,
  useLink,
  useLogout,
  useMenu,
  type TreeMenuItem,
} from "@refinedev/core";
import { Gem, ListIcon, LogOut } from "lucide-react";

type Identity = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function AppSidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex flex-col bg-[#14161B] px-[18px] py-6 text-[#E7E8EC]",
        className,
      )}
    >
      <SidebarBrand />
      <div className="mx-1 my-[18px] h-px bg-[#23262E]" />
      <p className="px-2 pb-[9px] text-[10.5px] font-semibold text-[#5C6068]">
        القائمة
      </p>
      <SidebarNav />
      <div className="flex-1" />
      <SidebarUserCard />
    </aside>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 px-1.5 pb-1">
      <div
        className="flex size-9 items-center justify-center rounded-[10px] text-white"
        style={{
          background: brand.accent,
          boxShadow: `0 6px 16px -6px ${brand.accent}`,
        }}
      >
        <Gem className="size-[18px]" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15.5px] font-semibold tracking-[-0.2px] text-white">
          {brand.name}
        </div>
        <div className="mt-px text-[11px] text-[#7C808A]">لوحة التحكم</div>
      </div>
    </div>
  );
}

function SidebarNav() {
  const { menuItems, selectedKey } = useMenu();
  const Link = useLink();

  return (
    <nav className="flex flex-col gap-[3px]">
      {menuItems.map((item: TreeMenuItem) => {
        const label = item.meta?.label ?? item.label ?? item.name;
        const icon = item.meta?.icon ?? <ListIcon className="size-4" />;

        // No route → a Phase 2 placeholder, shown disabled with a "soon" badge.
        if (!item.route) {
          return (
            <div
              key={item.key ?? item.name}
              className="flex cursor-not-allowed items-center gap-[11px] rounded-[11px] px-3 py-2.5 text-sm text-[#62666F]"
            >
              <span className="opacity-70">{icon}</span>
              {label}
              <span className="ms-auto rounded-md border border-[#E2A33A]/20 bg-[#E2A33A]/15 px-[7px] py-0.5 text-[9.5px] font-semibold text-[#9A6B12]">
                قريباً
              </span>
            </div>
          );
        }

        const isActive = item.key === selectedKey;
        return (
          <Link
            key={item.key ?? item.name}
            to={item.route}
            className={cn(
              "flex items-center gap-[11px] rounded-[11px] px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "font-semibold text-white"
                : "text-[#A7ABB4] hover:bg-white/5 hover:text-white",
            )}
            style={
              isActive
                ? {
                    background: `color-mix(in srgb, ${brand.accent} 22%, #14161B)`,
                    // Accent indicator bar on the inner edge facing the content.
                    boxShadow: `inset -3px 0 0 ${brand.accent}`,
                  }
                : undefined
            }
            aria-current={isActive ? "page" : undefined}
          >
            <span>{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarUserCard() {
  const { data: user } = useGetIdentity<Identity>();
  const { mutate: logout, isPending } = useLogout();

  const name = user?.name ?? "—";
  const role = user?.role ?? "مدير الكتالوج";
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex items-center gap-[11px] rounded-[13px] border border-[#262A33] bg-[#1B1E25] px-2.5 py-[11px]">
      <div
        className="flex size-[34px] shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
        style={{ background: "linear-gradient(150deg, #2B50D6, #1E3AA8)" }}
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-[#EDEEF0]">
          {name}
        </div>
        <div className="truncate text-[11px] text-[#7C808A]">{role}</div>
      </div>
      <button
        type="button"
        onClick={() => logout()}
        disabled={isPending}
        title="تسجيل الخروج"
        aria-label="تسجيل الخروج"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#7C808A] transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
      >
        {/* The log-out glyph points "outward"; mirror it for RTL. */}
        <LogOut className="size-4 rtl:-scale-x-100" />
      </button>
    </div>
  );
}

AppSidebar.displayName = "AppSidebar";
