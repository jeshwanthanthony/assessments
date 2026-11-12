import type { DocJSON } from "./doc";

export type Profile = { id: string; email: string; name: string; color: string };
export type Role = "owner" | "editor" | "viewer";
export type ShareRole = "editor" | "viewer";
export type DocSummary = {
  id: string; title: string; ownerId: string; updatedAt: string;
  owner: Profile | null; role: Role; sharedWith: { user: Profile; role: ShareRole }[];
};
export type DocFull = DocSummary & { content: DocJSON };
