import type { BrowserProvider, JsonRpcProvider, Signer } from "ethers";
import { Contract, getAddress, hexlify, isAddress } from "ethers";
import { BATTLE_ROYALE_ADDRESS } from "@/config/fhevm";
import { battleRoyaleAbi } from "@/lib/abi/battleRoyale";
import { publicJsonRpcProvider } from "@/lib/providers";
import { getFheInstance } from "@/lib/fhevm";

type ProviderLike = BrowserProvider | JsonRpcProvider | Signer;

export const battleRoyaleAddress = BATTLE_ROYALE_ADDRESS;

export const hasBattleRoyaleContract = () => Boolean(battleRoyaleAddress);

function requireBattleRoyaleAddress(): string {
  if (!battleRoyaleAddress) {
    throw new Error("Battle Royale contract address is missing. Set VITE_CONTRACT_ADDRESS in your env file.");
  }

  return battleRoyaleAddress;
}

export function getBattleRoyaleContract(provider: ProviderLike) {
  const address = requireBattleRoyaleAddress();
  return new Contract(address, battleRoyaleAbi, provider);
}

export function getReadOnlyBattleRoyaleContract() {
  if (!battleRoyaleAddress) return null;
  return new Contract(battleRoyaleAddress, battleRoyaleAbi, publicJsonRpcProvider);
}

export async function encryptDirectionHandle(direction: number, userAddress: string) {
  if (direction < 0 || direction > 3) {
    throw new Error("Direction must be between 0 and 3");
  }

  const fhe = await getFheInstance();
  const contractAddr = requireBattleRoyaleAddress();
  const input = fhe.createEncryptedInput(contractAddr, userAddress);
  input.add8(direction);
  const { handles, inputProof } = await input.encrypt();

  return {
    encryptedDirection: hexlify(handles[0]),
    inputProof: hexlify(inputProof),
  };
}

export async function decryptEncryptedAddress(encrypted: string | Uint8Array | null | undefined) {
  if (!encrypted) return null;
  const handle = normalizeCiphertext(encrypted);
  const fhe = await getFheInstance();
  const { clearValues } = await fhe.publicDecrypt([handle]);
  const value = clearValues[handle];
  return typeof value === "string" ? value : null;
}

export type LobbyPlayer = {
  address: string;
  isAlive: boolean;
  hasJoined: boolean;
};

export type LobbyState = {
  isActive: boolean;
  startTime: number;
  totalPlayers: number;
  maxPlayers: number;
  players: LobbyPlayer[];
};

export async function fetchLobbyState(): Promise<LobbyState> {
  const contract = getReadOnlyBattleRoyaleContract();
  if (!contract) {
    throw new Error("Contract address missing. Set VITE_CONTRACT_ADDRESS to enable lobby data.");
  }

  const [gameState, maxPlayers, playerAddresses] = await Promise.all([
    contract.getGameState(),
    contract.maxPlayers(),
    contract.getPlayersList(),
  ]);

  const players = await Promise.all(
    playerAddresses.map(async (player: string) => {
      const [isAlive, hasJoined] = await contract.getPlayerStatus(player);
      return {
        address: player,
        isAlive,
        hasJoined,
      };
    }),
  );

  return {
    isActive: gameState[0],
    startTime: Number(gameState[1]),
    totalPlayers: Number(gameState[2]),
    maxPlayers: Number(maxPlayers),
    players,
  };
}

export type GameState = {
  isActive: boolean;
  startTime: number;
  playersRegistered: number;
  safeZoneRadius: number;
  gameEnded: boolean;
  winner: string | null;
  playerAddresses: string[];
};

export async function fetchGameState(): Promise<GameState> {
  const contract = getReadOnlyBattleRoyaleContract();
  if (!contract) {
    throw new Error("Contract address missing.");
  }

  const [gameState, radius, result, playerAddresses] = await Promise.all([
    contract.getGameState(),
    contract.safeZoneRadius(),
    contract.getGameResult(),
    contract.getPlayersList(),
  ]);

  return {
    isActive: gameState[0],
    startTime: Number(gameState[1]),
    playersRegistered: playerAddresses.length,
    safeZoneRadius: Number(radius),
    gameEnded: result[0],
    winner: result[1] && result[1] !== "0x0000000000000000000000000000000000000000" ? getAddress(result[1]) : null,
    playerAddresses,
  };
}

export function normalizeCiphertext(value: string | Uint8Array): `0x${string}` {
  if (typeof value === "string") {
    return value as `0x${string}`;
  }

  return hexlify(value) as `0x${string}`;
}

export function validateTargetAddress(target: string) {
  if (!isAddress(target)) {
    throw new Error("Invalid Ethereum address");
  }

  return getAddress(target);
}
