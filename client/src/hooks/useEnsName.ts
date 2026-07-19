import { useEffect, useState } from 'react';

/**
 * Reverse-resolve an Ethereum address to its primary ENS name.
 *
 * Uses VITE_ETH_RPC_URL when set, otherwise ethers' built-in default mainnet
 * provider. Results (including misses) are cached for the session; failures
 * are silent — callers fall back to showing the raw address.
 */
const cache = new Map<string, string | null>();
let providerPromise: Promise<import('ethers').Provider | null> | null = null;

async function getProvider() {
  if (!providerPromise) {
    providerPromise = (async () => {
      try {
        const { JsonRpcProvider, getDefaultProvider } = await import('ethers');
        const rpcUrl = import.meta.env.VITE_ETH_RPC_URL as string | undefined;
        return rpcUrl ? new JsonRpcProvider(rpcUrl) : getDefaultProvider('mainnet');
      } catch {
        return null;
      }
    })();
  }
  return providerPromise;
}

export async function lookupEnsName(address: string): Promise<string | null> {
  const key = address.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  try {
    const provider = await getProvider();
    const name = provider ? await provider.lookupAddress(address) : null;
    cache.set(key, name);
    return name;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export function useEnsName(address: string | null | undefined): string | null {
  const [name, setName] = useState<string | null>(
    address ? cache.get(address.toLowerCase()) ?? null : null,
  );

  useEffect(() => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setName(null);
      return;
    }
    let cancelled = false;
    lookupEnsName(address).then((resolved) => {
      if (!cancelled) setName(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return name;
}
