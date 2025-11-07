import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Replace with your actual image path or import
const cabanaImg = "/images/cabana.jpg";

const Confirmation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pt-20 md:pt-28">
      <div className="w-full max-w-lg md:max-w-4xl px-4 py-6">
        {/* Confirmation Card */}
        <div className="bg-white shadow rounded-2xl p-5 text-center">
          <h2 className="text-2xl font-bold text-green-600 md:text-3xl">
            {t('confirmation.title')}
          </h2>
          <p className="text-slate-700 mt-2 md:text-lg">
            {t('confirmation.message')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
            aria-label={t('confirmation.backHome')}
          >
            {t('confirmation.backHome')}
          </button>
        </div>

        {/* "You might also like" */}
        <h3 className="mt-8 text-xl font-semibold text-slate-900">
          {t('recommendations.heading')}
        </h3>

        {/* Cabana Card */}
        <article className="mt-4 bg-white rounded-2xl shadow overflow-hidden flex flex-col md:flex-row">
          {/* Image */}
          <img
            src={cabanaImg}
            alt={t('cabanas.imageAlt')}
            className="w-full md:w-1/2 h-64 md:h-auto object-cover"
            loading="lazy"
          />
          {/* Text */}
          <div className="p-4 md:p-6 flex flex-col justify-center md:w-1/2 text-center md:text-left">
            <h4 className="text-2xl font-bold text-slate-900">
              {t('cabanas.title')}
            </h4>
            <p className="mt-1 text-slate-700">
              {t('cabanas.description')}
            </p>
            <p className="mt-4 text-sm text-slate-600 italic">
              {t('cabanas.notice')}
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default Confirmation;
