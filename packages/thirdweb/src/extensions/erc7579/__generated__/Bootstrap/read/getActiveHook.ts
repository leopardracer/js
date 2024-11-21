import { readContract } from "../../../../../transaction/read-contract.js";
import type { BaseTransactionOptions } from "../../../../../transaction/types.js";

import { decodeAbiParameters } from "viem";
import type { Hex } from "../../../../../utils/encoding/hex.js";
import { detectMethod } from "../../../../../utils/bytecode/detectExtension.js";

export const FN_SELECTOR = "0x0a664dba" as const;
const FN_INPUTS = [] as const;
const FN_OUTPUTS = [
  {
    type: "address",
    name: "hook",
  },
] as const;

/**
 * Checks if the `getActiveHook` method is supported by the given contract.
 * @param availableSelectors An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.
 * @returns A boolean indicating if the `getActiveHook` method is supported.
 * @extension ERC7579
 * @example
 * ```ts
 * import { isGetActiveHookSupported } from "thirdweb/extensions/erc7579";
 * const supported = isGetActiveHookSupported(["0x..."]);
 * ```
 */
export function isGetActiveHookSupported(availableSelectors: string[]) {
  return detectMethod({
    availableSelectors,
    method: [FN_SELECTOR, FN_INPUTS, FN_OUTPUTS] as const,
  });
}

/**
 * Decodes the result of the getActiveHook function call.
 * @param result - The hexadecimal result to decode.
 * @returns The decoded result as per the FN_OUTPUTS definition.
 * @extension ERC7579
 * @example
 * ```ts
 * import { decodeGetActiveHookResult } from "thirdweb/extensions/erc7579";
 * const result = decodeGetActiveHookResultResult("...");
 * ```
 */
export function decodeGetActiveHookResult(result: Hex) {
  return decodeAbiParameters(FN_OUTPUTS, result)[0];
}

/**
 * Calls the "getActiveHook" function on the contract.
 * @param options - The options for the getActiveHook function.
 * @returns The parsed result of the function call.
 * @extension ERC7579
 * @example
 * ```ts
 * import { getActiveHook } from "thirdweb/extensions/erc7579";
 *
 * const result = await getActiveHook({
 *  contract,
 * });
 *
 * ```
 */
export async function getActiveHook(options: BaseTransactionOptions) {
  return readContract({
    contract: options.contract,
    method: [FN_SELECTOR, FN_INPUTS, FN_OUTPUTS] as const,
    params: [],
  });
}