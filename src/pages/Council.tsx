import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import {
  fetchCouncilHqDirectory,
  type CouncilHqDirectoryEntry,
} from '@/services/councilDirectoryService';
import { hashscanTestnetAccountUrl } from '@/lib/hederaMirror';

function formatTimezoneLabel(tz: string | null): string {
  if (!tz) return '—';
  try {
    return (
      new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        timeZoneName: 'short',
      })
        .formatToParts(new Date())
        .find((p) => p.type === 'timeZoneName')?.value ?? tz
    );
  } catch {
    return tz;
  }
}

function PublicAddressLink({ address }: { address: string }) {
  const href = hashscanTestnetAccountUrl(address);
  const short =
    address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

  if (!href) {
    return <span className="font-mono text-xs text-foreground">{address}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="View on HashScan (testnet)"
      className="group inline-flex max-w-full items-center gap-1 font-mono text-xs text-primary underline decoration-primary/40 underline-offset-2"
    >
      <span className="truncate">{short}</span>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
    </a>
  );
}

export default function Council() {
  const [hqs, setHqs] = useState<CouncilHqDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        const list = await fetchCouncilHqDirectory();
        if (!cancelled) setHqs(list);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load council HQs');
          setHqs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    const interval = window.setInterval(async () => {
      if (cancelled) return;
      try {
        const list = await fetchCouncilHqDirectory();
        if (!cancelled) setHqs(list);
      } catch {
        /* keep previous */
      }
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Council Members</h1>
        <p className="mt-2 text-muted-foreground">
          Samsung HQ leadership — HQs with at least one council sign-in (live from the database)
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="glass-card rounded-xl p-8 text-center text-destructive">{error}</div>
      ) : hqs.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
          No council HQs in the directory yet. Complete council login for an HQ to appear here.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hqs.map((hq, i) => (
            <motion.div
              key={hq.hqId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <UserAvatar name={hq.displayName} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground leading-tight">{hq.displayName}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{hq.location}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hq.region}
                    {hq.timezone ? (
                      <>
                        {' · '}
                        <span className="font-medium text-foreground/80">{hq.timezone}</span>
                        {' '}
                        <span className="text-muted-foreground">
                          ({formatTimezoneLabel(hq.timezone)})
                        </span>
                      </>
                    ) : null}
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-col gap-0.5 text-xs sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                      <span className="text-muted-foreground shrink-0">Public address</span>
                      <div className="min-w-0 text-right sm:max-w-[65%]">
                        {hq.hederaAccountId ? (
                          <PublicAddressLink address={hq.hederaAccountId} />
                        ) : (
                          <span className="text-muted-foreground">Not provisioned</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          hq.status === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground/35'
                        }`}
                        aria-hidden
                      />
                      <span
                        className={`text-xs font-medium capitalize ${
                          hq.status === 'online' ? 'text-emerald-600' : 'text-muted-foreground'
                        }`}
                      >
                        {hq.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
