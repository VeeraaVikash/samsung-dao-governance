import { Wallet, Key, Shield, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/stores/useWalletStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

function isHederaAccountId(address: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(address.trim());
}

function shortenHederaId(address: string): string {
  const p = address.trim().split('.');
  if (p.length !== 3) return address;
  const last = p[2] ?? '';
  const tail = last.length <= 4 ? last : `…${last.slice(-4)}`;
  return `0.0.${tail}`;
}

function hashscanAccountUrl(accountId: string): string {
  return `https://hashscan.io/testnet/account/${accountId}`;
}

export function WalletButton() {
  const navigate = useNavigate();
  const { isConnected, address, walletType, isCustodial, disconnect } = useWalletStore();
  const { isAuthenticated, user, logout, wallets } = useAuthStore();

  const displayAddress =
    address ||
    (() => {
      const w = wallets.find((x) => x.is_primary) || wallets[0];
      return w?.wallet_address ?? null;
    })();

  const handleClick = () => {
    if (isConnected && displayAddress) {
      disconnect();
      logout();
      import('@/lib/firebase').then(({ auth }) => auth.signOut());
      toast.info('Disconnected');
      navigate('/');
    } else if (!isAuthenticated) {
      toast.info('Access restricted', {
        description: 'Please sign in to Samsung Members DAO to connect your wallet.',
        action: { label: 'Sign In', onClick: () => navigate('/login') },
      });
      navigate('/login');
    } else if (user && !isConnected && !displayAddress) {
      toast.info('Wallet', {
        description: 'Open Member profile or sign-in flow to connect HashPack.',
        action: { label: 'Member', onClick: () => navigate('/member/profile') },
      });
      navigate('/member/profile');
    }
  };

  if (displayAddress) {
    const hedera = isHederaAccountId(displayAddress);
    const short = hedera ? shortenHederaId(displayAddress) : `${displayAddress.slice(0, 6)}…${displayAddress.slice(-4)}`;
    const wt = walletType ?? (wallets[0]?.wallet_type as typeof walletType);

    return (
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          className="gap-2 font-mono text-xs"
          title="Disconnect wallet and sign out"
        >
          {wt === 'DFNS' ? (
            <Shield className="h-3.5 w-3.5 text-blue-500" />
          ) : wt === 'HASHPACK' ? (
            <Wallet className="h-3.5 w-3.5 text-violet-500" />
          ) : (
            <Wallet className="h-3.5 w-3.5 text-orange-500" />
          )}
          <span className="hidden sm:inline">
            {wt === 'DFNS' ? 'DFNS' : wt === 'HASHPACK' ? 'HP' : 'MM'}
          </span>
          {short}
          {isCustodial && <Key className="h-3 w-3 ml-1 text-blue-400" />}
        </Button>
        {hedera && (
          <Button variant="ghost" size="sm" className="h-9 px-2 text-xs text-primary" asChild>
            <a
              href={hashscanAccountUrl(displayAddress)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">HashScan</span>
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      className="gap-2 gradient-primary border-0 text-primary-foreground"
    >
      <Wallet className="h-3.5 w-3.5" />
      Connect Wallet
    </Button>
  );
}
