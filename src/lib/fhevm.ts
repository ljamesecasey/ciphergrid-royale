import {
  createInstance,
  initSDK,
  type FhevmInstance,
  type PublicDecryptResults,
} from "@zama-fhe/relayer-sdk/web";
import { FHE_GATEWAY_CONFIG } from "@/config/fhevm";

let instancePromise: Promise<FhevmInstance> | null = null;
let cachedInstance: FhevmInstance | null = null;

/**
 * Initializes and memoizes the Relayer SDK instance following the official guide.
 */
export async function getFheInstance(): Promise<FhevmInstance> {
  if (cachedInstance) {
    return cachedInstance;
  }

  if (!instancePromise) {
    instancePromise = (async () => {
      await initSDK();
      const instance = await createInstance(FHE_GATEWAY_CONFIG);
      cachedInstance = instance;
      return instance;
    })();
  }

  return instancePromise;
}

export function resetFheInstance() {
  instancePromise = null;
  cachedInstance = null;
}

export type PublicDecryptionResult = PublicDecryptResults;
