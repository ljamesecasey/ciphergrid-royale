import { SepoliaConfig as DefaultSepoliaConfig, type FhevmInstanceConfig } from "@zama-fhe/relayer-sdk/web";
import { getAddress, isAddress } from "ethers";

const FALLBACK_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const FALLBACK_RELAYER_URL = "https://relayer.testnet.zama.org";

const contractFromEnv = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";
const sepoliaRpcFromEnv = import.meta.env.VITE_SEPOLIA_RPC_URL ?? FALLBACK_RPC_URL;
const relayerUrlFromEnv = import.meta.env.VITE_RELAYER_URL ?? FALLBACK_RELAYER_URL;
const chainIdFromEnv = Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID ?? DefaultSepoliaConfig.chainId ?? 11155111);

export const SEPOLIA_CHAIN_ID = Number.isNaN(chainIdFromEnv) ? 11155111 : chainIdFromEnv;
export const SEPOLIA_RPC_URL = sepoliaRpcFromEnv;

export const BATTLE_ROYALE_ADDRESS = isAddress(contractFromEnv) ? getAddress(contractFromEnv) : null;

export const FHE_GATEWAY_CONFIG: FhevmInstanceConfig = {
  ...DefaultSepoliaConfig,
  chainId: SEPOLIA_CHAIN_ID,
  network: sepoliaRpcFromEnv,
  relayerUrl: relayerUrlFromEnv,
};
