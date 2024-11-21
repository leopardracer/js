import type React from "react";
import { getValidAccount } from "../../account/settings/getAccount";
import {
  getAuthToken,
  getAuthTokenWalletAddress,
} from "../../api/lib/getAuthToken";
import { loginRedirect } from "../../login/loginRedirect";
import { getSessions } from "./api/session";
import { ChatPageLayout } from "./components/ChatPageLayout";

export default async function Layout(props: {
  children: React.ReactNode;
}) {
  await getValidAccount();

  const authToken = await getAuthToken();

  if (!authToken) {
    loginRedirect();
  }

  const accountAddress = await getAuthTokenWalletAddress();

  if (!accountAddress) {
    loginRedirect();
  }

  const sessions = await getSessions({
    authToken,
  }).catch(() => []);

  return (
    <ChatPageLayout
      accountAddress={accountAddress}
      authToken={authToken}
      sessions={sessions.map((s) => ({
        id: s.id,
        title: s.title || s.id,
      }))}
    >
      {props.children}
    </ChatPageLayout>
  );
}
