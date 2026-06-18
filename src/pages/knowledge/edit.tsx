import { KnowledgeForm } from "@/components/knowledge/knowledge-form";

/** Edit a knowledge entry — the shared {@link KnowledgeForm} in "edit" mode; it
 *  loads the record (drafts included) and submits via Refine's data flow. */
export const KnowledgeEdit = () => <KnowledgeForm mode="edit" />;
