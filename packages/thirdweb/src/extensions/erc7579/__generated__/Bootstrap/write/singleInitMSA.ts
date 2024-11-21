import type { AbiParameterToPrimitiveType } from "abitype";
import type {
  BaseTransactionOptions,
  WithOverrides,
} from "../../../../../transaction/types.js";
import { prepareContractCall } from "../../../../../transaction/prepare-contract-call.js";
import { encodeAbiParameters } from "../../../../../utils/abi/encodeAbiParameters.js";
import { once } from "../../../../../utils/promise/once.js";
import { detectMethod } from "../../../../../utils/bytecode/detectExtension.js";

/**
 * Represents the parameters for the "singleInitMSA" function.
 */
export type SingleInitMSAParams = WithOverrides<{
  validator: AbiParameterToPrimitiveType<{
    type: "address";
    name: "validator";
  }>;
  data: AbiParameterToPrimitiveType<{ type: "bytes"; name: "data" }>;
}>;

export const FN_SELECTOR = "0x6b0d5cc4" as const;
const FN_INPUTS = [
  {
    type: "address",
    name: "validator",
  },
  {
    type: "bytes",
    name: "data",
  },
] as const;
const FN_OUTPUTS = [] as const;

/**
 * Checks if the `singleInitMSA` method is supported by the given contract.
 * @param availableSelectors An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.
 * @returns A boolean indicating if the `singleInitMSA` method is supported.
 * @extension ERC7579
 * @example
 * ```ts
 * import { isSingleInitMSASupported } from "thirdweb/extensions/erc7579";
 *
 * const supported = isSingleInitMSASupported(["0x..."]);
 * ```
 */
export function isSingleInitMSASupported(availableSelectors: string[]) {
  return detectMethod({
    availableSelectors,
    method: [FN_SELECTOR, FN_INPUTS, FN_OUTPUTS] as const,
  });
}

/**
 * Encodes the parameters for the "singleInitMSA" function.
 * @param options - The options for the singleInitMSA function.
 * @returns The encoded ABI parameters.
 * @extension ERC7579
 * @example
 * ```ts
 * import { encodeSingleInitMSAParams } from "thirdweb/extensions/erc7579";
 * const result = encodeSingleInitMSAParams({
 *  validator: ...,
 *  data: ...,
 * });
 * ```
 */
export function encodeSingleInitMSAParams(options: SingleInitMSAParams) {
  return encodeAbiParameters(FN_INPUTS, [options.validator, options.data]);
}

/**
 * Encodes the "singleInitMSA" function into a Hex string with its parameters.
 * @param options - The options for the singleInitMSA function.
 * @returns The encoded hexadecimal string.
 * @extension ERC7579
 * @example
 * ```ts
 * import { encodeSingleInitMSA } from "thirdweb/extensions/erc7579";
 * const result = encodeSingleInitMSA({
 *  validator: ...,
 *  data: ...,
 * });
 * ```
 */
export function encodeSingleInitMSA(options: SingleInitMSAParams) {
  // we do a "manual" concat here to avoid the overhead of the "concatHex" function
  // we can do this because we know the specific formats of the values
  return (FN_SELECTOR +
    encodeSingleInitMSAParams(options).slice(
      2,
    )) as `${typeof FN_SELECTOR}${string}`;
}

/**
 * Prepares a transaction to call the "singleInitMSA" function on the contract.
 * @param options - The options for the "singleInitMSA" function.
 * @returns A prepared transaction object.
 * @extension ERC7579
 * @example
 * ```ts
 * import { sendTransaction } from "thirdweb";
 * import { singleInitMSA } from "thirdweb/extensions/erc7579";
 *
 * const transaction = singleInitMSA({
 *  contract,
 *  validator: ...,
 *  data: ...,
 *  overrides: {
 *    ...
 *  }
 * });
 *
 * // Send the transaction
 * await sendTransaction({ transaction, account });
 * ```
 */
export function singleInitMSA(
  options: BaseTransactionOptions<
    | SingleInitMSAParams
    | {
        asyncParams: () => Promise<SingleInitMSAParams>;
      }
  >,
) {
  const asyncOptions = once(async () => {
    return "asyncParams" in options ? await options.asyncParams() : options;
  });

  return prepareContractCall({
    contract: options.contract,
    method: [FN_SELECTOR, FN_INPUTS, FN_OUTPUTS] as const,
    params: async () => {
      const resolvedOptions = await asyncOptions();
      return [resolvedOptions.validator, resolvedOptions.data] as const;
    },
    value: async () => (await asyncOptions()).overrides?.value,
    accessList: async () => (await asyncOptions()).overrides?.accessList,
    gas: async () => (await asyncOptions()).overrides?.gas,
    gasPrice: async () => (await asyncOptions()).overrides?.gasPrice,
    maxFeePerGas: async () => (await asyncOptions()).overrides?.maxFeePerGas,
    maxPriorityFeePerGas: async () =>
      (await asyncOptions()).overrides?.maxPriorityFeePerGas,
    nonce: async () => (await asyncOptions()).overrides?.nonce,
    extraGas: async () => (await asyncOptions()).overrides?.extraGas,
    erc20Value: async () => (await asyncOptions()).overrides?.erc20Value,
  });
}