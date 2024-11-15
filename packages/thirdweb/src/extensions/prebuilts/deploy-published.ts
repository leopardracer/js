import type { AbiFunction } from "abitype";
import type { Chain } from "../../chains/types.js";
import type { ThirdwebClient } from "../../client/client.js";
import { type ThirdwebContract, getContract } from "../../contract/contract.js";
import { fetchPublishedContractMetadata } from "../../contract/deployment/publisher.js";
import { getOrDeployInfraContractFromMetadata } from "../../contract/deployment/utils/bootstrap.js";
import { sendAndConfirmTransaction } from "../../transaction/actions/send-and-confirm-transaction.js";
import { simulateTransaction } from "../../transaction/actions/simulate.js";
import { prepareContractCall } from "../../transaction/prepare-contract-call.js";
import { resolveMethod } from "../../transaction/resolve-method.js";
import { encodeAbiParameters } from "../../utils/abi/encodeAbiParameters.js";
import { normalizeFunctionParams } from "../../utils/abi/normalizeFunctionParams.js";
import { getAddress } from "../../utils/address.js";
import {
  type CompilerMetadata,
  fetchBytecodeFromCompilerMetadata,
} from "../../utils/any-evm/deploy-metadata.js";
import type { FetchDeployMetadataResult } from "../../utils/any-evm/deploy-metadata.js";
import type { Hex } from "../../utils/encoding/hex.js";
import type { Account } from "../../wallets/interfaces/wallet.js";
import { getAllDefaultConstructorParamsForImplementation } from "./get-required-transactions.js";

/**
 * @extension DEPLOY
 */
export type DeployPublishedContractOptions = {
  client: ThirdwebClient;
  chain: Chain;
  account: Account;
  contractId: string;
  contractParams?: Record<string, unknown>;
  publisher?: string;
  version?: string;
  implementationConstructorParams?: Record<string, unknown>;
  salt?: string;
};

/**
 * Deploy an instance of a published contract on a given chain
 * @param options - the deploy options
 * @returns a promise that resolves to the deployed contract address
 * @example
 *
 * ## Deploying a published contract
 *
 * ```ts
 * import { deployPublishedContract } from "thirdweb/deploys";
 *
 * const address = await deployedPublishedContract({
 *   client,
 *   chain,
 *   account,
 *   contractId: "MyPublishedContract",
 *   contractParams: {
 *     param1: "value1",
 *     param2: 123,
 *   },
 *   publisher: "0x...", // optional, defaults to the thirdweb deployer
 * });
 * ```
 *
 *  ## Deploying a published contract deterministically
 *
 * ```ts
 * import { deployPublishedContract } from "thirdweb/deploys";
 *
 * const address = await deployedPublishedContract({
 *   client,
 *   chain,
 *   account,
 *   contractId: "MyPublishedContract",
 *   contractParams: {
 *     param1: "value1",
 *     param2: 123,
 *   },
 *   publisher: "0x...",
 *   salt: "your-salt", // this will deterministically deploy the contract at the same address on all chains
 * });
 * ```
 * @extension DEPLOY
 */
export async function deployPublishedContract(
  options: DeployPublishedContractOptions,
): Promise<string> {
  const {
    client,
    account,
    chain,
    contractId,
    contractParams,
    publisher,
    version,
    implementationConstructorParams,
    salt,
  } = options;
  const deployMetadata = await fetchPublishedContractMetadata({
    client,
    contractId,
    publisher,
    version,
  });

  return deployContractfromDeployMetadata({
    account,
    chain,
    deployMetadata,
    client,
    initializeParams: contractParams || deployMetadata.constructorParams,
    implementationConstructorParams:
      implementationConstructorParams || deployMetadata.implConstructorParams,
    salt,
  });
}

/**
 * @internal
 */
export type DeployContractfromDeployMetadataOptions = {
  client: ThirdwebClient;
  chain: Chain;
  account: Account;
  deployMetadata: FetchDeployMetadataResult;
  initializeParams?: Record<string, unknown>;
  implementationConstructorParams?: Record<string, unknown>;
  modules?: {
    deployMetadata: FetchDeployMetadataResult;
    initializeParams?: Record<string, unknown>;
  }[];
  salt?: string;
};

interface DynamicParams {
  type: "address" | "address[]" | "bytes" | "bytes[]";
  refContracts: {
    publisherAddress: string;
    version: string;
    contractId: string;
    salt?: string;
  }[];
  decodedBytes: Array<
    Array<{
      type: string;
      defaultValue?: string;
      dynamicValue?: DynamicParams;
    }>
  >;
}

interface ImplementationConstructorParam {
  defaultValue?: string;
  dynamicValue?: DynamicParams;
}

type ProcessRefDeploymentsOptions = {
  client: ThirdwebClient;
  chain: Chain;
  account: Account;
  paramValue: string | ImplementationConstructorParam;
};

