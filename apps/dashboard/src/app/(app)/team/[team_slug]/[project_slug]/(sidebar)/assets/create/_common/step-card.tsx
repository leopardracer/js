import { Button } from "@/components/ui/button";
import { useTrack } from "hooks/analytics/useTrack";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { getStepCardTrackingData } from "../token/_common/tracking";

export function StepCard(props: {
  title: string;
  tracking: {
    page: string;
    contractType: "DropERC20" | "NFTCollection";
  };
  prevButton:
    | undefined
    | {
        onClick: () => void;
      };
  nextButton:
    | undefined
    | {
        type: "submit";
        disabled?: boolean;
      }
    | {
        type: "custom";
        custom: React.ReactNode;
      }
    | {
        type: "click";
        disabled?: boolean;
        onClick: () => void;
      };
  children: React.ReactNode;
}) {
  const trackEvent = useTrack();
  const nextButton = props.nextButton;
  return (
    <div className="rounded-lg border bg-card">
      <h2 className="border-b px-4 py-5 font-semibold text-xl tracking-tight md:px-6">
        {props.title}
      </h2>

      {props.children}

      {(props.prevButton || props.nextButton) && (
        <div className="flex justify-end gap-3 border-t p-6">
          {props.prevButton && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                props.prevButton?.onClick();
                trackEvent(
                  getStepCardTrackingData({
                    step: props.tracking.page,
                    contractType: props.tracking.contractType,
                    click: "prev",
                  }),
                );
              }}
            >
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>
          )}

          {nextButton && nextButton.type !== "custom" && (
            <Button
              variant="default"
              className="gap-2"
              type="submit"
              disabled={nextButton.disabled}
              onClick={() => {
                trackEvent(
                  getStepCardTrackingData({
                    step: props.tracking.page,
                    contractType: props.tracking.contractType,
                    click: "next",
                  }),
                );

                if (nextButton.type === "click") {
                  nextButton.onClick();
                }
              }}
            >
              Next
              <ArrowRightIcon className="size-4" />
            </Button>
          )}

          {props.nextButton &&
            props.nextButton.type === "custom" &&
            props.nextButton.custom}
        </div>
      )}
    </div>
  );
}
