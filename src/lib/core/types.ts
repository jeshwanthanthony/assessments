import type { DocJSON } from "./doc";

export type Profile = { id: string; email: string; name: string; color: string };
export type Role = "owner" | "editor" | "commenter" | "viewer";
export type ShareRole = "editor" | "commenter" | "viewer";
export type DocSummary = {
  id: string; title: string; ownerId: string; updatedAt: string;
  owner: Profile | null; role: Role; sharedWith: { user: Profile; role: ShareRole }[];
};
export type DocFull = DocSummary & { content: DocJSON };

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", editor: "Editor", commenter: "Commenter", viewer: "Viewer" };
export const canEdit = (r: Role) => r === "owner" || r === "editor";
export const canComment = (r: Role) => r !== "viewer";

export type Comment = {
  id: string; documentId: string; parentId: string | null; quote: string | null; body: string;
  resolved: boolean; createdAt: string; author: Profile | null;
};
export type Version = { id: string; title: string; savedBy: Profile | null; createdAt: string; updatedAt: string };
