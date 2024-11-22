import {} from "viem";
import { beforeAll, describe, expect, it } from "vitest";
import { TEST_CLIENT } from "../../../test/src/test-clients.js";
import { TEST_ACCOUNT_A } from "../../../test/src/test-wallets.js";
import { baseSepolia } from "../../chains/chain-definitions/base-sepolia.js";
import { type ThirdwebContract, getContract } from "../../contract/contract.js";
import { sendBatchTransaction } from "../../transaction/actions/send-batch-transaction.js";
import { sendTransaction } from "../../transaction/actions/send-transaction.js";
import { prepareTransaction } from "../../transaction/prepare-transaction.js";
import type { Address } from "../../utils/address.js";
import type { Account, Wallet } from "../interfaces/wallet.js";
import { erc7579Config } from "./presets/7579.js";
import { smartWallet } from "./smart-wallet.js";
let wallet: Wallet;
let smartAccount: Account;
let smartWalletAddress: Address;
let personalAccount: Account;
let accountContract: ThirdwebContract;

const chain = baseSepolia;
const client = TEST_CLIENT;

import { isContractDeployed } from "../../utils/bytecode/is-contract-deployed.js";
import { generateAccount } from "../utils/generateAccount.js";
import { confirmContractDeployment } from "./index.js";
describe.runIf(process.env.TW_SECRET_KEY).sequential(
  "SmartWallet modular tests",
  {
    retry: 0,
    timeout: 240_000,
  },
  () => {
    beforeAll(async () => {
      personalAccount = await generateAccount({
        client,
      });
      wallet = smartWallet(
        erc7579Config({
          chain,
          sponsorGas: true,
        }),
      );
      smartAccount = await wallet.connect({
        client: TEST_CLIENT,
        personalAccount,
      });
      smartWalletAddress = smartAccount.address as Address;
      accountContract = getContract({
        address: smartWalletAddress,
        chain,
        client,
      });
    });

    it("can connect", async () => {
      expect(smartWalletAddress).toHaveLength(42);
    });

    it("can sign a msg", async () => {
      await smartAccount.signMessage({ message: "hello world" });
      const isDeployed = await isContractDeployed(accountContract);
      expect(isDeployed).toEqual(true);
    });

    it("should send a transaction", async () => {
      const tx = prepareTransaction({
        client,
        chain,
        to: smartAccount.address,
        value: 0n,
      });

      console.log("Sending transaction...");
      const receipt = await sendTransaction({
        transaction: tx,
        account: smartAccount,
      });
      console.log("Transaction sent:", receipt.transactionHash);
      expect(receipt.transactionHash).toBeDefined();

      await confirmContractDeployment({
        accountContract,
      });
    });

    it("should send a batch transaction", async () => {
      const tx = prepareTransaction({
        client,
        chain,
        to: smartAccount.address,
        value: 0n,
      });

      const tx2 = prepareTransaction({
        client,
        chain,
        to: TEST_ACCOUNT_A.address,
        value: 0n,
      });

      console.log("Sending batch transaction...");
      const receipt = await sendBatchTransaction({
        transactions: [tx, tx2],
        account: smartAccount,
      });
      console.log("Transaction sent:", receipt.transactionHash);
      expect(receipt.transactionHash).toBeDefined();
    });
  },
);
