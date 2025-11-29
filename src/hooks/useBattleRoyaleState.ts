import { useQuery } from "@tanstack/react-query";
import {
  fetchGameState,
  fetchLobbyState,
  hasBattleRoyaleContract,
  type GameState,
  type LobbyState,
} from "@/lib/battleRoyaleClient";

const CONTRACT_ENABLED = hasBattleRoyaleContract();

export const useLobbyState = () =>
  useQuery<LobbyState>({
    queryKey: ["battleRoyale", "lobby"],
    queryFn: fetchLobbyState,
    enabled: CONTRACT_ENABLED,
    refetchInterval: CONTRACT_ENABLED ? 10000 : false,
  });

export const useGameState = () =>
  useQuery<GameState>({
    queryKey: ["battleRoyale", "gameState"],
    queryFn: fetchGameState,
    enabled: CONTRACT_ENABLED,
    refetchInterval: CONTRACT_ENABLED ? 7000 : false,
  });
