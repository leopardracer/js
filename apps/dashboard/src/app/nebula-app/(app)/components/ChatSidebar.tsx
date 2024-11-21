"use client";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/reactive";
import { CustomConnectWallet } from "@3rdweb-sdk/react/components/connect-wallet";
import { ChevronRightIcon, MessageSquareDashedIcon } from "lucide-react";
import Link from "next/link";
import { NebulaIcon } from "../icons/NebulaIcon";
import {
  deletedSessionsStore,
  newChatPageUrlStore,
  newSessionsStore,
} from "../stores";
import { ChatSidebarLink } from "./ChatSidebarLink";

export function ChatSidebar(props: {
  sessions: { id: string; title: string }[];
  authToken: string;
  type: "desktop" | "mobile";
}) {
  const newAddedSessions = useStore(newSessionsStore);
  const deletedSessions = useStore(deletedSessionsStore);
  const sessions = [...newAddedSessions, ...props.sessions].filter((s) => {
    return !deletedSessions.some((d) => d === s.id);
  });

  const sessionsToShow = sessions.slice(0, 10);
  const newChatPage = useNewChatPageLink();

  return (
    <div className="flex h-full flex-col p-2">
      <div className="flex justify-start p-2">
        <Link href="/">
          <NebulaIcon className="size-8 text-foreground" />
        </Link>
      </div>

      <div className="p-2">
        <div className="h-3" />
        <Button asChild variant="primary" className="w-full gap-2">
          <Link href={newChatPage}>
            <MessageSquareDashedIcon className="size-4" />
            New Chat
          </Link>
        </Button>
      </div>

      {sessionsToShow.length > 0 && (
        <div className="mt-5 border-t border-dashed pt-2">
          <div className="flex flex-col gap-1">
            <h3 className="px-2 py-3 text-muted-foreground text-sm">
              Recent Chats
            </h3>
            {sessionsToShow.map((session) => {
              return (
                <ChatSidebarLink
                  sessionId={session.id}
                  title={session.title}
                  key={session.id}
                  authToken={props.authToken}
                />
              );
            })}

            {sessions.length > sessionsToShow.length && (
              <Link
                href="/chat/history"
                className="inline-flex items-center gap-1.5 px-2 py-3 text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
              >
                View All <ChevronRightIcon className="size-4 text-foreground" />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto p-2">
        <CustomConnectWallet
          signInLinkButtonClassName="!w-full"
          loadingButtonClassName="!w-full"
          connectButtonClassName="!w-full"
          detailsButtonClassName="!w-full"
        />
      </div>
    </div>
  );
}

export function useNewChatPageLink() {
  const newChatPage = useStore(newChatPageUrlStore);
  return newChatPage || "/chat";
}
