import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MarkdownRenderer } from "../../../../components/contract-components/published-contract/markdown-renderer";
import { submitFeedback } from "../api/feedback";
import { NebulaIcon } from "../icons/NebulaIcon";

export type ChatMessage =
  | {
      text: string;
      type: "user" | "error" | "presence";
    }
  | {
      // assistant type message loaded from history doesn't have request_id
      request_id: string | undefined;
      text: string;
      type: "assistant";
    };

export function Chats(props: {
  messages: Array<ChatMessage>;
  isChatStreaming: boolean;
  authToken: string;
  sessionId: string | undefined;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 py-4", props.className)}>
      {props.messages.map((message, index) => {
        const isMessagePending =
          props.isChatStreaming && index === props.messages.length - 1;
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: index is the unique key
            key={index}
          >
            <div
              className={cn(
                "fade-in-0 flex min-w-0 animate-in gap-3 duration-300",
              )}
            >
              <div
                className={cn(
                  "-translate-y-[2px] relative flex size-8 shrink-0 items-center justify-center rounded-lg",
                  message.type === "user" &&
                    "bg-gradient-to-b from-indigo-400 to-indigo-600",
                  message.type === "assistant" && "border bg-muted/50",
                  message.type === "error" && "border",
                  message.type === "presence" && "border bg-muted/50",
                )}
              >
                {message.type === "presence" && <Spinner className="size-4" />}

                {message.type === "assistant" && (
                  <NebulaIcon className="size-5 text-muted-foreground" />
                )}

                {message.type === "error" && (
                  <AlertCircleIcon className="size-5 text-destructive-text" />
                )}
              </div>
              <div className="min-w-0 grow">
                {message.type === "assistant" ? (
                  <MarkdownRenderer
                    markdownText={message.text}
                    code={{
                      disableCodeHighlight: isMessagePending,
                      ignoreFormattingErrors: true,
                    }}
                    className="text-foreground"
                    p={{ className: "text-foreground" }}
                    li={{ className: "text-foreground" }}
                  />
                ) : message.type === "error" ? (
                  <span className="text-destructive-text leading-loose">
                    {message.text}
                  </span>
                ) : (
                  <span className="leading-loose">{message.text}</span>
                )}

                {message.type === "assistant" &&
                  !props.isChatStreaming &&
                  props.sessionId &&
                  message.request_id && (
                    <MessageActions
                      messageText={message.text}
                      authToken={props.authToken}
                      requestId={message.request_id}
                      sessionId={props.sessionId}
                      className="mt-4"
                    />
                  )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MessageActions(props: {
  authToken: string;
  requestId: string;
  sessionId: string;
  messageText: string;
  className?: string;
}) {
  const [isCopied, setIsCopied] = useState(false);
  function sendRating(rating: "good" | "bad") {
    return submitFeedback({
      authToken: props.authToken,
      rating,
      requestId: props.requestId,
      sessionId: props.sessionId,
    });
  }
  const sendPositiveRating = useMutation({
    mutationFn: () => sendRating("good"),
    onSuccess() {
      toast.info("Thanks for the feedback!");
    },
    onError() {
      toast.error("Failed to send feedback");
    },
  });

  const sendBadRating = useMutation({
    mutationFn: () => sendRating("bad"),
    onSuccess() {
      toast.info("Thanks for the feedback!");
    },
    onError() {
      toast.error("Failed to send feedback");
    },
  });

  return (
    <div
      className={cn("flex items-center gap-2 text-foreground", props.className)}
    >
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-2 rounded-lg text-sm"
        onClick={() => {
          navigator.clipboard.writeText(props.messageText);
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, 1000);
        }}
      >
        {isCopied ? (
          <CheckIcon className="size-3.5 text-green-500" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
        Copy
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="size-8 rounded-lg p-0"
        onClick={() => {
          sendPositiveRating.mutate();
        }}
      >
        {sendPositiveRating.isPending ? (
          <Spinner className="size-4" />
        ) : (
          <ThumbsUpIcon className="size-4" />
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="size-8 rounded-lg p-0"
        onClick={() => {
          sendBadRating.mutate();
        }}
      >
        {sendBadRating.isPending ? (
          <Spinner className="size-4" />
        ) : (
          <ThumbsDownIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}
