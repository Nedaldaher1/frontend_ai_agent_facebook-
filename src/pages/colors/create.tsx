import { ColorForm } from "@/components/colors/color-form";

/** Add a color — the shared {@link ColorForm} in "create" mode. On save it
 *  redirects to the edit page so dialect terms can be attached. */
export const ColorCreate = () => <ColorForm mode="create" />;
