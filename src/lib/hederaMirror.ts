/**
 * HashScan block explorer for Hedera testnet (human-readable account pages).
 * Same network as MetaMask `blockExplorerUrls` in this app.
 */
const HASHSCAN_TESTNET_ACCOUNT_BASE = 'https://hashscan.io/testnet/account';

/**
 * URL to open an account on HashScan testnet (shard.realm.num or 0x EVM address).
 */
export function hashscanTestnetAccountUrl(accountOrAddress: string): string | null {
  const s = accountOrAddress?.trim();
  if (!s) return null;

  const isHederaId = /^\d+\.\d+\.\d+$/.test(s);
  const isEvm = /^0x[a-fA-F0-9]{40}$/.test(s);
  if (!isHederaId && !isEvm) return null;

  return `${HASHSCAN_TESTNET_ACCOUNT_BASE}/${encodeURIComponent(s)}`;
}

/** @deprecated Use {@link hashscanTestnetAccountUrl}; kept for any stale imports. */
export const hederaMirrorAccountUrl = hashscanTestnetAccountUrl;
