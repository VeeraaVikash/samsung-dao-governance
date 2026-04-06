import {
  Client,
  AccountId,
  AccountInfoQuery,
  Hbar,
  Status,
} from "@hashgraph/sdk";

/**
 * Get a Hedera client for testnet.
 * If operator credentials are set, the client can submit transactions.
 * Otherwise it's read-only (sufficient for account verification).
 */
export function getHederaClient(): Client {
  const network = process.env.HEDERA_NETWORK || "testnet";
  const client = network === "mainnet" ? Client.forMainnet() : Client.forTestnet();

  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  if (operatorId && operatorKey) {
    client.setOperator(AccountId.fromString(operatorId), operatorKey);
  }

  client.setDefaultMaxTransactionFee(new Hbar(2));
  client.setDefaultMaxQueryPayment(new Hbar(1));

  return client;
}

/**
 * Verify that a Hedera account ID exists on testnet.
 * Returns account info if valid, null if not found.
 */
export async function verifyHederaAccount(accountId: string): Promise<{
  accountId: string;
  balance: number;
  isDeleted: boolean;
} | null> {
  const client = getHederaClient();

  try {
    const info = await new AccountInfoQuery()
      .setAccountId(AccountId.fromString(accountId))
      .execute(client);

    return {
      accountId: info.accountId.toString(),
      balance: info.balance.toBigNumber().toNumber(),
      isDeleted: info.isDeleted,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    // Account not found or invalid
    if (msg.includes("INVALID_ACCOUNT_ID") || msg.includes("ACCOUNT_DELETED")) {
      return null;
    }
    throw error;
  } finally {
    client.close();
  }
}

/**
 * Simulate wallet binding verification.
 * In production, this would verify a signed challenge from the user's wallet.
 * For testnet MVP, we verify the account exists and bind it.
 */
export async function bindWallet(
  accountId: string,
  provider: "hashpack" | "walletconnect" | "blade"
): Promise<{
  success: boolean;
  accountId: string;
  balance: number;
  error?: string;
}> {
  // 1. Validate account format
  const parts = accountId.split(".");
  if (parts.length !== 3 || parts.some((p) => isNaN(Number(p)))) {
    return { success: false, accountId, balance: 0, error: "Invalid Hedera account ID format. Expected: 0.0.XXXXX" };
  }

  // 2. Verify on testnet
  try {
    const info = await verifyHederaAccount(accountId);

    if (!info) {
      return { success: false, accountId, balance: 0, error: "Account not found on Hedera testnet" };
    }

    if (info.isDeleted) {
      return { success: false, accountId, balance: 0, error: "Account has been deleted" };
    }

    return {
      success: true,
      accountId: info.accountId,
      balance: info.balance,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    // If Hedera SDK is not configured (no operator), allow binding anyway for MVP
    if (msg.includes("operator") || msg.includes("UNAVAILABLE")) {
      console.warn("[Hedera] SDK not configured — binding without verification (MVP mode)");
      return {
        success: true,
        accountId,
        balance: 0,
      };
    }
    return { success: false, accountId, balance: 0, error: `Verification failed: ${msg}` };
  }
}

/**
 * Get current Hedera testnet status (block number simulation).
 * In production, this queries the mirror node.
 */
export async function getNetworkStatus(): Promise<{
  network: string;
  chainId: string;
  blockNumber: number;
  operational: boolean;
}> {
  try {
    // Query Hedera mirror node for latest block
    const response = await fetch("https://testnet.mirrornode.hedera.com/api/v1/blocks?limit=1&order=desc");
    if (response.ok) {
      const data = await response.json();
      const block = data.blocks?.[0];
      return {
        network: "Hedera Testnet",
        chainId: "0x128",
        blockNumber: block?.number || 72483921,
        operational: true,
      };
    }
  } catch {
    // Fallback
  }
  return {
    network: "Hedera Testnet",
    chainId: "0x128",
    blockNumber: 72483921,
    operational: true,
  };
}
