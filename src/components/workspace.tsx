"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, onAuthChange, setExpectedUser } from "./ui";
import type { DocSummary, Profile } from "@/lib/core/types";

type ListState = "loading" | "ready" | "error";
type Ctx = {
  me: Profile | null;
  owned: DocSummary[];
  shared: DocSummary[];
  state: ListState;
  reload: () => Promise<void>;
  patchDoc: (id: string, patch: Partial<DocSummary>) => void;
};
const WorkspaceCtx = createContext<Ctx | null>(null);
export const useWorkspace = () => useContext(WorkspaceCtx)!;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Profile | null>(null);
  const [owned, setOwned] = useState<DocSummary[]>([]);
  const [shared, setShared] = useState<DocSummary[]>([]);
  const [state, setState] = useState<ListState>("loading");

  const reload = useCallback(async () => {
    setState("loading");
    try {
      const [m, o, s] = await Promise.all([
        api<{ user: Profile }>("/api/me"),
        api<{ documents: DocSummary[] }>("/api/documents?scope=owned"),
        api<{ documents: DocSummary[] }>("/api/documents?scope=shared"),
      ]);
      setMe(m.user);
      setExpectedUser(m.user.id);
      setOwned(o.documents);
      setShared(s.documents);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => onAuthChange(() => { api("/api/me").catch(() => {}); }), []);

  const patchDoc = useCallback((id: string, patch: Partial<DocSummary>) => {
    const f = (l: DocSummary[]) => l.map((d) => (d.id === id ? { ...d, ...patch } : d));
    setOwned(f);
    setShared(f);
  }, []);

  return <WorkspaceCtx.Provider value={{ me, owned, shared, state, reload, patchDoc }}>{children}</WorkspaceCtx.Provider>;
}
