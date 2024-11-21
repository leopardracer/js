"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../../@/components/ui/button";
import { ChatSidebar, useNewChatPageLink } from "./ChatSidebar";

export function MobileNav(props: {
  sessions: { id: string; title: string }[];
  authToken: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const newChatPage = useNewChatPageLink();

  return (
    <nav className="flex justify-between border border-b bg-muted/50 px-4 py-4 lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            className="h-auto w-auto p-0.5"
          >
            <MenuIcon className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[calc(100vw-80px)] max-w-[300px] p-0"
          onClick={(e) => {
            if (!(e.target instanceof HTMLElement)) {
              return;
            }
            if (
              e.target instanceof HTMLAnchorElement ||
              e.target.closest("a")
            ) {
              setIsOpen(false);
            }
          }}
        >
          <SheetTitle className="sr-only"> Menu </SheetTitle>
          <ChatSidebar
            type="mobile"
            authToken={props.authToken}
            sessions={props.sessions}
          />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-5">
        <Button
          asChild
          variant="primary"
          className="h-auto w-auto rounded-lg px-2.5 py-1.5"
        >
          <Link href={newChatPage}>New Chat</Link>
        </Button>
      </div>
    </nav>
  );
}
