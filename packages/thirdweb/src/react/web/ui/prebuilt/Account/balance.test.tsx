import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "~test/react-render.js";
import { TEST_CLIENT } from "~test/test-clients.js";
import { TEST_ACCOUNT_A } from "~test/test-wallets.js";
import { AccountBalance } from "./balance.js";
import { AccountProvider } from "./provider.js";

describe.runIf(process.env.TW_SECRET_KEY)("AccountBalance component", () => {
  it("should fallback properly if failed to load", () => {
    render(
      <AccountProvider address={TEST_ACCOUNT_A.address} client={TEST_CLIENT}>
        <AccountBalance
          chain={undefined}
          fallbackComponent={<span>oops</span>}
        />
      </AccountProvider>,
    );

    waitFor(() =>
      expect(
        screen.getByText("oops", {
          exact: true,
          selector: "span",
        }),
      ).toBeInTheDocument(),
    );
  });
});
