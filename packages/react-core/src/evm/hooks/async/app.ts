import {
  RequiredParam,
  requiredParamInvariant,
} from "../../../core/query-utils/required-param";
import {
  cacheKeys, invalidateContractAndBalances,
} from "../../utils/cache-keys";
import { useQueryWithNetwork } from "../query-utils/useQueryWithNetwork";
import {
  SmartContract,
} from "@thirdweb-dev/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import invariant from "tiny-invariant";
import { useSDKChainId } from "../../providers/thirdweb-sdk-provider";

/**
 * Use this to get the appURI of a deployed {@link SmartContract}
 *
 * @example
 * ```javascript
 * const { data: contractMetadata, isLoading, error } = useAppURI(SmartContract;
 * ```
 *
 * @param contract - the {@link SmartContract} instance of the contract to get the appURI of
 * @returns a response object that includes the appURI of the contract
 * @twfeature AppURI
 * @beta
 */
export function useAppURI<TContract extends SmartContract>(
  contract: RequiredParam<TContract>,
) {
  return useQueryWithNetwork<string>(
    cacheKeys.contract.app.get(contract?.getAddress()),
    async () => {
      requiredParamInvariant(contract, "Contract is required");
      invariant(
        "appURI" in contract && contract.appURI,
        "Contract does not support appURI",
      );
      return await contract.appURI.get();
    },
    {
      enabled: !!contract,
    },
  );
}

/**
 * Use this to update the appURI of your {@link SmartContract}
 * @example
 * ```jsx
 * const Component = () => {
 *   const {
 *     mutate: useSetAppURI,
 *     isLoading,
 *     error,
 *   } = useSetAppURI(SmartContract);
 *
 *   if (error) {
 *     console.error("failed to update appURI", error);
 *   }
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => useSetAppURI({ uri })}
 *     >
 *       Update App URI
 *     </button>
 *   );
 * };
 * ```
 * @param contract - an instance of a {@link SmartContract}
 * @returns a mutation object that can be used to update the appURI of a contract
 * @twfeature AppURI
 * @beta
 */
export function useSetAppURI(
  contract: RequiredParam<SmartContract>,
) {
  const queryClient = useQueryClient();
  const contractAddress = contract?.getAddress();
  const activeChainId = useSDKChainId();
  return useMutation(
    (params: { uri: string }) => {
      requiredParamInvariant(contract, "Contract is required");
      invariant(
        "appURI" in contract && contract.appURI,
        "Contract does not support appURI",
      );
      return contract.appURI.set(params.uri);
    },
    {
      onSettled: () =>
        invalidateContractAndBalances(
          queryClient,
          contractAddress,
          activeChainId,
        ),
    },
  );
}