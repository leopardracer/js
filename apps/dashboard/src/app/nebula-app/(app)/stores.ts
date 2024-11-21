import { createStore } from "@/lib/reactive";

export const newChatPageUrlStore = createStore<string | undefined>(undefined);

export const newSessionsStore = createStore<{ title: string; id: string }[]>(
  [],
);

export const deletedSessionsStore = createStore<
  string[] // array of session ids
>([]);
