"use client";

/**
 * Searchable product picker for linking a knowledge entry to a product. Built
 * from shadcn's Command + Popover (the canonical combobox) and fed by the
 * products data provider. The first option, "general", clears the link
 * (`productId = null`) — the default for catalog-wide knowledge.
 *
 * The catalog is small, so we load one generous page and filter client-side
 * (the products list query exposes no name search).
 */

import { useState } from "react";
import { useList } from "@refinedev/core";
import { Check, ChevronsUpDown, Package } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

const GENERAL_LABEL = "عام — لكل المنتجات";

type ProductComboboxProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  id?: string;
};

export function ProductCombobox({ value, onChange, id }: ProductComboboxProps) {
  const [open, setOpen] = useState(false);

  const { result } = useList<Product>({
    resource: "products",
    dataProviderName: "default",
    pagination: { currentPage: 1, pageSize: 200 },
  });
  const products = Array.isArray(result?.data) ? result.data : [];

  const selected = value ? products.find((p) => p.id === value) : undefined;
  const label =
    value == null ? GENERAL_LABEL : (selected?.name ?? "منتج محدّد");

  const choose = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          className="flex h-auto w-full items-center justify-between gap-2 rounded-[11px] border border-line-2 bg-card px-[13px] py-[11px] text-sm font-medium text-ink-2 transition-colors focus:border-primary focus:outline-none"
        >
          <span className="flex min-w-0 items-center gap-2">
            {value != null && (
              <Package className="size-3.5 shrink-0 text-ink-faint" />
            )}
            <span className="truncate">{label}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-ink-faint" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput placeholder="ابحث عن منتج…" />
          <CommandList>
            <CommandEmpty>لا توجد منتجات مطابقة</CommandEmpty>
            <CommandGroup>
              <CommandItem value="عام general" onSelect={() => choose(null)}>
                <Check
                  className={cn(
                    "size-4",
                    value == null ? "opacity-100" : "opacity-0",
                  )}
                />
                {GENERAL_LABEL}
              </CommandItem>
              {products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.id}`}
                  onSelect={() => choose(p.id)}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === p.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
