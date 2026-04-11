import { create } from 'zustand';
import { memberApi } from '@/lib/memberApi';
import { useAuthStore } from '@/stores/useAuthStore';

export type PortalUser = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: string;
};

export type PortalWallet = {
  accountId: string | null;
  provider: string | null;
  isConnected: boolean;
};

export type PortalData = {
  proposals: unknown[];
  votes: unknown[];
  delegation: unknown[];
  lottery: { lottery: unknown | null; entered: boolean; entryCount: number } | null;
  giveaway: { giveaway: unknown | null; registered: boolean; registeredCount: number } | null;
  reputation: {
    total: number;
    participation: number;
    proposals: number;
    delegation: number;
    tenure: number;
  } | null;
};

type MemberPortalState = {
  user: PortalUser | null;
  wallet: PortalWallet;
  data: PortalData;
  profileLoaded: boolean;
  loadingProfile: boolean;
  loadingData: boolean;
  error: string | null;

  syncUserFromAuth: () => void;
  syncWalletFromAuth: () => void;
  loadProfile: () => Promise<void>;
  loadPortalData: () => Promise<void>;
  reset: () => void;
};

const emptyData: PortalData = {
  proposals: [],
  votes: [],
  delegation: [],
  lottery: null,
  giveaway: null,
  reputation: null,
};

export const useMemberPortalStore = create<MemberPortalState>((set, get) => ({
  user: null,
  wallet: { accountId: null, provider: null, isConnected: false },
  data: emptyData,
  profileLoaded: false,
  loadingProfile: false,
  loadingData: false,
  error: null,

  syncUserFromAuth: () => {
    const u = useAuthStore.getState().user;
    if (!u) {
      set({ user: null });
      return;
    }
    set({
      user: {
        id: u.id,
        name: u.nickname || u.name,
        email: u.email,
        department: (u as { department?: string | null }).department ?? null,
        role: u.role,
      },
    });
  },

  syncWalletFromAuth: () => {
    const wallets = useAuthStore.getState().wallets;
    const primary = wallets.find((w) => w.is_primary) || wallets[0];
    const hedera = primary?.wallet_address && /^\d+\.\d+\.\d+$/.test(primary.wallet_address);
    set({
      wallet: {
        accountId: hedera ? primary.wallet_address : primary?.wallet_address ?? null,
        provider: primary?.wallet_type === 'HASHPACK' ? 'HashPack' : primary?.wallet_type ?? null,
        isConnected: !!primary,
      },
    });
  },

  loadProfile: async () => {
    set({ loadingProfile: true, error: null });
    try {
      const { data } = await memberApi.get<{
        id: string;
        name: string;
        email: string;
        department: string | null;
        role: string;
        wallet: { connected: boolean; hederaAccountId: string | null; walletType: string | null };
      }>('/user/profile');
      set({
        user: {
          id: data.id,
          name: data.name,
          email: data.email,
          department: data.department,
          role: data.role,
        },
        wallet: {
          accountId: data.wallet.hederaAccountId,
          provider:
            data.wallet.walletType === 'HASHPACK'
              ? 'HashPack'
              : data.wallet.walletType ?? null,
          isConnected: data.wallet.connected,
        },
        profileLoaded: true,
        loadingProfile: false,
      });
    } catch (e: unknown) {
      get().syncUserFromAuth();
      get().syncWalletFromAuth();
      set({
        profileLoaded: true,
        loadingProfile: false,
        error: e instanceof Error ? e.message : 'Profile load failed',
      });
    }
  },

  loadPortalData: async () => {
    set({ loadingData: true, error: null });
    try {
      const [propRes, dashRes, delRes, lotRes, giveRes] = await Promise.all([
        memberApi.get<{ proposals: unknown[] }>('/proposals'),
        memberApi.get<{
          reputationBreakdown: {
            participation: number;
            proposals: number;
            delegation: number;
            tenure: number;
            total: number;
          };
        }>('/member-dashboard/dashboard'),
        memberApi.get<{ delegations: unknown[] }>('/delegations'),
        memberApi.get('/lottery'),
        memberApi.get('/giveaway'),
      ]);

      set({
        data: {
          proposals: propRes.data.proposals,
          votes: [],
          delegation: delRes.data.delegations,
          lottery: {
            lottery: lotRes.data.lottery,
            entered: lotRes.data.entered,
            entryCount: lotRes.data.entryCount,
          },
          giveaway: {
            giveaway: giveRes.data.giveaway,
            registered: giveRes.data.registered,
            registeredCount: giveRes.data.registeredCount,
          },
          reputation: dashRes.data.reputationBreakdown ?? null,
        },
        loadingData: false,
      });
    } catch (e: unknown) {
      set({
        loadingData: false,
        error: e instanceof Error ? e.message : 'Data load failed',
      });
    }
  },

  reset: () =>
    set({
      user: null,
      wallet: { accountId: null, provider: null, isConnected: false },
      data: emptyData,
      profileLoaded: false,
      loadingProfile: false,
      loadingData: false,
      error: null,
    }),
}));
