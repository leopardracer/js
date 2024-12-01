import { readContract } from "../../../../../transaction/read-contract.js";
import type { BaseTransactionOptions } from "../../../../../transaction/types.js";

import { decodeAbiParameters } from "viem";
import type { Hex } from "../../../../../utils/encoding/hex.js";
import { detectMethod } from "../../../../../utils/bytecode/detectExtension.js";

export const FN_SELECTOR = "0xa0a8e460" as const;
const FN_INPUTS = [] as const;
const FN_OUTPUTS = [
  {
    type: "uint8",
  },
] as const;

/**
 * Checks if the `contractVersion` method is supported by the given contract.
 * @param availableSelectors An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.
 * @returns A boolean indicating if the `contractVersion` method is supported.
 * @extension ERC721
 * @example
 * ```ts
 * import { isContractVersionSupported } from "thirdweb/extensions/erc721";
 * const supported = isContractVersionSupported(["0x..."]);
 * ```
 */
export function isContractVersionSupported(availableSelectors: string[]) {
  return detectMethod({
    availableSelectors,
    method: [FN_SELECTOR, FN_INPUTS, FN_OUTPUTS] as const,
  });
}

/**
 * Decodes the result of the contractVersion function call.
 * @param result - The hexadecimal result to decode.
 * @returns The decoded result as per the FN_OUTPUTS definition.
 * @extension ERC721
 * @example
 * ```ts
 * import { decodeContractVersionResult } from "thirdweb/extensions/erc721";
 * const result = decodeContractVersionResultResult("...");
 * ```
 */
export function decodeContractVersionResult(result: Hex) {
  return decodeAbiParameters(FN_OUTPUTS, result)[0];
}

/**
 * Calls the "contractVersion" function on the contract.
 * @param options - The options for the contractVersion function.
 * @returns The parsed result of the function call.
 * @extension ERC721
 * @example
 * ```ts
 * import { contractVersion } from "thirdweb/extensions/erc721";
 *
 * const result = await contractVersion({
 *  contract,
 * });
 *
 * ```
 */
export async function contractVersion(options: BaseTransactionOptions) {
  return readContract({
    contract: options.contract,
    method: [FN_SELECTOR, FN_INPUTS, FN_OUTPUTS] as const,
    params: [],
  });
}
