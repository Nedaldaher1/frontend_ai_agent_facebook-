import { ColorForm } from "@/components/colors/color-form";

/** Edit a color — the shared {@link ColorForm} in "edit" mode; it loads the
 *  record (with its dialect terms) and submits via Refine's data flow. */
export const ColorEdit = () => <ColorForm mode="edit" />;
