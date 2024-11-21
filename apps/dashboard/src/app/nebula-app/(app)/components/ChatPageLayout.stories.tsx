import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "sonner";
import { ThirdwebProvider } from "thirdweb/react";
import { randomLorem } from "../../../../stories/stubs";
import { BadgeContainer, mobileViewport } from "../../../../stories/utils";
import { ChatPageLayout } from "./ChatPageLayout";

const meta = {
  title: "Nebula/ChatPageLayout",
  component: Story,
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof Story>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  args: {},
};

export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: mobileViewport("iphone14"),
  },
};

function generateRandomSessions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i.toString(),
    title: randomLorem(Math.floor(Math.random() * 10) + 1),
  }));
}

function Story() {
  return (
    <ThirdwebProvider>
      <div className="flex flex-col gap-10 py-10 lg:container">
        <Variant label="No Recent Chats" sessions={[]} />
        <Variant label="3  Chats" sessions={generateRandomSessions(3)} />
        <Variant label="30  Chats" sessions={generateRandomSessions(30)} />
      </div>
    </ThirdwebProvider>
  );
}

function Variant(props: {
  label: string;
  sessions: {
    id: string;
    title: string;
  }[];
}) {
  return (
    <BadgeContainer label={props.label}>
      <ChatPageLayout
        accountAddress="0xC569B9FD77d132e10954cA5E6EF617414e314b11"
        authToken="xxxxx"
        sessions={props.sessions}
        className="h-[200px] lg:h-[800px] lg:border"
      >
        <div className="flex h-full w-full items-center justify-center">
          CHILDREN
        </div>
      </ChatPageLayout>
      <Toaster richColors />
    </BadgeContainer>
  );
}
