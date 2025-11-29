import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BrowserProvider, JsonRpcSigner, getAddress } from "ethers";

type WalletContextValue = {
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
  }, []);

  const connect = useCallback(async (silent = false) => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Wallet provider not detected");
    }

    setError(null);
    if (!silent) {
      setIsConnecting(true);
    }

    try {
      const browserProvider = new BrowserProvider(window.ethereum);

      if (silent) {
        const existing = await browserProvider.send("eth_accounts", []);
        if (!existing.length) {
          return;
        }
      } else {
        await browserProvider.send("eth_requestAccounts", []);
      }

      const nextSigner = await browserProvider.getSigner();
      const [userAddress, network] = await Promise.all([nextSigner.getAddress(), browserProvider.getNetwork()]);

      setProvider(browserProvider);
      setSigner(nextSigner);
      setAddress(getAddress(userAddress));
      setChainId(Number(network.chainId));
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to connect wallet");
        throw err;
      }
    } finally {
      if (!silent) {
        setIsConnecting(false);
      }
    }
  }, []);

  useEffect(() => {
    connect(true).catch(() => {
      // Silently ignore auto-connect failures
    });
  }, [connect]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts.length) {
        disconnect();
        return;
      }
      setAddress(getAddress(accounts[0]));
    };

    const handleChainChanged = (nextChainId: string) => {
      try {
        setChainId(Number(BigInt(nextChainId)));
      } catch {
        setChainId(null);
      }
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  const value = useMemo(
    () => ({
      address,
      chainId,
      provider,
      signer,
      isConnecting,
      error,
      connect: () => connect(false),
      disconnect,
    }),
    [address, chainId, provider, signer, isConnecting, error, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
};
