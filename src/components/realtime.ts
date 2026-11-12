"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// One Realtime connection per tab, shared by presence, live cursors and share notifications.
let client: SupabaseClient | null = null;
export function realtime(): SupabaseClient {
  client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  return client;
}

export const inboxChannel = (userId: string) => `inbox:${userId}`;

/** Tells a person's open tabs that a document was just shared with them (their list refreshes). */
export function notifyShared(userId: string, payload: { by: string; title: string }) {
  const ch = realtime().channel(inboxChannel(userId));
  ch.subscribe((status) => {
    if (status !== "SUBSCRIBED") return;
    ch.send({ type: "broadcast", event: "shared", payload }).finally(() => realtime().removeChannel(ch));
  });
}
