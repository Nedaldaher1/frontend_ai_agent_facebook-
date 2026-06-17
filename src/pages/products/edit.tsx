import { ProductForm } from "@/components/products/product-form";

/** Edit a product — the shared {@link ProductForm} in "edit" mode; it loads the
 *  record, shows the Vision review gate, and submits via Refine's data flow. */
export const ProductEdit = () => <ProductForm mode="edit" />;