async function processRefDeployments(
  options: ProcessRefDeploymentsOptions,
): Promise<string> {
  const { client, account, chain, paramValue } = options;

  try {
    if (typeof paramValue === "object") {
      if (
        "defaultValue" in paramValue &&
        paramValue.defaultValue &&
        paramValue.defaultValue.length > 0
      ) {
        return paramValue.defaultValue;
      }

      if ("dynamicValue" in paramValue && paramValue.dynamicValue) {
        const dynamicValue = paramValue.dynamicValue;
        const contracts = dynamicValue.refContracts;

        if (dynamicValue.type === "address") {
          const salt =
            contracts[0]?.salt && contracts[0]?.salt.length > 0
              ? contracts[0]?.salt
              : undefined;
          // Call the fetchAndDeployContract function with the ref data
          const addr = await deployPublishedContract({
            client,
            chain,
            account,
            contractId: contracts[0]?.contractId as string,
            publisher: contracts[0]?.publisherAddress,
            version: contracts[0]?.version,
            salt,
          });

          return addr;
        }

        if (dynamicValue.type === "address[]") {
          const addressArray = [];

          for (const c of contracts) {
            const salt = c?.salt && c?.salt.length > 0 ? c?.salt : undefined;

            addressArray.push(
              await deployPublishedContract({
                client,
                chain,
                account,
                contractId: c.contractId,
                publisher: c.publisherAddress,
                version: c.version,
                salt,
              }),
            );
          }

          return JSON.stringify(addressArray);
        }

        if (dynamicValue.type === "bytes") {
          console.log("process bytes 1");
          const decodedBytes = dynamicValue.decodedBytes[0];

          if (decodedBytes) {
            const types = [];
            const values = [];
            for (const v of decodedBytes) {
              types.push(v.type);

              if (v.defaultValue) {
                values.push(v.defaultValue);
              }

              if (v.dynamicValue) {
                values.push(
                  await processRefDeployments({
                    client,
                    account,
                    chain,
                    paramValue: v,
                  }),
                );
              }
            }

            return encodeAbiParameters(
              types.map((t) => {
                return { name: "", type: t };
              }),
              values,
            );
          }
        }

        if (dynamicValue.type === "bytes[]") {
          console.log("process bytes[] 1");
          const bytesArray = [];
          const decodedBytesArray = dynamicValue.decodedBytes;

          for (const a of decodedBytesArray) {
            const decodedBytes = a;

            if (decodedBytes) {
              const types = [];
              const values = [];
              for (const v of decodedBytes) {
                types.push(v.type);

                if (v.defaultValue) {
                  values.push(v.defaultValue);
                }

                if (v.dynamicValue) {
                  values.push(
                    await processRefDeployments({
                      client,
                      account,
                      chain,
                      paramValue: v,
                    }),
                  );
                }
              }

              bytesArray.push(
                encodeAbiParameters(
                  types.map((t) => {
                    return { name: "", type: t };
                  }),
                  values,
                ),
              );
            }
          }

          return JSON.stringify(bytesArray);
        }
      }
    }
    // biome-ignore lint/suspicious/noExplicitAny: catch multiple errors
  } catch (e: any) {
    const err = "error" in e ? e.error?.message : e?.message;

    if (err.toString().includes("Contract already deployed")) {
      return paramValue as string;
    }

    throw e;
  }

  return paramValue as string;
}

/**
 * @internal
 */
