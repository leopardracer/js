import {
  getAuthToken,
  getAuthTokenWalletAddress,
} from "../../../api/lib/getAuthToken";
import { loginRedirect } from "../../../login/loginRedirect";
import { ChatPageContent } from "../components/ChatPageContent";

export default async function Page() {
  const authToken = await getAuthToken();

  if (!authToken) {
    loginRedirect();
  }

  const accountAddress = await getAuthTokenWalletAddress();

  if (!accountAddress) {
    loginRedirect();
  }

  return (
    <ChatPageContent
      accountAddress={accountAddress}
      authToken={authToken}
      session={undefined}
      type="new-chat"
    />
  );
}
