import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reviewAPI, Review } from '@/api/endpoints';

export default function ReviewsSection() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await reviewAPI.platform();
        setReviews(res.data);
      } catch (err) {
        console.error("Failed to fetch platform reviews", err);
        // Fallback mock reviews if none in DB
        setReviews([
          {
            id: 1,
            user_id: 0,
            user: { id: 0, name: 'Jean Dupont', role: 'client' },
            rating: 5,
            comment: t('landing.review_mock_1', 'FidélitéPro a transformé ma façon de dîner. Je gagne des récompenses incroyables !'),
            type: 'platform',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            user_id: 0,
            user: { id: 0, name: 'Marie L.', role: 'restaurant' },
            rating: 5,
            comment: t('landing.review_mock_2', 'En tant que propriétaire de restaurant, cet outil est indispensable pour fidéliser mes clients.'),
            type: 'platform',
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            user_id: 0,
            user: { id: 0, name: 'Ahmed S.', role: 'client' },
            rating: 4,
            comment: t('landing.review_mock_3', 'Interface fluide et système de points très clair. Je recommande vivement.'),
            type: 'platform',
            created_at: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [t]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5 } }
  };

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (reviews.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  return (
    <section className="py-24 bg-muted/30 overflow-hidden relative">
      <div className="max-w-6xl mx-auto px-6 text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            {t('landing.reviews_title', 'Ce que disent nos utilisateurs')}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t('landing.reviews_subtitle', 'Découvrez les expériences des clients et des restaurateurs qui utilisent FidélitéPro au quotidien.')}
          </p>
        </motion.div>
      </div>

      <div className="relative h-[450px] flex items-center">
        <motion.div
          className="flex gap-12 px-[50vw]"
          animate={{
            x: -(currentIndex * (350 + 48)) - 175,
          }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 20,
          }}
          style={{ width: "fit-content" }}
        >
          {reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              animate={{ 
                opacity: currentIndex === idx ? 1 : 0.3,
                scale: currentIndex === idx ? 1.1 : 0.85,
                z: currentIndex === idx ? 10 : 0,
              }}
              className="card-elegant w-[350px] shrink-0 relative"
              style={{
                perspective: 1000
              }}
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
              
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
                  />
                ))}
              </div>

              <p className="text-lg text-foreground italic mb-8 leading-relaxed">
                "{review.comment}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {review.user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{review.user?.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {review.user?.role === 'restaurant' ? t('common.restaurant_owner', 'Restaurateur') : t('common.client', 'Client')}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-8">
        {reviews.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              currentIndex === i ? "bg-primary w-8" : "bg-primary/20"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
