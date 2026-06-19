/**
 * Refine resource registry — the single place resources are declared.
 *
 * Adding a resource here makes it appear in the sidebar (via `useMenu`) and
 * wires its routes/labels. Keep route paths in sync with the <Route> tree in
 * `src/App.tsx`. "Soon" entries are visible-but-disabled placeholders for the
 * next phases (orders, chats, settings) and intentionally have no routes.
 */

import type { ResourceProps } from "@refinedev/core";
import {
  LayoutGrid,
  Library,
  MessageCircle,
  Palette,
  Settings,
  ShoppingBag,
} from "lucide-react";

export const resources: ResourceProps[] = [
  {
    name: "products",
    list: "/products",
    create: "/products/create",
    edit: "/products/edit/:id",
    meta: {
      label: "المنتجات",
      icon: <LayoutGrid className="size-4" />,
    },
  },
  {
    name: "knowledge",
    list: "/knowledge",
    create: "/knowledge/create",
    edit: "/knowledge/edit/:id",
    meta: {
      label: "قاعدة المعرفة",
      // Library glyph mirrored for RTL.
      icon: <Library className="size-4 rtl:-scale-x-100" />,
    name: "colors",
    list: "/colors",
    create: "/colors/create",
    edit: "/colors/edit/:id",
    meta: {
      label: "الألوان",
      icon: <Palette className="size-4" />,
    },
  },
  },
  // --- Phase 2+ placeholders (not yet routed) ---
  {
    name: "orders",
    meta: { label: "الطلبات", icon: <ShoppingBag className="size-4" /> },
  },
  {
    name: "conversations",
    meta: { label: "المحادثات", icon: <MessageCircle className="size-4" /> },
  },
  {
    name: "settings",
    meta: { label: "الإعدادات", icon: <Settings className="size-4" /> },
  },
];
