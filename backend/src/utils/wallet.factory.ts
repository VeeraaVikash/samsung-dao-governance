import { Wallet, WalletType } from '@prisma/client';
import * as crypto from 'crypto';

export type SafeWallet = Required<Pick<Wallet, "hedera_account_id">> & Wallet;

export function createWallet(data: Partial<Wallet>): SafeWallet {
  if (!data.hedera_account_id) {
    console.warn("Wallet missing Hedera Account ID", { wallet_address: data.wallet_address });
  }

  return {
    id: data.id ?? crypto.randomUUID(),
    user_id: data.user_id!,
    wallet_address: data.wallet_address!,
    wallet_type: data.wallet_type ?? WalletType.DFNS,
    dfns_wallet_id: data.dfns_wallet_id ?? null,
    network: data.network ?? "HEDERA_TESTNET",
    is_custodial: data.is_custodial ?? false,
    is_multisig: data.is_multisig ?? false,
    is_council_wallet: data.is_council_wallet ?? false,
    is_primary: data.is_primary ?? false,
    created_at: data.created_at ?? new Date(),
    hedera_account_id: data.hedera_account_id ?? null
  };
}
