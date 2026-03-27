import { motion } from 'framer-motion';

interface Props {
  current: number;
  total: number;
  className?: string;
}

export default function ProgressBar({ current, total, className = '' }: Props) {
  const pct = Math.min((current / total) * 100, 100);

  return (
    <div className={`progress-bar-track ${className}`}>
      <motion.div
        className="progress-bar-fill"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      />
    </div>
  );
}
