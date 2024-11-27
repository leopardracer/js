"use client";

import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import type React from "react";
import type { JSX } from "react";
import type { Chain } from "../../../../../chains/types.js";
import { NATIVE_TOKEN_ADDRESS } from "../../../../../constants/addresses.js";
import { convertCryptoToFiat } from "../../../../../exports/pay.js";
import { useActiveWalletChain } from "../../../../../react/core/hooks/wallets/useActiveWalletChain.js";
import { formatNumber } from "../../../../../utils/formatNumber.js";
import { shortenLargeNumber } from "../../../../../utils/shortenLargeNumber.js";
import { getWalletBalance } from "../../../../../wallets/utils/getWalletBalance.js";
import { useAccountContext } from "./provider.js";

/**
 * @internal
 */
export type AccountBalanceFormatParams = {
  tokenBalance: number;
  tokenSymbol: string;
  fiatBalance?: number;
  fiatSymbol?: string;
};

/**
 * Props for the AccountBalance component
 * @component
 * @wallet
 */
export interface AccountBalanceProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /**
   * The network to fetch balance on
   * If not passed, the component will use the current chain that the wallet is connected to (`useActiveWalletChain()`)
   */
  chain?: Chain;
  /**
   * By default this component will fetch the balance for the native token on a given chain
   * If you want to fetch balance for an ERC20 token, use the `tokenAddress` props
   */
  tokenAddress?: string;
  /**
   * A function to format the balance's display value
   * use this function to transform the balance display value like round up the number
   * Particularly useful to avoid overflowing-UI issues
   */
  formatFn?: (props: AccountBalanceFormatParams) => string;
  /**
   * This component will be shown while the balance of the account is being fetched
   * If not passed, the component will return `null`.
   *
   * You can/should pass a loading sign or spinner to this prop.
   * @example
   * ```tsx
   * <AccountBalance
   *   chain={ethereum}
   *   loadingComponent={<Spinner />}
   * />
   * ```
   */
  loadingComponent?: JSX.Element;
  /**
   * This component will be shown if the balance fails to be retreived
   * If not passed, the component will return `null`.
   *
   * You can/should pass a descriptive text/component to this prop, indicating that the
   * balance was not fetched succesfully
   * @example
   * ```tsx
   * <AccountBalance
   *   chain={nonExistentChain}
   *   fallbackComponent={"Failed to load"}
   * />
   * ```
   */
  fallbackComponent?: JSX.Element;
  /**
   * Optional `useQuery` params
   */
  queryOptions?: Omit<
    UseQueryOptions<AccountBalanceFormatParams>,
    "queryFn" | "queryKey"
  >;

  showFiatValue?: "USD";
}

/**
 * This component fetches and shows the balance of the wallet address on a given chain.
 * It inherits all the attributes of a HTML <span> component, hence you can style it just like how you would style a normal <span>
 *
 *
 * @example
 * ### Basic usage
 * ```tsx
 * import { AccountProvider, AccountBalance } from "thirdweb/react";
 * import { ethereum } from "thirdweb/chains";
 *
 * <AccountProvider address="0x...">
 *   <AccountBalance chain={ethereum} />
 * </AccountProvider>
 * ```
 * Result:
 * ```html
 * <span>1.091435 ETH</span>
 * ```
 *
 *
 * ### Format the balance (round up, shorten etc.)
 * The AccountBalance component accepts a `formatFn` which takes in a number and outputs a number
 * The function is used to modify the display value of the wallet balance
 *
 * ```tsx
 * const roundTo1Decimal = (num: number):number => Math.round(num * 10) / 10;
 *
 * <AccountBalance formatFn={roundTo1Decimal} />
 * ```
 *
 * Result:
 * ```html
 * <span>1.1 ETH</span>
 * ```
 *
 * ### Show a loading sign when the balance is being fetched
 * ```tsx
 * import { AccountProvider, AccountBalance } from "thirdweb/react";
 *
 * <AccountProvider address="0x...">
 *   <AccountBalance
 *     chain={ethereum}
 *     loadingComponent={<Spinner />}
 *   />
 * </AccountProvider>
 * ```
 *
 * ### Fallback to something when the balance fails to resolve
 * ```tsx
 * <AccountProvider address="0x...">
 *   <AccountBalance
 *     chain={nonExistentChain}
 *     fallbackComponent={"Failed to load"}
 *   />
 * </AccountProvider>
 * ```
 *
 * ### Custom query options for useQuery
 * This component uses `@tanstack-query`'s useQuery internally.
 * You can use the `queryOptions` prop for more fine-grained control
 * ```tsx
 * <AccountBalance
 *   queryOptions={{
 *     enabled: isEnabled,
 *     retry: 4,
 *   }}
 * />
 * ```
 *
 * @component
 * @wallet
 * @beta
 */
