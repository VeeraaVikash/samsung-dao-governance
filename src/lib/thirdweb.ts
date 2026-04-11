import { createThirdwebClient, defineChain } from "thirdweb";

export const thirdwebClient = createThirdwebClient({
  clientId: "samsung-dao-dev-placeholder"
});

// Hedera Testnet
export const hederaTestnet = defineChain(296);

// Hedera Mainnet
export const hederaMainnet = defineChain(295);
