import {
  CreateView,
  CreateViewHeader,
} from "@/components/refine-ui/views/create-view";

/**
 * Add product (skeleton).
 *
 * Structural placeholder. The full multi-section form from the_goal.html
 * (images-as-color-variants, AI suggestion review, sizing, closed-enum
 * attributes, tags, live preview, publish toggle) lands in the UI-conversion
 * phase, driven by `@refinedev/react-hook-form` + the `ProductFormValues` type.
 */
export const ProductCreate = () => {
  return (
    <CreateView>
      <CreateViewHeader title="إضافة منتج جديد" />
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
        نموذج إضافة المنتج قيد الإنشاء.
      </div>
    </CreateView>
  );
};
