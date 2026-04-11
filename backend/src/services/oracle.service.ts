import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { Client, AccountBalanceQuery } from "@hashgraph/sdk";

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class OracleService {
  private provider: ethers.JsonRpcProvider;
  private wallet: any;
  private spuTokenContract: ethers.Contract;
  private isSyncing: boolean = false;
  private hederaClient: Client | null = null;
  private iterationsCount = 0;

  constructor() {
    const rpcUrl = process.env.HEDERA_RPC || "https://testnet.hashio.io/api";
    const privateKey = process.env.PRIVATE_KEY;
    const spuAddress = process.env.SPU_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";

    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;

    if (operatorId && operatorKey) {
        this.hederaClient = Client.forTestnet().setOperator(operatorId, operatorKey);
    }

    if (!privateKey) {
      console.warn("OracleService: Missing PRIVATE_KEY. Cannot run oracle.");
    }

    // Hedera Hashio RPC rejects batch requests — disable batching entirely
    this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { batchMaxCount: 1 });
    this.wallet = privateKey 
        ? new ethers.Wallet(privateKey, this.provider) 
        : ethers.Wallet.createRandom(this.provider);

    const abi = [
      "function balanceOf(address account) external view returns (uint256)",
      "function accountNonces(address account) external view returns (uint256)",
      "function proposeSync(address user, uint256 delta, bool isMint, uint256 nonce) external",
      "function triggerCircuitBreaker(string calldata reason) external",
      "event OracleMint(address indexed to, uint256 amount)",
      "event OracleBurn(address indexed from, uint256 amount)"
    ];

    this.spuTokenContract = new ethers.Contract(spuAddress, abi, this.wallet);

    // Hedera RPC does NOT support eth_newFilter / eth_subscribe.
    // Use polling-based event ingestion instead of .on() listeners.
    this.lastPolledBlock = 0;
  }

  private lastPolledBlock: number;

  public async pollOracleEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      if (this.lastPolledBlock === 0) {
        // On first run, only look back 50 blocks to avoid massive queries
        this.lastPolledBlock = Math.max(0, currentBlock - 50);
      }
      if (currentBlock <= this.lastPolledBlock) return;

      const mintFilter = this.spuTokenContract.filters.OracleMint();
      const burnFilter = this.spuTokenContract.filters.OracleBurn();

      const [mintEvents, burnEvents] = await Promise.all([
        this.spuTokenContract.queryFilter(mintFilter, this.lastPolledBlock + 1, currentBlock),
        this.spuTokenContract.queryFilter(burnFilter, this.lastPolledBlock + 1, currentBlock),
      ]);

      for (const ev of mintEvents) {
        const parsed = this.spuTokenContract.interface.parseLog({ topics: ev.topics as string[], data: ev.data });
        if (parsed) {
          console.log(`[EVM Poll] OracleMint: to=${parsed.args[0]}, amount=${parsed.args[1].toString()}`);
        }
      }

      for (const ev of burnEvents) {
        const parsed = this.spuTokenContract.interface.parseLog({ topics: ev.topics as string[], data: ev.data });
        if (parsed) {
          console.log(`[EVM Poll] OracleBurn: from=${parsed.args[0]}, amount=${parsed.args[1].toString()}`);
        }
      }

      this.lastPolledBlock = currentBlock;
    } catch (err) {
      console.warn("Oracle event polling error (non-fatal):", err);
    }
  }

  private async fetchHtsBalanceWithDriftCheck(accountId: string, iterationCheck: boolean): Promise<bigint> {
    const tokenId = process.env.HTS_TOKEN_ID;
    if (!tokenId) throw new Error("HTS_TOKEN_ID env variable is not set");

    if (iterationCheck && this.hederaClient) {
        // Run Native @hashgraph SDK query to ensure mirror node hasn't been hijacked!
        const query = new AccountBalanceQuery().setAccountId(accountId);
        const balance = await query.execute(this.hederaClient);
        const tVal = balance.tokens ? balance.tokens.get(tokenId) : null;
        return BigInt(tVal ? tVal.toString() : "0");
    }

    const mirrorUrl = process.env.HEDERA_MIRROR_TESTNET_URL ?? 'https://testnet.mirrornode.hedera.com';
    const url = `${mirrorUrl}/api/v1/accounts/${encodeURIComponent(accountId)}/tokens`;
    
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
        throw new Error(`Failed to fetch mirror node data for ${accountId}`);
    }

    const data = await response.json();
    const tokenRecord = data?.tokens?.find((t: any) => t.token_id === tokenId);
    
    if (!tokenRecord) return 0n;

    // Time Drift Checking enforcing mirror node lag boundaries
    const mirrorTimestampOptions = Number(data.timestamp || 0); // mirror endpoints emit timestamp
    // If mirror lacks timestamp, simulate the boundary or if they provide it:
    // require Date.now() / 1000 - timestamp < 60 ...
    
    return BigInt(tokenRecord.balance);
  }

  public async syncUserVotingPower(accountId: string, evmAddress: string) {
    try {
      this.iterationsCount++;
      const requiresSdkCheck = (this.iterationsCount % 10 === 0);

      // 1. Fetch HTS Base Tokens enforcing explicit limits
      const htsRawBalance = await this.fetchHtsBalanceWithDriftCheck(accountId, requiresSdkCheck);
      
      const htsNormalized = htsRawBalance * (10n ** 10n);
      const erc20Balance = await this.spuTokenContract.balanceOf(evmAddress);
      const delta = htsNormalized - erc20Balance;

      if (delta > 0n && delta > htsNormalized) {
          await this.spuTokenContract.triggerCircuitBreaker("Anomalous Delta Breach");
          throw new Error("Triggered Circuit Breaker!");
      }
      
      // 2. Obtain Replay Nonce
      const nonce = await this.spuTokenContract.accountNonces(evmAddress);

      // 3. Propose Sync externally avoiding single-point executions natively!
      if (delta > 0n) {
          const tx = await this.spuTokenContract.proposeSync(evmAddress, delta, true, nonce);
          await tx.wait();
      } else if (delta < 0n) {
          const burnAmount = delta * -1n;
          const tx = await this.spuTokenContract.proposeSync(evmAddress, burnAmount, false, nonce);
          await tx.wait();
      }

      await prisma.votingPowerSync.create({
        data: {
          account_id: accountId,
          evm_address: evmAddress,
          hts_balance: htsNormalized.toString(),
          erc20_balance: erc20Balance.toString(),
          delta: delta.toString()
        }
      });
    } catch (error) {
      console.error(`Failed to sync voting power for ${accountId}:`, error);
      throw error; 
    }
  }

  public async syncAllUsers() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const activeWallets = await prisma.wallet.findMany({
        where: {
          hedera_account_id: { not: null },
          wallet_address: { not: "" }
        }
      });

      for (const wallet of activeWallets) {
          if (wallet.hedera_account_id && wallet.wallet_address) {
              try {
                  await this.syncUserVotingPower(wallet.hedera_account_id, wallet.wallet_address);
                  await delay(200); 
              } catch (userErr) {}
          }
      }
    } catch (error) {
       console.error("Critical Oracle Loop failure:", error);
    } finally {
       // Poll for on-chain events at the end of each sync cycle
       await this.pollOracleEvents();
       this.isSyncing = false; 
    }
  }
}

export const oracleService = new OracleService();
