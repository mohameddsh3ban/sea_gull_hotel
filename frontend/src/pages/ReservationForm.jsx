import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast, Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';


const API_BASE = 'https://reservation-backend-demo.onrender.com';

const generateTimeSlots = (start, end, interval) => {
  const slots = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let current = new Date();
  current.setHours(startH, startM, 0, 0);
  
  const endTime = new Date();
  endTime.setHours(endH, endM, 0, 0);
  
  while (current <= endTime) {
    const timeString = current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    slots.push(timeString);
    current.setMinutes(current.getMinutes() + interval);
  }
  return slots;
};

const ReservationForm = () => {
  const { restaurantId } = useParams();
  const allowedRestaurants = ['Indian', 'Chinese', 'Italian', 'Oriental']; // ✅ only your actual restaurants
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const today = new Date();
  const menuUrl = `/menus/${restaurantId}.pdf`;
  const imageUrl = `/menus/${restaurantId}.png`;

  const [isSending, setIsSending] = useState(false);
  const [loadingCapacities, setLoadingCapacities] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [capacities, setCapacities] = useState({});
  const [showSushiModal, setShowSushiModal] = useState(false);

  // NEW STATE
  const [restaurantConfig, setRestaurantConfig] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [configLoading, setConfigLoading] = useState(true);

  const sushiItems = {
    hot_rolls: [
      { name: 'Hot Dynamites', price: 4 },
      { name: 'Hot Crab', price: 4 },
      { name: 'Hot Dragon', price: 4 }
    ],
    maki_rolls: [
      { name: 'Sake Maki', price: 3 },
      { name: 'Seagull Roll', price: 5 },
      { name: 'Kappa Roll', price: 2 },
      { name: 'Kabi Maki', price: 4 }
    ]
  };



  const [formData, setFormData] = useState({
    date: '',
    time: '19:00',
    guests: '',
    room: '',
    first_name: '',
    last_name: '',
    email: '',
    main_courses: [],
    comments: '',
    upsell_items: {}
  });

  if (!allowedRestaurants.includes(restaurantId)) {
    return (
      <div className="text-center text-2xl py-20 text-gray-700">
        {restaurantId} is not a valid restaurant.
      </div>
    );
  }



  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ✅ Fetch capacities from direct backend
  useEffect(() => {
    const fetchCapacities = async () => {
      try {
        const res = await fetch(`${API_BASE}/capacities`);
        const data = await res.json();
        setCapacities(data);
      } catch (err) {
        console.error('Failed to fetch capacities:', err);
      } finally {
        setLoadingCapacities(false);
      }
    };

    fetchCapacities();
  }, []);

  // 🔄 Check spots when date changes
  useEffect(() => {
    const checkSpotsLeft = async () => {
      if (!formData.date || !restaurantId) return;

      try {
        const key = `${restaurantId}_${formData.date}`;
        const capacity = capacities[key];
        if (!capacity) {
          setSpotsLeft(null);
          return;
        }

        const res = await fetch(`${API_BASE}/reservations?restaurant=${restaurantId}&date=${formData.date}`);
        const data = await res.json();
        const totalGuests = data.totalGuests;

        const remaining = capacity - totalGuests;
        setSpotsLeft(remaining);
      } catch (error) {
        console.error('Error checking capacity:', error);
        setSpotsLeft(null);
      }
    };

    checkSpotsLeft();
  }, [formData.date, restaurantId, capacities]);

  // 🔄 Sync main_courses with number of guests
  useEffect(() => {
    const guests = parseInt(formData.guests);
    if (!isNaN(guests)) {
      const current = formData.main_courses || [];
      const updated = Array.from({ length: guests }, (_, i) => current[i] || '');
      setFormData(prev => ({ ...prev, main_courses: updated }));
    }
  }, [formData.guests]);

  // 1. FETCH CONFIG ON LOAD
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/config`);
        const data = await res.json();
        const myConfig = data[restaurantId];
        
        if (myConfig) {
          setRestaurantConfig(myConfig);
          // Generate slots immediately if config exists
          const slots = generateTimeSlots(myConfig.openingTime, myConfig.closingTime, myConfig.intervalMinutes);
          setAvailableTimeSlots(slots);
          
          // Set default time to first slot if existing '19:00' isn't valid
          if (!slots.includes(formData.time)) {
            setFormData(prev => ({...prev, time: slots[0]}));
          }
        }
      } catch (e) {
        console.error("Config load failed", e);
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, [restaurantId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'guests') {
      const guestCount = Number(value);
      setFormData({
        ...formData,
        guests: guestCount,
        main_courses: Array(guestCount).fill(''),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // 1. Separate the actual API call into a new function
  const finalizeReservation = async (finalUpsellItems = formData.upsell_items) => {
    if (isSending) return;
    setIsSending(true);

    try {
      // Recalculate price based on final selection
      let upsell_total_price = 0;
      Object.entries(finalUpsellItems).forEach(([item, count]) => {
        if (count > 0) {
          Object.values(sushiItems).forEach(category => {
            category.forEach(sushi => {
              if (sushi.name === item) {
                upsell_total_price += sushi.price * count;
              }
            });
          });
        }
      });

      const response = await fetch(`${API_BASE}/api/v1/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          restaurant: restaurantId,
          upsell_items: finalUpsellItems,
          upsell_total_price: Number(upsell_total_price.toFixed(2))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Reservation failed');
      }

      toast.success('Reservation confirmed! ✅');
      setTimeout(() => navigate('/confirmation'), 1500);
    } catch (error) {
      console.error('❌ Reservation Error:', error);
      toast.error(error.message);
    } finally {
      setIsSending(false);
      setShowSushiModal(false); // Close modal if open
    }
  };

  // 2. Intercept the form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.room || !formData.date) {
      toast.error(t('room_required'));
      return;
    }

    // Intercept Chinese Restaurant for Upsell
    if (restaurantId === 'Chinese') {
      // If they haven't selected anything yet, show the modal
      const hasSelectedSushi = Object.values(formData.upsell_items).some(val => val > 0);

      // logic: Always show modal if it hasn't been shown,
      // or specifically check if they want to review order.
      // Here we force the modal to appear to "Upsell"
      setShowSushiModal(true);
      return;
    }

    // For other restaurants, submit immediately
    await finalizeReservation();
  };

  const getDayLabel = (date) => {
    return date.toLocaleDateString(
      i18n.language === 'de' ? 'de-DE' :
        i18n.language === 'fr' ? 'fr-FR' :
          i18n.language === 'ru' ? 'ru-RU' : 'en-US',
      { weekday: 'long', month: 'long', day: 'numeric' }
    );
  };

  const isTodayBlocked = today.getHours() >= 11;

  // 2. CHECK IF RESTAURANT IS CLOSED
  if (!configLoading && restaurantConfig && !restaurantConfig.isActive) {
     return (
       <div className="max-w-4xl mx-auto pt-32 text-center p-6">
         <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl">
           <h2 className="text-2xl font-bold mb-2">Restaurant Currently Closed</h2>
           <p>The {restaurantId} restaurant is not accepting new reservations at this time.</p>
           <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">Back to Home</button>
         </div>
       </div>
     );
  }

  return (
    <div className="max-w-6xl mx-auto pt-24 md:pt-28 grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      <Toaster position="top-right" />

      {/* Left Side */}
      <div className="bg-white shadow rounded-2xl p-6 flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('restaurant_menu')}</h3>
        {windowWidth < 768 ? (
          <img src={imageUrl} alt="Menu Cover" className="rounded-lg object-cover w-full h-auto max-h-[300px]" />
        ) : (
          <iframe src={menuUrl} className="w-full h-[500px] border rounded" title="Restaurant Menu" />
        )}
        <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="mt-4 bg-[#006494] text-white px-4 py-2 rounded hover:bg-[#005377]">
          {t('menu_button')}
        </a>
      </div>

      {/* Right Side */}
      <div className="bg-white shadow rounded-2xl p-4 sm:p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('book_table')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">


          {loadingCapacities ? (
            <select disabled className="w-full border p-2 rounded bg-gray-100 text-gray-500">
              <option>{t('loading available dates') || 'Loading available dates...'}</option>
            </select>
          ) : (
            <select name="date" value={formData.date} onChange={handleChange} required className="w-full border p-3 rounded-md">
              <option value="">{t('select_date')}</option>
              {[...Array(6)].map((_, index) => {
                const date = new Date();
                date.setDate(today.getDate() + index);
                const iso = date.toISOString().split('T')[0];
                const key = `${restaurantId}_${iso}`;
                const capacity = capacities[key];
                const isDisabled = (index === 0 && isTodayBlocked) || !capacity || capacity === 0;

                return (
                  <option key={iso} value={iso} disabled={isDisabled}>
                    {getDayLabel(date)}{isDisabled ? ' (Unavailable)' : ''}
                  </option>
                );
              })}
            </select>
          )}


          {spotsLeft !== null && spotsLeft <= 4 && spotsLeft > 0 && (
            <div className="text-yellow-600 text-sm mt-1">
              ⚠ Only {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left for this date!
            </div>
          )}
          {spotsLeft === 0 && (
            <div className="text-red-600 text-sm mt-1">
              ❌ This date is fully booked.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded bg-white"
            >
              {availableTimeSlots.length > 0 ? (
                availableTimeSlots.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))
              ) : (
                <option value="19:00">19:00</option> // Fallback
              )}
            </select>
          </div>

          <select name="guests" value={formData.guests} onChange={handleChange} required className="w-full border p-2 rounded">
            <option value="">{t('number_of_guests')}</option>
            {[1, 2, 3, 4].map(num => <option key={num} value={num}>{num}</option>)}
          </select>

          <input type="number" name="room" value={formData.room} onChange={handleChange} required className="w-full border p-2 rounded" placeholder={t('room_number')} />
          <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-1/2 border p-2 rounded" placeholder={t('first_name')} required />
          <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-1/2 border p-2 rounded" placeholder={t('last_name')} required />
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border p-2 rounded" placeholder={t('email')} />

          {(restaurantId.toLowerCase() === 'chinese' || restaurantId.toLowerCase() === 'indian' || restaurantId.toLowerCase() === 'italian') && (
            <div>
              <label className="block text-gray-700 mb-2">
                {t('select_main_course')} (for each guest)
              </label>

              {[...Array(formData.guests || 0)].map((_, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3">
                  <span className="text-gray-600">Guest {index + 1}:</span>
                  {restaurantId.toLowerCase() === 'italian' ? (
                    <>
                      <button
                        type="button"
                        aria-pressed={formData.main_courses[index] === 'quatro_formagi'}
                        className={`w-full sm:w-auto px-4 py-3 border rounded-lg text-sm sm:text-base ${formData.main_courses[index] === 'quatro_formagi' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white hover:bg-gray-100'}`}
                        onClick={() => {
                          const updated = [...formData.main_courses];
                          updated[index] = 'quatro_formagi';
                          setFormData({ ...formData, main_courses: updated });
                        }}
                      >
                        {t('quatro_formagi') || 'Quatro Formagi'}
                      </button>
                      <button
                        type="button"
                        aria-pressed={formData.main_courses[index] === 'chicken_pizza'}
                        className={`w-full sm:w-auto px-4 py-3 border rounded-lg text-sm sm:text-base ${formData.main_courses[index] === 'chicken_pizza' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white hover:bg-gray-100'}`}
                        onClick={() => {
                          const updated = [...formData.main_courses];
                          updated[index] = 'chicken_pizza';
                          setFormData({ ...formData, main_courses: updated });
                        }}
                      >
                        {t('chicken_pizza') || 'Chicken Pizza'}
                      </button>
                      <button
                        type="button"
                        aria-pressed={formData.main_courses[index] === 'petto_chicken'}
                        className={`w-full sm:w-auto px-4 py-3 border rounded-lg text-sm sm:text-base ${formData.main_courses[index] === 'petto_chicken' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white hover:bg-gray-100'}`}
                        onClick={() => {
                          const updated = [...formData.main_courses];
                          updated[index] = 'petto_chicken';
                          setFormData({ ...formData, main_courses: updated });
                        }}
                      >
                        {t('petto_chicken') || 'Petto Chicken'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`px-4 py-2 border rounded-md ${formData.main_courses[index] === 'chicken' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white hover:bg-gray-100'}`}
                        onClick={() => {
                          const updated = [...formData.main_courses];
                          updated[index] = 'chicken';
                          setFormData({ ...formData, main_courses: updated });
                        }}
                      >
                        {t('chicken')}
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 border rounded-md ${formData.main_courses[index] === 'meat' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white hover:bg-gray-100'}`}
                        onClick={() => {
                          const updated = [...formData.main_courses];
                          updated[index] = 'meat';
                          setFormData({ ...formData, main_courses: updated });
                        }}
                      >
                        {t('meat')}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {restaurantId.toLowerCase() === 'chinese' && (
            <>

              {/* Preview selected sushi items */}
              {Object.entries(formData.upsell_items)
                .filter(([_, count]) => count > 0)
                .length > 0 && (
                  <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                      🍣 {t('selected_sushi') || 'Selected Sushi Items'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(formData.upsell_items)
                        .filter(([_, count]) => count > 0)
                        .map(([item, count]) => (
                          <span
                            key={item}
                            className="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                          >
                            {item} × {count}
                          </span>
                        ))}

                      {/* 💵 Show total sushi price */}
                      {(() => {
                        let total = 0;
                        Object.entries(formData.upsell_items).forEach(([item, count]) => {
                          if (count > 0) {
                            Object.values(sushiItems).forEach(category => {
                              category.forEach(sushi => {
                                if (sushi.name === item) {
                                  total += sushi.price * count;
                                }
                              });
                            });
                          }
                        });
                        return (
                          <div className="mt-2 text-sm font-semibold text-gray-700">
                            {t('total_price') || 'Total'}: ${total.toFixed(2)}
                            <div className="mt-2 text-sm text-red-600 font-medium">
                              {t('extra_charge_notice') || 'An extra charge will be added to your room.'}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
            </>
          )}

          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows={3}
            maxLength={150}
            placeholder={t('comments_placeholder') || 'Special requests, allergies, etc.'}
            className="w-full border p-2 rounded"
          />


          <button type="submit" disabled={isSending} className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isSending ? t('sending') : t('confirm_reservation')}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {showSushiModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowSushiModal(false)}
                className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>

              <h3 className="text-xl font-bold mb-2 text-gray-800">Chef's Recommendation 🍣</h3>
              <p className="text-gray-600 mb-4 text-sm">Would you like to add some Sushi to your dinner?</p>

              {Object.entries(sushiItems).map(([category, items]) => (
                <div
                  key={category}
                  className="mb-6 bg-gray-50 p-4 rounded-xl shadow-inner border border-gray-200"
                >
                  <h4 className="text-xl font-bold text-blue-700 mb-4 border-b border-gray-300 pb-1 flex items-center gap-2">
                    {category === 'hot_rolls' ? '🍣' : '🍥'} {t(`sushi_categories.${category}`)}
                  </h4>

                  {items.map(({ name, description, price }) => {
                    const count = formData.upsell_items[name] || 0;
                    return (
                      <div
                        key={name}
                        className="flex justify-between items-center p-3 rounded-xl shadow-sm border mb-4 bg-white"
                      >
                        <div>
                          <span className="font-medium text-gray-800">{name}</span>
                          <p className="text-sm text-gray-600">
                            {t(`sushi_items.${name}.description`)} — ${price}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                upsell_items: {
                                  ...prev.upsell_items,
                                  [name]: Math.max((prev.upsell_items[name] || 0) - 1, 0),
                                },
                              }))
                            }
                            className="bg-gray-200 px-2 rounded text-lg"
                          >
                            -
                          </button>
                          <span className="min-w-[20px] text-center">{count}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                upsell_items: {
                                  ...prev.upsell_items,
                                  [name]: (prev.upsell_items[name] || 0) + 1,
                                },
                              }))
                            }
                            className="bg-gray-200 px-2 rounded text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    // Option A: Skip Upsell (Clear selection and submit)
                    const emptyUpsell = {};
                    finalizeReservation(emptyUpsell);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  No, Thanks
                </button>

                <button
                  onClick={() => {
                    // Option B: Confirm Upsell
                    finalizeReservation(formData.upsell_items);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Add to Order
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default ReservationForm;
