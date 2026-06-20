import { ColorForm } from "@/components/colors/color-form";

/** Edit a color — the shared {@link ColorForm} in "edit" mode; it loads the
 *  record (with its dialect terms) and, on Save, persists the color plus the
 *  staged synonym diff (add/rename/remove) together. */
export const ColorEdit = () => <ColorForm mode="edit" />;
