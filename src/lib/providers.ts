import { JsonRpcProvider } from "ethers";
import { SEPOLIA_CHAIN_ID, SEPOLIA_RPC_URL } from "@/config/fhevm";

export const publicJsonRpcProvider = new JsonRpcProvider(SEPOLIA_RPC_URL, SEPOLIA_CHAIN_ID);
