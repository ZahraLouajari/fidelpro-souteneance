import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reviewAPI } from '@/api/endpoints';
import { toast } from 'sonner';

interface ReviewFormProps {
  restaurantId?: number;
  restaurantName?: string;
  type: 'platform' | 'restaurant';
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function ReviewForm({ restaurantId, restaurantName, type, onSuccess, onClose }: ReviewFormProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error(t('review.empty_comment', 'Veuillez laisser un commentaire.'));
      return;
    }

    try {
      setSubmitting(true);
      await reviewAPI.store({
        restaurant_id: restaurantId,
        rating,
        comment,
        type
      });
      toast.success(t('review.success', 'Merci pour votre avis !'));
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="card-elegant p-6 max-w-md w-full shadow-2xl border-primary/20"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-display font-bold text-foreground">
          {type === 'platform' 
            ? t('review.title_platform', 'Votre avis sur FidélitéPro') 
            : `${t('review.title_restaurant', 'Votre avis sur')} ${restaurantName}`}
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-3 text-center">
            {t('review.rating_label', 'Notez votre expérience')}
          </label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star
                  size={32}
                  className={`transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground/30"
                  }`}
                />
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            {t('review.comment_label', 'Votre commentaire')}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            placeholder={t('review.placeholder', 'Dites-nous ce que vous en pensez...')}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-warm w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send size={18} />
              {t('common.submit', 'Envoyer')}
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
