import { useState } from 'react';
import { X, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [manualId, setManualId] = useState('');

  const handleManualSubmit = () => {
    if (manualId) {
      onScan(manualId);
      setManualId('');
    } else {
      toast.error('Please enter a client ID');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Enter Client ID</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Enter the client ID manually to record a visit
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Client ID"
              className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground"
            />
            <button
              onClick={handleManualSubmit}
              className="btn-warm px-4 py-2"
            >
              Record
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Client ID can be found in their profile or QR code
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}