export async function deployContractfromDeployMetadata(
  options: DeployContractfromDeployMetadataOptions,
): Promise<string> {
  const {
    client,
    account,
    chain,
    initializeParams,
    deployMetadata,
    implementationConstructorParams,
    modules,
    salt,
  } = options;

  const processedImplParams: Record<string, string> = {};
  for (const key in implementationConstructorParams) {
    processedImplParams[key] = await processRefDeployments({
      client,
      account,
      chain,
      paramValue: implementationConstructorParams[key] as
        | string
        | ImplementationConstructorParam,
    });
  }

  const processedInitializeParams: Record<string, string> = {};
  for (const key in initializeParams) {
    processedInitializeParams[key] = await processRefDeployments({
      client,
      account,
      chain,
      paramValue: initializeParams[key] as
        | string
        | ImplementationConstructorParam,
    });
  }

  switch (deployMetadata?.deployType) {
    case "standard": {
      return directDeploy({
        account,
        client,
        chain,
        compilerMetadata: deployMetadata,
        contractParams: processedInitializeParams,
        salt,
      });
    }
    case "autoFactory": {
      const [
        { deployViaAutoFactory },
        { getOrDeployInfraForPublishedContract },
      ] = await Promise.all([
        import("../../contract/deployment/deploy-via-autofactory.js"),
        import("../../contract/deployment/utils/bootstrap.js"),
      ]);
      const { cloneFactoryContract, implementationContract } =
        await getOrDeployInfraForPublishedContract({
          chain,
          client,
          account,
          contractId: deployMetadata.name,
          constructorParams:
            processedImplParams ||
            (await getAllDefaultConstructorParamsForImplementation({
              chain,
              client,
            })),
          publisher: deployMetadata.publisher,
        });

      const initializeTransaction = await getInitializeTransaction({
        client,
        chain,
        deployMetadata: deployMetadata,
        implementationContract,
        initializeParams: processedInitializeParams,
        account,
        modules,
      });

      return deployViaAutoFactory({
        client,
        chain,
        account,
        cloneFactoryContract,
        initializeTransaction,
        salt,
      });
    }
    case "customFactory": {
      if (!deployMetadata?.factoryDeploymentData?.customFactoryInput) {
        throw new Error("No custom factory info found");
      }
      const factoryAddress =
        deployMetadata?.factoryDeploymentData?.customFactoryInput
          ?.customFactoryAddresses?.[chain.id];
      const factoryFunction =
        deployMetadata.factoryDeploymentData?.customFactoryInput
          ?.factoryFunction;
      if (!factoryAddress || !factoryFunction) {
        throw new Error(`No factory address found on chain ${chain.id}`);
      }

      const factory = getContract({
        client,
        chain,
        address: factoryAddress,
      });
      const method = await resolveMethod(factoryFunction)(factory);
      const deployTx = prepareContractCall({
        contract: factory,
        method,
        params: normalizeFunctionParams(method, initializeParams),
      });
      // asumption here is that the factory address returns the deployed proxy address
      const address = await simulateTransaction({
        transaction: deployTx,
      });
      await sendAndConfirmTransaction({
        transaction: deployTx,
        account,
      });
      return address as string;
    }
    case undefined: {
      // Default to standard deployment if none was specified
      return directDeploy({
        account,
        client,
        chain,
        compilerMetadata: deployMetadata,
        contractParams: processedInitializeParams,
        salt,
      });
    }
    default:
      // If a deployType was specified but we don't support it, throw an error
      throw new Error(`Unsupported deploy type: ${deployMetadata?.deployType}`);
  }
}

async function directDeploy(options: {
  account: Account;
  client: ThirdwebClient;
  chain: Chain;
  compilerMetadata: CompilerMetadata;
  contractParams?: Record<string, unknown>;
  salt?: string;
}): Promise<string> {
  const { account, client, chain, compilerMetadata, contractParams, salt } =
    options;

  const { deployContract } = await import(
    "../../contract/deployment/deploy-with-abi.js"
  );
  return deployContract({
    account,
    client,
    chain,
    bytecode: await fetchBytecodeFromCompilerMetadata({
      compilerMetadata,
      client,
      chain,
    }),
    abi: compilerMetadata.abi,
    constructorParams: contractParams,
    salt,
  });
}

async function getInitializeTransaction(options: {
  client: ThirdwebClient;
  chain: Chain;
  account: Account;
  implementationContract: ThirdwebContract;
  deployMetadata: FetchDeployMetadataResult;
  initializeParams?: Record<string, unknown>;
  modules?: {
    deployMetadata: FetchDeployMetadataResult;
    initializeParams?: Record<string, unknown>;
  }[];
}) {
  const {
    account,
    client,
    chain,
    deployMetadata: metadata,
    initializeParams = {},
    implementationContract,
    modules = [],
  } = options;

  const initializeFunction = metadata.abi.find(
    (i) =>
      i.type === "function" &&
      i.name ===
        (metadata.factoryDeploymentData?.implementationInitializerFunction ||
          "initialize"),
  ) as AbiFunction;
  if (!initializeFunction) {
    throw new Error(`Could not find initialize function for ${metadata.name}`);
  }

  const hasModules =
    initializeFunction.inputs.find(
      (i) => i.name === "modules" || i.name === "_modules",
    ) &&
    initializeFunction.inputs.find(
      (i) => i.name === "moduleInstallData" || i.name === "_moduleInstallData",
    );
  if (hasModules) {
    const moduleAddresses: Hex[] = [];
    const moduleInstallData: Hex[] = [];
    for (const module of modules) {
      // deploy the module if not already deployed
      const contract = await getOrDeployInfraContractFromMetadata({
        client,
        chain,
        account,
        contractMetadata: module.deployMetadata,
      });

      const installFunction = module.deployMetadata.abi.find(
        (i) => i.type === "function" && i.name === "encodeBytesOnInstall",
      ) as AbiFunction | undefined;

      moduleAddresses.push(getAddress(contract.address));
      moduleInstallData.push(
        installFunction
          ? encodeAbiParameters(
              installFunction.inputs,
              normalizeFunctionParams(installFunction, module.initializeParams),
            )
          : "0x",
      );
    }
    initializeParams.modules = moduleAddresses;
    initializeParams.moduleInstallData = moduleInstallData;
  }

  const initializeTransaction = prepareContractCall({
    contract: getContract({
      client,
      chain,
      address: implementationContract.address,
    }),
    method: initializeFunction,
    params: normalizeFunctionParams(initializeFunction, initializeParams),
  });
  return initializeTransaction;
}
