import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  delay?: number;
}

export function MetricCard({ label, value, subtitle, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}
