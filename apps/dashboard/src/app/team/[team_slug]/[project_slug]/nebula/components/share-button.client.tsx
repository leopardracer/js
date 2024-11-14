"use client";

import { Button } from "@/components/ui/button";
import { ToolTipLabel } from "@/components/ui/tooltip";
import { CheckIcon, ShareIcon } from "lucide-react";
import { useState } from "react";

export function ShareButton() {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <ToolTipLabel label="Copy link for joining waitlist">
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => {
          navigator.clipboard.writeText("https://thirdweb.com/team/~/~/nebula");
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 1000);
        }}
      >
        Share
        {isCopied ? (
          <CheckIcon className="size-4 text-green-500" />
        ) : (
          <ShareIcon className="size-4" />
        )}
      </Button>
    </ToolTipLabel>
  );
}
