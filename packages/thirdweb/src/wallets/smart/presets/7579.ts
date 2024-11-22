import { AbiParameters, Hex } from "ox";
import { ZERO_ADDRESS } from "../../../constants/addresses.js";
import { getContract } from "../../../contract/contract.js";
import { getNonce } from "../../../extensions/erc4337/__generated__/IEntryPoint/read/getNonce.js";
import { execute } from "../../../extensions/erc7579/__generated__/IERC7579Account/write/execute.js";
import { prepareContractCall } from "../../../transaction/prepare-contract-call.js";
import { readContract } from "../../../transaction/read-contract.js";
import { isHex, stringToHex, toHex } from "../../../utils/encoding/hex.js";
import { ENTRYPOINT_ADDRESS_v0_7 } from "../lib/constants.js";
import { generateRandomUint192 } from "../lib/utils.js";
import type { SmartWalletOptions } from "../types.js";

// TODO (msa) publish and deterministic deploy
const DEFAULT_FACTORY_ADDRESS = "0xC32698FF63Ad82291C3580ce76baEeC3B846Ac01";

/**
 * Config for a ERC7579 modular smart wallet.
 *
 * @param options - Optional overrides for the smart wallet.
 * @returns The smart wallet options.
 *
 * @example
 * ```typescript
 * const modularSmartWallet = smartWallet(
 *   erc7579Config{
 *     chain: sepolia,
 *     sponsorGas: true,
 *   }),
 * });
 * ```
 *
 * @wallet
 */
export function erc7579Config(options: SmartWalletOptions): SmartWalletOptions {
  const saltHex =
    options.overrides?.accountSalt && isHex(options.overrides.accountSalt)
      ? options.overrides.accountSalt
      : stringToHex(options.overrides?.accountSalt ?? "");
  return {
    ...options,
    factoryAddress: options.factoryAddress || DEFAULT_FACTORY_ADDRESS,
    overrides: {
      entrypointAddress: ENTRYPOINT_ADDRESS_v0_7,
      createAccount(factoryContract, admin) {
        // TODO (msa) - let ppl pass in modules here
        return prepareContractCall({
          contract: factoryContract,
          method: "function createAccount(address owner, bytes salt)",
          params: [admin, saltHex],
        });
      },
      async predictAddress(factoryContract, admin) {
        return readContract({
          contract: factoryContract,
          method:
            "function getAddress(address owner, bytes salt) returns (address)",
          params: [admin, saltHex],
        });
      },
      execute(accountContract, transaction) {
        return execute({
          contract: accountContract,
          async asyncParams() {
            return {
              mode: Hex.padRight("0x00", 32), // single execution
              executionCalldata: AbiParameters.encodePacked(
                ["address", "uint256", "bytes"],
                [
                  transaction.to || ZERO_ADDRESS,
                  transaction.value || 0n,
                  transaction.data || "0x",
                ],
              ),
            };
          },
        });
      },
      executeBatch(accountContract, transactions) {
        return execute({
          contract: accountContract,
          async asyncParams() {
            return {
              mode: Hex.padRight("0x01", 32), // batch execution
              executionCalldata: AbiParameters.encode(
                [
                  {
                    type: "tuple[]",
                    components: [
                      { type: "address", name: "to" },
                      { type: "uint256", name: "value" },
                      { type: "bytes", name: "data" },
                    ],
                  },
                ],
                [
                  transactions.map((t) => ({
                    to: t.to || ZERO_ADDRESS,
                    value: t.value || 0n,
                    data: t.data || "0x",
                  })),
                ],
              ),
            };
          },
        });
      },
      async getAccountNonce(accountContract) {
        const factoryContract = getContract({
          address: options.factoryAddress || DEFAULT_FACTORY_ADDRESS,
          chain: accountContract.chain,
          client: accountContract.client,
        });
        const [entryPointNonce, defaultValidator] = await Promise.all([
          getNonce({
            contract: getContract({
              address: ENTRYPOINT_ADDRESS_v0_7,
              chain: accountContract.chain,
              client: accountContract.client,
            }),
            key: generateRandomUint192(),
            sender: accountContract.address,
          }),
          readContract({
            contract: factoryContract,
            method: "function defaultValidator() returns (address)",
          }),
        ]);
        // TODO (msa) - could be different if validator for the deployed account is different
        const withValidator = `${defaultValidator}${toHex(entryPointNonce).slice(42)}`;
        return Hex.toBigInt(withValidator as Hex.Hex);
      },
      ...options.overrides,
    },
  };
}
