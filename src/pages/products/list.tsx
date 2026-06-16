import {
  ListView,
  ListViewHeader,
} from "@/components/refine-ui/views/list-view";

/**
 * Products list (skeleton).
 *
 * Structural placeholder wired into Refine's resource routing. The searchable /
 * filterable / paginated table from the_goal.html is built in the UI-conversion
 * phase: it will use Refine's `useTable` + the `DataTable` in
 * `src/components/refine-ui/data-table/` and the closed enums in
 * `src/constants/enums.ts` for the column filters.
 */
export const ProductList = () => {
  return (
    <ListView>
      <ListViewHeader title="المنتجات" />
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
        جدول المنتجات قيد الإنشاء — سيُبنى في مرحلة تحويل الواجهة.
      </div>
    </ListView>
  );
};
