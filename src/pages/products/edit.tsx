import {
  EditView,
  EditViewHeader,
} from "@/components/refine-ui/views/edit-view";

/**
 * Edit product (skeleton).
 *
 * Structural placeholder. Shares the same form as {@link ProductCreate} in the
 * UI-conversion phase, pre-loaded via Refine's edit data flow and including the
 * vision-attribute review/approval gate before publish (CLAUDE.md §6).
 */
export const ProductEdit = () => {
  return (
    <EditView>
      <EditViewHeader title="تعديل منتج" />
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
        نموذج تعديل المنتج قيد الإنشاء.
      </div>
    </EditView>
  );
};
