---
description: Scaffold a new Refine resource (list/create/edit) using shadcn/ui, RTL-correct
argument-hint: <resource-name> (e.g. orders)
---

Scaffold a new admin resource named `$ARGUMENTS` following this project's conventions.

1. Read `CLAUDE.md` first and follow every rule (shadcn/ui only, RTL with logical Tailwind classes, Arabic UI strings, English identifiers).
2. Create `src/pages/$ARGUMENTS/list.tsx`, `create.tsx`, and `edit.tsx` using Refine core hooks (`useList`, `useOne`, `useCreate`, `useUpdate`, `useNavigation`) — mirror `src/pages/products/`.
3. Build the UI from shadcn/ui components. Add any missing component with `npx shadcn@latest add <component>`.
4. Register the resource in `src/App.tsx` (`resources` array + routes) with an Arabic `meta.label`.
5. Verify it type-checks (`bun run build` or `tsc --noEmit`).
6. Commit the work per the git workflow (see `/commit`).
