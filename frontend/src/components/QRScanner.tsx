import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Search, User, Gift, Check, MapPin, Star } from 'lucide-react';
import { toast } from 'sonner';
import { restaurantAPI } from '@/api/endpoints';

interface QRScannerTabProps {
  onVisitRecorded: () => void;
}

const levelBadge: Record<string, string> = {
  bronze: 'text-amber-600 bg-amber-600/10 border-amber-600/20',
  silver: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  gold:   'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  vip:    'text-purple-500 bg-purple-500/10 border-purple-500/20',
};

export default function QRScannerTab({ onVisitRecorded }: QRScannerTabProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : i18n.language?.startsWith('en') ? 'en' : 'fr';

  const [mode, setMode]                   = useState<'camera' | 'manual'>('camera');
  const [manualId, setManualId]           = useState('');
  const [isLooking, setIsLooking]         = useState(false);
  const [isRecording, setIsRecording]     = useState(false);
  const [clientPreview, setClientPreview] = useState<any>(null);
  const [scannerReady, setScannerReady]   = useState(false);
  const [cameraError, setCameraError]     = useState('');

  const scannerRef  = useRef<any>(null);
  const divId       = 'qr-reader-container';

  // ─── Start Camera Scanner ────────────────────────────────────────────────────
  const startScanner = async () => {
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }

      const scanner = new Html5QrcodeScanner(divId, {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0], // SCAN_TYPE_CAMERA only
      }, false);

      scanner.render(
        async (decodedText: string) => {
          // Parse fidelitepro://client/{id}
          const match = decodedText.match(/fidelitepro:\/\/client\/(\d+)/);
          if (match) {
            const clientId = match[1];
            await scanner.clear();
            scannerRef.current = null;
            await lookupClient(clientId);
          } else {
            // Try direct number
            const numMatch = decodedText.match(/\d+/);
            if (numMatch) {
              await scanner.clear();
              scannerRef.current = null;
              await lookupClient(numMatch[0]);
            } else {
              toast.error(lang === 'ar' ? 'رمز QR غير صالح' : lang === 'en' ? 'Invalid QR code' : 'QR code invalide');
            }
          }
        },
        (error: string) => {
          // Ignore scan errors (normal while scanning)
        }
      );

      scannerRef.current = scanner;
      setScannerReady(true);
    } catch (err) {
      setCameraError(
        lang === 'ar' ? 'تعذر الوصول إلى الكاميرا' :
        lang === 'en' ? 'Could not access camera' :
        'Impossible d\'accéder à la caméra'
      );
      setMode('manual');
    }
  };

  useEffect(() => {
    if (mode === 'camera') {
      startScanner();
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [mode]);

  // ─── Lookup Client ────────────────────────────────────────────────────────────
  const lookupClient = async (id: string) => {
    if (!id) return;
    setIsLooking(true);
    setClientPreview(null);
    try {
      const res = await restaurantAPI.getClientInfo(parseInt(id));
      setClientPreview(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error(lang === 'ar' ? 'العميل غير موجود' : lang === 'en' ? 'Client not found' : 'Client introuvable');
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setIsLooking(false);
    }
  };

  const handleManualLookup = () => lookupClient(manualId);

  // ─── Confirm Visit ────────────────────────────────────────────────────────────
  const handleConfirmVisit = async () => {
    if (!clientPreview) return;
    setIsRecording(true);
    try {
      await restaurantAPI.addVisit(clientPreview.client.id);
      toast.success(`✅ ${clientPreview.client.name} 🎉`);
      setClientPreview(null);
      setManualId('');
      onVisitRecorded();
      // Restart scanner after recording
      if (mode === 'camera') setTimeout(startScanner, 500);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsRecording(false);
    }
  };

  const labels = {
    title:        { fr: 'Scanner QR Client',          en: 'Scan Client QR',             ar: 'مسح QR العميل'            },
    subtitle:     { fr: 'Pointez la caméra vers le QR code du client', en: 'Point camera at client QR code', ar: 'وجّه الكاميرا نحو رمز QR العميل' },
    useCamera:    { fr: '📷 Scanner',                 en: '📷 Camera',                  ar: '📷 الكاميرا'               },
    useManual:    { fr: '⌨️ ID Manuel',               en: '⌨️ Manual ID',               ar: '⌨️ رقم يدوي'              },
    enterID:      { fr: 'Entrer l\'ID client',         en: 'Enter client ID',             ar: 'أدخل رقم العميل'           },
    search:       { fr: 'Chercher',                   en: 'Search',                      ar: 'بحث'                      },
    notMember:    { fr: 'Nouveau membre — carte créée automatiquement', en: 'New member — card created automatically', ar: 'عضو جديد — سيتم إنشاء البطاقة تلقائياً' },
    recordVisit:  { fr: 'Enregistrer la visite',      en: 'Record Visit',                ar: 'تسجيل الزيارة'             },
    cancel:       { fr: 'Annuler',                    en: 'Cancel',                      ar: 'إلغاء'                     },
    restaurants:  { fr: 'Restaurants visités',        en: 'Restaurants visited',         ar: 'المطاعم المزارة'           },
    visits:       { fr: 'Visites',                    en: 'Visits',                      ar: 'زيارات'                   },
    reward:       { fr: 'Récompense',                 en: 'Reward',                      ar: 'المكافأة'                  },
    toNext:       { fr: 'visites restantes',          en: 'visits remaining',            ar: 'زيارات متبقية'             },
    rewardReady:  { fr: '🎁 Récompense disponible!',  en: '🎁 Reward available!',        ar: '🎁 المكافأة متاحة!'         },
  };

  const l = (key: keyof typeof labels) => labels[key][lang];

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">{l('title')}</h2>
        <p className="text-sm text-muted-foreground">{l('subtitle')}</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        <button
          onClick={() => { setMode('camera'); setClientPreview(null); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'camera' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {l('useCamera')}
        </button>
        <button
          onClick={() => { setMode('manual'); setClientPreview(null); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'manual' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {l('useManual')}
        </button>
      </div>

      {/* Camera Scanner */}
      {mode === 'camera' && !clientPreview && (
        <div className="card-elegant p-4 overflow-hidden">
          {cameraError ? (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{cameraError}</p>
            </div>
          ) : (
            <div id={divId} className="rounded-xl overflow-hidden" />
          )}
        </div>
      )}

      {/* Manual Input */}
      {mode === 'manual' && !clientPreview && (
        <div className="card-elegant p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder={l('enterID')}
                className="w-full ps-10 pe-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                autoFocus
              />
            </div>
            <button
              onClick={handleManualLookup}
              disabled={isLooking || !manualId}
              className="btn-warm px-5 py-3 flex items-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {isLooking ? '...' : l('search')}
            </button>
          </div>
        </div>
      )}

      {/* Client Preview Card */}
      <AnimatePresence>
        {clientPreview && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="card-elegant p-6 space-y-5"
          >
            {/* Client Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/20">
                {clientPreview.client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-foreground text-xl">{clientPreview.client.name}</p>
                <p className="text-sm text-muted-foreground">{clientPreview.client.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">ID #{clientPreview.client.id}</p>
              </div>
            </div>

            {/* This Restaurant's Card */}
            {clientPreview.is_member && clientPreview.card ? (
              <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${levelBadge[clientPreview.card.loyalty_level || 'bronze']}`}>
                    {t(`client.level_${clientPreview.card.loyalty_level || 'bronze'}`)}
                  </span>
                  <span className="font-bold text-foreground text-lg">
                    {clientPreview.card.current_visits}
                    <span className="text-muted-foreground font-normal text-sm"> / {clientPreview.card.visits_required} {l('visits')}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (clientPreview.card.current_visits / clientPreview.card.visits_required) * 100)}%` }}
                  />
                </div>

                {clientPreview.card.visits_to_next > 0 ? (
                  <p className="text-xs text-muted-foreground text-center">
                    {clientPreview.card.visits_to_next} {l('toNext')}
                  </p>
                ) : (
                  <p className="text-sm text-green-500 font-semibold text-center">{l('rewardReady')}</p>
                )}

                <div className="flex items-start gap-2 pt-1">
                  <Gift className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{clientPreview.card.reward}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-sm text-center">
                {l('notMember')}
              </div>
            )}

            {/* Other restaurants visited */}
            {clientPreview.other_restaurants && clientPreview.other_restaurants.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  {l('restaurants')} ({clientPreview.other_restaurants.length})
                </p>
                <div className="space-y-2">
                  {clientPreview.other_restaurants.slice(0, 3).map((r: any) => (
                    <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {r.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.location}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3" /> {r.visits}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setClientPreview(null); setManualId(''); if (mode === 'camera') startScanner(); }}
                className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                {l('cancel')}
              </button>
              <button
                onClick={handleConfirmVisit}
                disabled={isRecording}
                className="flex-1 btn-warm py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                {isRecording ? '...' : l('recordVisit')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}