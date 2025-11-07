// src/pages/GuestHome.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
const cn = (...xs) => xs.filter(Boolean).join(' ');

const restaurants = [
  {
    id: 'Indian',
    nameKey: 'indian_name',
    descriptionKey: 'indian_desc',
    image: '/images/indian.png',
  },
  {
    id: 'Chinese',
    nameKey: 'chinese_name',
    descriptionKey: 'chinese_desc',
    image: '/images/chinese.png',
  },
  {
    id: 'Italian',
    nameKey: 'italian_name',
    descriptionKey: 'italian_desc',
    image: '/images/italian.png',
  },
];

const RestaurantCard = ({ item, onClick, t }) => {
  const isDisabled = !!item.disabled;

  return (
    <button
      type="button"
      onClick={() => !isDisabled && onClick(item.id)}
      disabled={isDisabled}
      className={cn(
        "group relative w-full rounded-3xl border border-gray-200 bg-white text-left overflow-hidden",
        "transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300",
        isDisabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-2xl hover:-translate-y-0.5"
      )}
      aria-label={isDisabled ? t('fish_reservation_heading') : t(item.nameKey)}
    >
      {/* Image area */}
      <div className="aspect-[4/3] bg-white overflow-hidden ring-1 ring-slate-100 rounded-t-3xl">
        {item.image && !isDisabled ? (
          <img
            src={item.image}
            alt={t(item.nameKey)}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-6 transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {isDisabled ? (
          <>
            <h3 className="text-xl font-bold text-gray-800">{t('fish_reservation_heading')}</h3>
            <p className="text-gray-500 italic mt-1">{t('fish_reservation_subtext')}</p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-800">{t(item.nameKey)}</h3>
            <p className="text-gray-500 mt-1">{t(item.descriptionKey)}</p>
            <div className="mt-4">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-orange-700 text-white text-sm font-semibold group-hover:bg-orange-600">
                {t('reserve_now') || 'Reserve now'}
              </span>
            </div>
          </>
        )}
      </div>
    </button>
  );
};


const GuestHome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const images = Array.from({ length: 7 }, (_, i) => `/gallery/${i + 1}.jpg`);

  const restaurantSectionRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((i) => i + 1); // just keep counting up
    }, 3000); // match your display time

    return () => clearInterval(id);
  }, []);


  const scrollToRestaurants = () => {
    restaurantSectionRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex justify-center min-h-screen p-6 pt-24 md:pt-28 bg-white">
      <div className="max-w-7xl mx-auto w-full p-0 space-y-16">
        {/* Gallery Slideshow */}
        <div className="mb-16 bg-gradient-to-b from-[#f8fafc] to-[#eef2f7] rounded-2xl">

          {/* Slideshow */}
          <div className="relative w-full overflow-hidden rounded-2xl shadow-lg h-[520px] md:h-[720px] lg:h-[820px]">
            <div
              className={`flex h-full will-change-transform transform-gpu ${isTransitioning ? "transition-transform duration-[1000ms] ease-in-out" : ""}`}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              onTransitionEnd={() => {
                if (currentIndex === images.length) {
                  setIsTransitioning(false);
                  requestAnimationFrame(() => {
                    setCurrentIndex(0);
                    requestAnimationFrame(() => setIsTransitioning(true));
                  });
                }
              }}
            >
              {[...images, images[0]].map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Gallery ${idx + 1}`}
                  className="flex-shrink-0 w-full h-full object-cover"
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              ))}
            </div>

            {/* Overlay gradient + text + CTA */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent rounded-2xl" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white">
              <h1 className="text-3xl md:text-5xl font-bold drop-shadow-sm">{t('welcome_message')}</h1>
              <p className="mt-2 md:mt-3 text-sm md:text-base max-w-2xl drop-shadow-sm">
                {t('welcome_sub') || 'Savor world cuisines with a view by the sea.'}
              </p>
              <div className="mt-4 md:mt-6">
                <button
                  onClick={scrollToRestaurants}
                  className="pointer-events-auto inline-flex items-center gap-2 bg-orange-700 hover:bg-orange-600 text-white font-semibold px-5 py-3 rounded-full shadow"
                >
                  {t('Button')}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Restaurant Section */}
        <section ref={restaurantSectionRef} className="bg-white rounded-3xl p-8 md:p-10 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">{t('pick_restaurant')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((item) => (
              <RestaurantCard
                key={item.id}
                item={item}
                t={t}
                onClick={(id) => navigate(`/reservation/${id}`)}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default GuestHome;
