import { Engine } from "@thirdweb-dev/engine";
import type { Address } from "thirdweb";
import * as dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";

dotenv.config();

const BASESEP_CHAIN_ID = "84532";
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET as string;

console.log("Environment Variables:");
console.log("CHAIN_ID:", BASESEP_CHAIN_ID);
console.log("BACKEND_WALLET_ADDRESS:", BACKEND_WALLET_ADDRESS);
console.log("ENGINE_URL:", process.env.ENGINE_URL);
console.log("ACCESS_TOKEN:", process.env.ACCESS_TOKEN ? "Set" : "Not Set");

const engine = new Engine({
  url: process.env.ENGINE_URL as string,
  accessToken: process.env.ACCESS_TOKEN as string,
});

type TransactionStatus = "Queued" | "Sent" | "Mined" | "error";

interface ClaimResult {
  queueId: string;
  status: TransactionStatus;
  transactionHash?: string | undefined | null;
  blockExplorerUrl?: string | undefined | null;
  errorMessage?: string;
  toAddress?: string;
  amount?: string;
  chainId?: string;
  timestamp?: number;
}

const chain = "84532";

type Receiver = {
  toAddress: Address;
  amount: string;
};

export async function POST(req: NextRequest) {
  try {
    const { data, contractAddress } = await req.json();
    
    console.log("Received request with:", {
      contractAddress,
      dataLength: data.length,
      sampleData: data[0]
    });

    const receivers: Receiver[] = data.map((entry: any) => ({
      toAddress: entry.toAddress as Address,
      amount: entry.amount,
    }));

    const chunks: Receiver[][] = [];
    const chunkSize = 10;
    for (let i = 0; i < receivers.length; i += chunkSize) {
      chunks.push(receivers.slice(i, i + chunkSize));
    }

    // Process first chunk and return immediately with queued status
    const firstChunk = chunks[0];
    const res = await engine.erc20.mintBatchTo(
      chain,
      contractAddress,
      BACKEND_WALLET_ADDRESS,
      {
        data: firstChunk,
      }
    );

    // Return initial queued status
    const initialResult = {
      queueId: res.result.queueId,
      status: "Queued" as const,
      addresses: firstChunk.map(r => r.toAddress),
      amounts: firstChunk.map(r => r.amount),
      timestamp: Date.now(),
      chainId: parseInt(chain),
      network: "Base Sep" as const,
    };

    // Start polling in the background
    pollToMine(res.result.queueId).then((pollResult) => {
      console.log("Transaction completed:", pollResult);
    });

    return NextResponse.json([initialResult]);
  } catch (error: any) {
    console.error("Detailed error:", error);
    return NextResponse.json({ 
      error: "Transfer failed", 
      details: error.message 
    }, { status: 500 });
  }
}

async function pollToMine(queueId: string) {
  try {
    const status = await engine.transaction.status(queueId);
    
    if (status.result.status === "mined") {
      const transactionHash = status.result.transactionHash;
      const blockExplorerUrl = `https://base-sepolia.blockscout.com/tx/${transactionHash}`;
      return { status: "Mined", transactionHash, blockExplorerUrl };
    } else if (status.result.status === "errored") {
      return { status: "error", errorMessage: status.result.errorMessage };
    }
    
    return { status: status.result.status };
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return {
      status: "error",
      errorMessage: "Failed to check transaction status",
    };
  }
}