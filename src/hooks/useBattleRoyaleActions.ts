import { useCallback, useState } from "react";
import {
  decryptEncryptedAddress,
  encryptDirectionHandle,
  getBattleRoyaleContract,
  getReadOnlyBattleRoyaleContract,
  validateTargetAddress,
} from "@/lib/battleRoyaleClient";
import { useWallet } from "@/providers/WalletProvider";

type Direction = "up" | "right" | "down" | "left";

const directionMapping: Record<Direction, number> = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
};

export function useBattleRoyaleActions() {
  const { address, signer, connect } = useWallet();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const requireSigner = useCallback(() => {
    if (!signer || !address) {
      throw new Error("Connect your wallet to continue");
    }
    return { signer, address };
  }, [signer, address]);

  const runAction = useCallback(
    async <T,>(label: string, handler: () => Promise<T>) => {
      setPendingAction(label);
      try {
        return await handler();
      } finally {
        setPendingAction((current) => (current === label ? null : current));
      }
    },
    [],
  );

  const joinGame = useCallback(async () => {
    const { signer } = requireSigner();
    return runAction("join", async () => {
      const contract = getBattleRoyaleContract(signer);
      const tx = await contract.joinGame();
      return tx.wait();
    });
  }, [requireSigner, runAction]);

  const startGame = useCallback(async () => {
    const { signer } = requireSigner();
    return runAction("start", async () => {
      const contract = getBattleRoyaleContract(signer);
      const tx = await contract.startGame();
      return tx.wait();
    });
  }, [requireSigner, runAction]);

  const shrinkZone = useCallback(async () => {
    const { signer } = requireSigner();
    return runAction("shrink", async () => {
      const contract = getBattleRoyaleContract(signer);
      const tx = await contract.shrinkZone();
      return tx.wait();
    });
  }, [requireSigner, runAction]);

  const movePlayer = useCallback(
    async (direction: Direction) => {
      const { signer, address } = requireSigner();
      const directionCode = directionMapping[direction];

      return runAction(`move-${direction}`, async () => {
        const encrypted = await encryptDirectionHandle(directionCode, address);
        const contract = getBattleRoyaleContract(signer);
        const tx = await contract.movePlayer(encrypted.encryptedDirection, encrypted.inputProof);
        return tx.wait();
      });
    },
    [requireSigner, runAction],
  );

  const attackPlayer = useCallback(
    async (target: string) => {
      const { signer } = requireSigner();
      const normalizedTarget = validateTargetAddress(target);
      return runAction("attack", async () => {
        const contract = getBattleRoyaleContract(signer);
        const tx = await contract.attackPlayer(normalizedTarget);
        return tx.wait();
      });
    },
    [requireSigner, runAction],
  );

  const revealFoundPlayer = useCallback(async () => {
    const { address } = requireSigner();
    const contract = getReadOnlyBattleRoyaleContract();
    if (!contract) {
      throw new Error("Contract address is not configured");
    }

    const encrypted = await contract.getFoundPlayer(address);
    return decryptEncryptedAddress(encrypted);
  }, [requireSigner]);

  return {
    isBusy: pendingAction !== null,
    pendingAction,
    joinGame,
    startGame,
    shrinkZone,
    movePlayer,
    attackPlayer,
    revealFoundPlayer,
    connectWallet: connect,
  };
}