export function AccountBalance({
  chain,
  tokenAddress,
  loadingComponent,
  fallbackComponent,
  queryOptions,
  formatFn,
  showFiatValue,
  ...restProps
}: AccountBalanceProps) {
  const { address, client } = useAccountContext();
  const walletChain = useActiveWalletChain();
  const chainToLoad = chain || walletChain;
  const balanceQuery = useQuery({
    queryKey: [
      "walletBalance",
      chainToLoad?.id || -1,
      address || "0x0",
      { tokenAddress },
      showFiatValue,
    ] as const,
    queryFn: async (): Promise<AccountBalanceFormatParams> => {
      if (!chainToLoad) {
        throw new Error("chain is required");
      }
      if (!client) {
        throw new Error("client is required");
      }
      const tokenBalanceData = await getWalletBalance({
        chain: chainToLoad,
        client,
        address,
        tokenAddress,
      });

      if (!tokenBalanceData) {
        throw new Error(
          `Failed to retrieve ${tokenAddress ? `token: ${tokenAddress}` : "native token"} balance for address: ${address} on chainId:${chainToLoad.id}`,
        );
      }

      if (showFiatValue) {
        const fiatData = await convertCryptoToFiat({
          fromAmount: Number(tokenBalanceData.displayValue),
          fromTokenAddress: tokenAddress || NATIVE_TOKEN_ADDRESS,
          to: showFiatValue,
          chain: chainToLoad,
          client,
        }).catch(() => undefined);

        // We can never support 100% of token out there, so if something fails to resolve, it's expected
        // in that case just return the tokenBalance and symbol
        return {
          tokenBalance: Number(tokenBalanceData.displayValue),
          tokenSymbol: tokenBalanceData.symbol,
          fiatBalance: fiatData?.result,
          fiatSymbol: fiatData?.result
            ? new Intl.NumberFormat("en", {
                style: "currency",
                currency: showFiatValue,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
                .formatToParts(0)
                .find((p) => p.type === "currency")?.value ||
              showFiatValue.toUpperCase()
            : undefined,
        };
      }

      return {
        tokenBalance: Number(tokenBalanceData.displayValue),
        tokenSymbol: tokenBalanceData.symbol,
      };
    },
    ...queryOptions,
  });

  if (balanceQuery.isLoading) {
    return loadingComponent || null;
  }

  if (!balanceQuery.data) {
    return fallbackComponent || null;
  }

  if (formatFn) {
    return <span {...restProps}>{formatFn(balanceQuery.data)}</span>;
  }

  return (
    <span {...restProps}>
      {formatAccountBalanceForButton(balanceQuery.data)}
    </span>
  );
}

/**
 * Format the display balance for both crypto and fiat, in the Details button and Modal
 * If both crypto balance and fiat balance exist, we have to keep the string very short to avoid UI issues.
 * @internal
 */
function formatAccountBalanceForButton(
  props: AccountBalanceFormatParams,
): string {
  if (props.fiatBalance && props.fiatSymbol) {
    // Need to keep them short to avoid UI overflow issues
    const formattedTokenBalance = formatNumber(props.tokenBalance, 1);
    const num = formatNumber(props.fiatBalance, 0);
    const formattedFiatBalance = shortenLargeNumber(num);
    return `${formattedTokenBalance} ${props.tokenSymbol} (${props.fiatSymbol}${formattedFiatBalance})`;
  }
  const formattedTokenBalance = formatNumber(
    props.tokenBalance,
    props.tokenBalance < 1 ? 5 : 4,
  );
  return `${formattedTokenBalance} ${props.tokenSymbol}`;
}
