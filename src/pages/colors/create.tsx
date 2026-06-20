import { ColorForm } from "@/components/colors/color-form";

/** Add a color — the shared {@link ColorForm} in "create" mode. Dialect terms
 *  are staged on the same page and POSTed right after the color is created. */
export const ColorCreate = () => <ColorForm mode="create" />;
